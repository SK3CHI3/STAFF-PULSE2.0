-- Migration: Create automatic user profile creation trigger
-- This ensures that when a user signs up via Supabase Auth, a profile is automatically created

-- First, create a function to handle new user creation
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
      NULL, -- Will be set later for HR managers
      NEW.raw_user_meta_data->>'phone',
      NOW(),
      NOW()
    );
    
    -- If the user is an HR manager and has organization_name, create organization
    IF (NEW.raw_user_meta_data->>'role') = 'hr_manager' AND NEW.raw_user_meta_data ? 'organization_name' THEN
      DECLARE
        org_id UUID;
      BEGIN
        -- Create the organization
        INSERT INTO public.organizations (
          name,
          description,
          created_at,
          updated_at
        )
        VALUES (
          NEW.raw_user_meta_data->>'organization_name',
          'Organization created during user registration',
          NOW(),
          NOW()
        )
        RETURNING id INTO org_id;
        
        -- Update the user profile with the organization ID
        UPDATE public.user_profiles
        SET organization_id = org_id,
            updated_at = NOW()
        WHERE user_id = NEW.id;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.organizations TO anon, authenticated;

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Super admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'super_admin'
    )
  );

-- Create RLS policies for organizations
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid()) AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "HR managers can update own organization" ON public.organizations;
CREATE POLICY "HR managers can update own organization" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM public.user_profiles 
      WHERE user_id = (SELECT auth.uid()) AND role = 'hr_manager'
    )
  );

-- Create function to get user's organization ID (for better RLS performance)
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM public.user_profiles 
    WHERE user_id = (SELECT auth.uid())
  );
END;
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = (SELECT auth.uid()) AND role = 'super_admin'
  );
END;
$$;
