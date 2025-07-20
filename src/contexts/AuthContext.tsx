import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, supabaseConfig, UserProfile, UserRole } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, userData: {
    full_name: string
    role: UserRole
    organization_name?: string
    phone?: string
  }) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 [AUTH] Auth state changed:', event)
        console.log('📋 [AUTH] Session:', session ? 'Present' : 'None')

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('👤 [AUTH] User found, fetching profile for:', session.user.id)
          await fetchUserProfile(session.user.id)
        } else {
          console.log('👤 [AUTH] No user, clearing profile')
          setProfile(null)
        }

        setLoading(false)
        console.log('✅ [AUTH] Auth state change completed')
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('🔍 [PROFILE] Fetching profile for user:', userId)
    console.log('🔧 [PROFILE] Supabase URL:', supabase.supabaseUrl)
    console.log('🔧 [PROFILE] Supabase Key:', supabase.supabaseKey?.substring(0, 20) + '...')

    try {
      // Test with a simple REST API call first
      console.log('🌐 [PROFILE] Testing direct REST API call...')

      const response = await fetch(`${supabaseConfig.url}/rest/v1/user_profiles?user_id=eq.${userId}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      })

      console.log('📡 [PROFILE] REST API response status:', response.status)

      if (!response.ok) {
        console.error('❌ [PROFILE] REST API failed:', response.statusText)
        const errorText = await response.text()
        console.error('❌ [PROFILE] Error response:', errorText)
        return
      }

      const restData = await response.json()
      console.log('✅ [PROFILE] REST API success:', restData)

      if (restData && restData.length > 0) {
        const profile = restData[0]
        console.log('✅ [PROFILE] Profile found via REST API:', {
          id: profile.id,
          role: profile.role,
          full_name: profile.full_name,
          organization_id: profile.organization_id
        })
        setProfile(profile)
        return
      }

      console.warn('⚠️ [PROFILE] No profile found via REST API')

    } catch (error) {
      console.error('❌ [PROFILE] REST API error:', error)

      // Fallback to Supabase client
      console.log('🔄 [PROFILE] Falling back to Supabase client...')

      try {
        const { data, error: supabaseError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)

        if (supabaseError) {
          console.error('❌ [PROFILE] Supabase client error:', supabaseError)
          return
        }

        if (data && data.length > 0) {
          const profile = data[0]
          console.log('✅ [PROFILE] Profile found via Supabase client:', profile)
          setProfile(profile)
        }
      } catch (clientError) {
        console.error('❌ [PROFILE] Supabase client exception:', clientError)
      }
    }
  }

  const createUserProfile = async (userId: string, userData: {
    full_name: string
    role: UserRole
    organization_name?: string
    phone?: string
  }) => {
    let organizationId = null

    // Create organization if user is HR manager and organization name is provided
    if (userData.role === 'hr_manager' && userData.organization_name) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: userData.organization_name,
          description: 'Organization created during user registration'
        })
        .select()
        .single()

      if (orgError) {
        throw new Error(`Failed to create organization: ${orgError.message}`)
      }

      if (orgData) {
        organizationId = orgData.id
      } else {
        throw new Error('Organization creation returned no data')
      }
    }

    // Verify organization linkage for HR managers
    if (userData.role === 'hr_manager' && !organizationId) {
      throw new Error('HR Manager must be linked to an organization')
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        role: userData.role,
        full_name: userData.full_name,
        phone: userData.phone
      })

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [SIGNIN] Starting signin for:', email)

    try {
      console.log('📤 [SIGNIN] Sending request to Supabase...')

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ [SIGNIN] Signin failed:', error.message)
        console.error('❌ [SIGNIN] Error details:', error)
        return { error }
      }

      if (data.user) {
        console.log('✅ [SIGNIN] Signin successful!')
        console.log('👤 [SIGNIN] User data:', {
          id: data.user.id,
          email: data.user.email,
          confirmed: data.user.email_confirmed_at ? 'Yes' : 'No'
        })

        if (data.session) {
          console.log('🎫 [SIGNIN] Session created:', {
            access_token: data.session.access_token ? 'Present' : 'Missing',
            refresh_token: data.session.refresh_token ? 'Present' : 'Missing',
            expires_at: data.session.expires_at
          })
        }
      } else {
        console.warn('⚠️ [SIGNIN] No user data returned')
      }

      console.log('✅ [SIGNIN] Signin process completed')
      return { error: null }

    } catch (error) {
      console.error('❌ [SIGNIN] Unexpected error:', error)
      return { error: error as AuthError }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    userData: {
      full_name: string
      role: UserRole
      organization_name?: string
      phone?: string
    }
  ) => {
    try {
      // Validate super admin constraint
      if (userData.role === 'super_admin') {
        const { data: existingSuperAdmin } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('role', 'super_admin')
          .limit(1)

        if (existingSuperAdmin && existingSuperAdmin.length > 0) {
          return { error: new Error('Super admin already exists. Only one super admin is allowed.') as any }
        }
      }

      // Validate HR manager has organization name
      if (userData.role === 'hr_manager' && (!userData.organization_name || userData.organization_name.trim() === '')) {
        return { error: new Error('HR Manager must provide an organization name') as any }
      }

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
            organization_name: userData.organization_name,
            phone: userData.phone
          }
        }
      })

      if (signUpError) {
        return { error: signUpError }
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (error) {
        return { error: new Error(error.message) }
      }

      // Refresh profile
      await fetchUserProfile(user.id)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
