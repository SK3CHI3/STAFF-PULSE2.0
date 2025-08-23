import { useState, useEffect } from 'react'
import { supabaseConfig, supabase } from '../lib/supabase'

interface AdminDataState<T> {
  data: T
  loading: boolean
  error: string | null
}

// Hook for platform growth data
export const usePlatformGrowth = (timeline: string = '1m') => {
  const [state, setState] = useState<AdminDataState<any[]>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        // Use direct RPC call via supabase client
        const { data, error } = await supabase
          .rpc('get_platform_growth', { timeline: timeline })

        if (error) throw error

        setState({ data: data || [], loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch platform growth'
        }))
      }
    }

    fetchData()
  }, [timeline])

  return state
}

// Hook for usage metrics
export const useUsageMetrics = (weeks: number = 4) => {
  const [state, setState] = useState<AdminDataState<any[]>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_usage_metrics`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ weeks_back: weeks })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setState({ data: data || [], loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch usage metrics'
        }))
      }
    }

    fetchData()
  }, [weeks])

  return state
}

// Hook for organizations list
export const useOrganizationsList = () => {
  const [state, setState] = useState<AdminDataState<any[]>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        // Fetch organizations with their related data
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            industry,
            created_at,
            employees(id, is_active),
            subscriptions(plan_name, status, is_trial, trial_ends_at)
          `)
          .order('created_at', { ascending: false })

        if (orgsError) throw orgsError

        // Process the data to calculate dynamic metrics
        const processedOrgs = await Promise.all(
          (orgsData || []).map(async (org) => {
            // Count active employees
            const employeeCount = org.employees?.filter(e => e.is_active).length || 0

            // Get average mood from last 30 days
            const { data: moodData } = await supabase
              .from('check_ins')
              .select('mood_score, employee_id')
              .eq('organization_id', org.id)
              .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

            const avgMood = moodData && moodData.length > 0
              ? Math.round((moodData.reduce((sum, item) => sum + item.mood_score, 0) / moodData.length) * 10) / 10
              : 0

            // Calculate response rate based on unique employees who responded
            const uniqueResponders = moodData ? new Set(moodData.map(item => item.employee_id)).size : 0
            const responseRate = employeeCount > 0
              ? Math.round((uniqueResponders / employeeCount) * 100)
              : 0

            // Get subscription info
            const subscription = org.subscriptions?.[0]
            const plan = subscription?.plan_name || 'none'
            const mrr = plan === 'startup' ? 29 : plan === 'business' ? 79 : plan === 'enterprise' ? 199 : 0

            // Determine status
            let status = 'inactive'
            if (subscription) {
              if (subscription.is_trial && new Date(subscription.trial_ends_at) > new Date()) {
                status = 'trial'
              } else if (subscription.status === 'active' && !subscription.is_trial) {
                status = 'active'
              } else if (subscription.status === 'expired') {
                status = 'expired'
              }
            }

            // Get last active date
            const { data: lastActivity } = await supabase
              .from('check_ins')
              .select('created_at')
              .eq('organization_id', org.id)
              .order('created_at', { ascending: false })
              .limit(1)

            const lastActive = lastActivity?.[0]?.created_at
              ? new Date(lastActivity[0].created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Never'

            return {
              id: org.id,
              name: org.name,
              industry: org.industry || 'Not specified',
              employees: employeeCount,
              avgMood,
              responseRate,
              mrr,
              plan,
              status,
              lastActive,
              createdAt: org.created_at
            }
          })
        )

        setState({ data: processedOrgs, loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch organizations'
        }))
      }
    }

    fetchData()
  }, [])

  return state
}

// Hook for recent activities
export const useRecentActivities = (limit: number = 10) => {
  const [state, setState] = useState<AdminDataState<any[]>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_recent_activities`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ limit_count: limit })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setState({ data: data || [], loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch recent activities'
        }))
      }
    }

    fetchData()
  }, [limit])

  return state
}

// Hook for system health
export const useSystemHealth = () => {
  const [state, setState] = useState<AdminDataState<any[]>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_system_health`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setState({ data: data || [], loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch system health'
        }))
      }
    }

    fetchData()
  }, [])

  return state
}

// Hook for platform feedback
export const usePlatformFeedback = (limit: number = 10) => {
  const [state, setState] = useState<AdminDataState<any[]>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch('/api/feedback', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setState({ data: data.feedback || [], loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch platform feedback'
        }))
      }
    }

    fetchData()
  }, [limit])

  return state
}

// Hook for organization distribution data
export const useOrganizationDistribution = () => {
  const [state, setState] = useState<AdminDataState<any[]>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_organization_distribution`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setState({ data: data || [], loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch organization distribution'
        }))
      }
    }

    fetchData()
  }, [])

  return state
}

// Hook for system metrics
export const useSystemMetrics = () => {
  const [state, setState] = useState<AdminDataState<any>>({
    data: {},
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        // Use direct RPC call via supabase client
        const { data, error } = await supabase.rpc('get_system_metrics')

        if (error) throw error

        setState({ data: data || {}, loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch system metrics'
        }))
      }
    }

    fetchData()

    // Refresh every 30 seconds for real-time metrics
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return state
}

// Hook for admin profile
export const useAdminProfile = () => {
  const [state, setState] = useState<AdminDataState<any>>({
    data: {},
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_admin_profile`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setState({ data: data || {}, loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch admin profile'
        }))
      }
    }

    fetchData()
  }, [])

  return state
}

// Hook for daily engagement metrics
export const useDailyEngagementMetrics = (timeline: string = '1m') => {
  const [state, setState] = useState<AdminDataState<any[]>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_daily_engagement_metrics`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ timeline: timeline })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setState({ data: data || [], loading: false, error: null })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch daily engagement metrics'
        }))
      }
    }

    fetchData()
  }, [timeline])

  return state
}
