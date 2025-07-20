import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Export config for REST API calls
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey
}

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          industry: string | null
          size: string | null
          location: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          size?: string | null
          location?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          size?: string | null
          location?: string | null
          description?: string | null
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          role: 'hr_manager' | 'super_admin'
          full_name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          role: 'hr_manager' | 'super_admin'
          full_name: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          role?: 'hr_manager' | 'super_admin'
          full_name?: string
          phone?: string | null
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          organization_id: string
          name: string
          email: string
          phone: string | null
          department: string
          position: string | null
          manager_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          email: string
          phone?: string | null
          department: string
          position?: string | null
          manager_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          email?: string
          phone?: string | null
          department?: string
          position?: string | null
          manager_id?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          organization_id: string
          employee_id: string
          mood_score: number
          feedback: string | null
          is_anonymous: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          employee_id: string
          mood_score: number
          feedback?: string | null
          is_anonymous?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          employee_id?: string
          mood_score?: number
          feedback?: string | null
          is_anonymous?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'hr_manager' | 'super_admin'
    }
  }
}

export type UserRole = Database['public']['Enums']['user_role']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Employee = Database['public']['Tables']['employees']['Row']
export type CheckIn = Database['public']['Tables']['check_ins']['Row']
