import { supabase } from '../lib/supabase'

/**
 * Setup database with necessary functions and policies
 * Run this once to set up the database properly
 */
export const setupDatabase = async () => {
  try {
    console.log('🔧 [SETUP] Setting up database...')

    // Create the user profile trigger function
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only create profile if user metadata contains the required fields
        IF NEW.raw_user_meta_data ? 'full_name' AND NEW.raw_user_meta_data ? 'role' THEN
          INSERT INTO public.user_profiles (
            user_id,
            full_name,
            role,
            organization_id,
            phone,
            created_at,
            updated_at
          )
          VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'full_name',
            (NEW.raw_user_meta_data->>'role')::user_role,
            NULL,
            NEW.raw_user_meta_data->>'phone',
            NOW(),
            NOW()
          );
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: triggerFunction 
    })

    if (functionError) {
      console.error('❌ [SETUP] Failed to create trigger function:', functionError)
    } else {
      console.log('✅ [SETUP] Trigger function created')
    }

    // Create the trigger
    const triggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `

    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql: triggerSQL 
    })

    if (triggerError) {
      console.error('❌ [SETUP] Failed to create trigger:', triggerError)
    } else {
      console.log('✅ [SETUP] Trigger created')
    }

    console.log('🎉 [SETUP] Database setup completed')
    return { success: true }

  } catch (error) {
    console.error('💥 [SETUP] Database setup failed:', error)
    return { success: false, error }
  }
}

/**
 * Manual profile creation for users who signed up before the trigger was in place
 */
export const createMissingProfiles = async () => {
  try {
    console.log('🔍 [REPAIR] Looking for users without profiles...')

    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('❌ [REPAIR] Failed to get users:', usersError)
      return { success: false, error: usersError }
    }

    console.log(`📊 [REPAIR] Found ${users.length} auth users`)

    // Get existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id')

    if (profilesError) {
      console.error('❌ [REPAIR] Failed to get profiles:', profilesError)
      return { success: false, error: profilesError }
    }

    const existingProfileUserIds = new Set(profiles?.map(p => p.user_id) || [])
    console.log(`📊 [REPAIR] Found ${existingProfileUserIds.size} existing profiles`)

    // Find users without profiles
    const usersWithoutProfiles = users.filter(user => 
      !existingProfileUserIds.has(user.id) && 
      user.user_metadata?.full_name && 
      user.user_metadata?.role
    )

    console.log(`🔧 [REPAIR] Found ${usersWithoutProfiles.length} users without profiles`)

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ [REPAIR] All users have profiles')
      return { success: true, created: 0 }
    }

    // Create missing profiles
    let created = 0
    for (const user of usersWithoutProfiles) {
      try {
        console.log(`👤 [REPAIR] Creating profile for user: ${user.id}`)

        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata.full_name,
            role: user.user_metadata.role,
            phone: user.user_metadata.phone || null,
            organization_id: null // Will be handled separately for HR managers
          })

        if (insertError) {
          console.error(`❌ [REPAIR] Failed to create profile for ${user.id}:`, insertError)
        } else {
          console.log(`✅ [REPAIR] Profile created for ${user.id}`)
          created++
        }
      } catch (error) {
        console.error(`💥 [REPAIR] Unexpected error creating profile for ${user.id}:`, error)
      }
    }

    console.log(`🎉 [REPAIR] Created ${created} profiles`)
    return { success: true, created }

  } catch (error) {
    console.error('💥 [REPAIR] Profile repair failed:', error)
    return { success: false, error }
  }
}

/**
 * Complete database setup and repair
 */
export const initializeDatabase = async () => {
  console.log('🚀 [INIT] Initializing database...')
  
  const setupResult = await setupDatabase()
  if (!setupResult.success) {
    console.error('❌ [INIT] Database setup failed')
    return setupResult
  }

  const repairResult = await createMissingProfiles()
  if (!repairResult.success) {
    console.error('❌ [INIT] Profile repair failed')
    return repairResult
  }

  console.log('🎉 [INIT] Database initialization completed successfully')
  return { 
    success: true, 
    profilesCreated: repairResult.created 
  }
}
