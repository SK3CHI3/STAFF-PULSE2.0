import { useState, useEffect } from 'react'
import { supabaseConfig } from '../lib/supabase'

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
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_platform_growth`, {
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
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_organizations_list`, {
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
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_platform_feedback`, {
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
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_system_metrics`, {
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
