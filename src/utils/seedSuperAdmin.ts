import { supabase } from '../lib/supabase'

/**
 * Creates the initial super admin user if none exists
 * This should be run once during initial setup
 */
export const seedSuperAdmin = async (
  email: string = 'admin@staffpulse.com',
  password: string = 'SuperAdmin123!',
  fullName: string = 'Super Administrator'
) => {
  try {
    console.log('🌱 [SEED] Checking for existing super admin...')
    
    // Check if super admin already exists
    const { data: existingSuperAdmin } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('role', 'super_admin')
      .limit(1)

    if (existingSuperAdmin && existingSuperAdmin.length > 0) {
      console.log('✅ [SEED] Super admin already exists:', existingSuperAdmin[0].full_name)
      return { 
        success: true, 
        message: 'Super admin already exists',
        existing: true 
      }
    }

    console.log('🔐 [SEED] Creating super admin account...')
    
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'super_admin'
        }
      }
    })

    if (authError) {
      console.error('❌ [SEED] Auth creation failed:', authError.message)
      return { 
        success: false, 
        error: authError.message 
      }
    }

    if (!authData.user) {
      return { 
        success: false, 
        error: 'User creation returned no data' 
      }
    }

    console.log('👤 [SEED] Auth user created:', authData.user.id)

    // Create the user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        role: 'super_admin',
        full_name: fullName,
        organization_id: null // Super admin is not tied to any organization
      })

    if (profileError) {
      console.error('❌ [SEED] Profile creation failed:', profileError.message)
      return { 
        success: false, 
        error: profileError.message 
      }
    }

    console.log('✅ [SEED] Super admin created successfully!')
    console.log('📧 [SEED] Email:', email)
    console.log('🔑 [SEED] Password:', password)
    console.log('⚠️  [SEED] Please change the password after first login!')

    return { 
      success: true, 
      message: 'Super admin created successfully',
      credentials: { email, password },
      userId: authData.user.id
    }

  } catch (error) {
    console.error('💥 [SEED] Unexpected error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Development helper to create super admin with default credentials
 */
export const createDevSuperAdmin = () => {
  return seedSuperAdmin(
    'admin@staffpulse.com',
    'DevAdmin123!',
    'Development Super Admin'
  )
}
