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
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          plan_name: 'startup' | 'business' | 'enterprise'
          status: 'active' | 'cancelled' | 'expired'
          started_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          plan_name: 'startup' | 'business' | 'enterprise'
          status?: 'active' | 'cancelled' | 'expired'
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          plan_name?: 'startup' | 'business' | 'enterprise'
          status?: 'active' | 'cancelled' | 'expired'
          started_at?: string
          expires_at?: string | null
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          organization_id: string
          subscription_id: string | null
          amount: number
          currency: string
          payment_ref: string
          provider: string
          status: 'completed' | 'pending' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          subscription_id?: string | null
          amount: number
          currency?: string
          payment_ref: string
          provider?: string
          status?: 'completed' | 'pending' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          subscription_id?: string | null
          amount?: number
          currency?: string
          payment_ref?: string
          provider?: string
          status?: 'completed' | 'pending' | 'failed'
        }
      }
      subscription_events: {
        Row: {
          id: string
          organization_id: string
          subscription_id: string | null
          event_type: 'created' | 'upgraded' | 'downgraded' | 'renewed' | 'cancelled' | 'expired' | 'reactivated'
          from_plan: string | null
          to_plan: string | null
          amount: number | null
          currency: string | null
          details: any | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          subscription_id?: string | null
          event_type: 'created' | 'upgraded' | 'downgraded' | 'renewed' | 'cancelled' | 'expired' | 'reactivated'
          from_plan?: string | null
          to_plan?: string | null
          amount?: number | null
          currency?: string | null
          details?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          subscription_id?: string | null
          event_type?: 'created' | 'upgraded' | 'downgraded' | 'renewed' | 'cancelled' | 'expired' | 'reactivated'
          from_plan?: string | null
          to_plan?: string | null
          amount?: number | null
          currency?: string | null
          details?: any | null
        }
      }
      usage_tracking: {
        Row: {
          id: string
          organization_id: string
          feature_type: 'check_in_sent' | 'employee_added' | 'ai_insight_generated' | 'report_generated' | 'api_call'
          quantity: number
          metadata: any | null
          billing_period: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          feature_type: 'check_in_sent' | 'employee_added' | 'ai_insight_generated' | 'report_generated' | 'api_call'
          quantity?: number
          metadata?: any | null
          billing_period?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          feature_type?: 'check_in_sent' | 'employee_added' | 'ai_insight_generated' | 'report_generated' | 'api_call'
          quantity?: number
          metadata?: any | null
          billing_period?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_plan: {
        Args: {
          org_id: string
        }
        Returns: Json
      }
      activate_plan: {
        Args: {
          org_id: string
          plan_name: string
          payment_ref: string
          amount: number
          is_prorated?: boolean
        }
        Returns: Json
      }
      cancel_subscription: {
        Args: {
          org_id: string
          reason?: string
          immediate?: boolean
        }
        Returns: Json
      }
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
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type SubscriptionEvent = Database['public']['Tables']['subscription_events']['Row']
export type UsageTracking = Database['public']['Tables']['usage_tracking']['Row']
