import { useState, useEffect } from 'react'
import { supabase, supabaseConfig } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TimelineOption, getDateRange, formatDateForQuery, getDateGrouping } from '../components/charts/TimelineSelector'

interface ChartDataState<T> {
  data: T[]
  loading: boolean
  error: string | null
}

// Hook for mood trend data
export const useMoodTrendData = (timeline: TimelineOption) => {
  const { profile } = useAuth()
  const [state, setState] = useState<ChartDataState<any>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchMoodTrendData = async () => {
      if (!profile) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { startDate, endDate } = getDateRange(timeline)
        const grouping = getDateGrouping(timeline)

        // Use REST API approach since Supabase client was hanging
        const daysMap = {
          '7d': 7,
          '1m': 30,
          '3m': 90,
          '6m': 180,
          '1y': 365
        }

        const days = daysMap[timeline]
        const orgId = profile.role === 'hr_manager' ? profile.organization_id : null

        if (!orgId) {
          throw new Error('Organization ID not found')
        }

        // Use the database function via REST API
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_mood_trend_data`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: orgId,
            days_back: days
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Data is already formatted by the database function
        setState({
          data: data || [],
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch mood trend data'
        }))
      }
    }

    fetchMoodTrendData()
  }, [timeline, profile])

  return state
}

// Hook for department wellness data
export const useDepartmentWellnessData = (timeline: TimelineOption) => {
  const { profile } = useAuth()
  const [state, setState] = useState<ChartDataState<any>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!profile) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const daysMap = {
          '7d': 7,
          '1m': 30,
          '3m': 90,
          '6m': 180,
          '1y': 365
        }

        const days = daysMap[timeline]
        const orgId = profile.role === 'hr_manager' ? profile.organization_id : null

        if (!orgId) {
          throw new Error('Organization ID not found')
        }

        // Use the database function via REST API
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_department_wellness_data`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: orgId,
            days_back: days
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Validate and clean department wellness data
        const cleanedData = Array.isArray(data) ? data.filter(item =>
          item &&
          typeof item === 'object' &&
          item.department &&
          typeof item.department === 'string' &&
          item.department.trim() !== '' &&
          typeof item.mood === 'number' &&
          !isNaN(item.mood)
        ) : []

        // Log data for debugging if there were issues
        if (data && data.length !== cleanedData.length) {
          console.warn('Department wellness data cleaned:', {
            original: data.length,
            cleaned: cleanedData.length,
            removed: data.length - cleanedData.length
          })
        }

        setState({
          data: cleanedData,
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch department data'
        }))
      }
    }

    fetchDepartmentData()
  }, [timeline, profile])

  return state
}

// Hook for engagement metrics
export const useEngagementData = (timeline: TimelineOption) => {
  const { profile } = useAuth()
  const [state, setState] = useState<ChartDataState<any>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchEngagementData = async () => {
      if (!profile) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const daysMap = {
          '7d': 7,
          '1m': 30,
          '3m': 90,
          '6m': 180,
          '1y': 365
        }

        const days = daysMap[timeline]
        const orgId = profile.role === 'hr_manager' ? profile.organization_id : null

        if (!orgId) {
          throw new Error('Organization ID not found')
        }

        // Use the database function via REST API
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_engagement_data`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: orgId,
            days_back: days
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setState({
          data: data || [],
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch engagement data'
        }))
      }
    }

    fetchEngagementData()
  }, [timeline, profile])

  return state
}

// Hook for dashboard stats
export const useDashboardStats = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    data: any
    loading: boolean
    error: string | null
  }>({
    data: {},
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.organization_id) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_organization_stats`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: profile.organization_id,
            days_back: 30
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setState({
          data: data || {},
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
        }))
      }
    }

    fetchStats()
  }, [profile?.organization_id])

  return state
}

// Hook for recent responses
export const useRecentResponses = (limit: number = 10) => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    data: any[]
    loading: boolean
    error: string | null
  }>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchResponses = async () => {
      if (!profile?.organization_id) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_recent_responses`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: profile.organization_id,
            limit_count: limit
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setState({
          data: data || [],
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch recent responses'
        }))
      }
    }

    fetchResponses()
  }, [profile?.organization_id, limit])

  return state
}

// Hook for mood distribution
export const useMoodDistribution = (timeline: TimelineOption = '1m') => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    data: any[]
    loading: boolean
    error: string | null
  }>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchMoodDistribution = async () => {
      if (!profile?.organization_id) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const daysMap = {
          '7d': 7,
          '1m': 30,
          '3m': 90,
          '6m': 180,
          '1y': 365
        }

        const days = daysMap[timeline]

        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_mood_distribution`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: profile.organization_id,
            days_back: days
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setState({
          data: data || [],
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch mood distribution'
        }))
      }
    }

    fetchMoodDistribution()
  }, [profile?.organization_id, timeline])

  return state
}

// Hook for team/department data
export const useTeamData = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    data: any[]
    loading: boolean
    error: string | null
  }>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!profile?.organization_id) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_team_data`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: profile.organization_id
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setState({
          data: data || [],
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch team data'
        }))
      }
    }

    fetchTeamData()
  }, [profile?.organization_id])

  return state
}

// Hook for employee management stats
export const useEmployeeStats = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    data: any
    loading: boolean
    error: string | null
  }>({
    data: {},
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchEmployeeStats = async () => {
      if (!profile?.organization_id) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_employee_stats`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: profile.organization_id
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setState({
          data: data || {},
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch employee stats'
        }))
      }
    }

    fetchEmployeeStats()
  }, [profile?.organization_id])

  return state
}

// Hook for employees list
export const useEmployeesList = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    data: any[]
    loading: boolean
    error: string | null
  }>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchEmployeesList = async () => {
      if (!profile?.organization_id) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        // Use direct query instead of stored procedure for better control
        const response = await fetch(`${supabaseConfig.url}/rest/v1/employees?organization_id=eq.${profile.organization_id}&select=id,name,email,phone,department,position,is_active,created_at&order=created_at.desc`, {
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Add initials field for each employee
        const processedData = (data || []).map((employee: any) => ({
          ...employee,
          initials: employee.name
            ? employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            : '??'
        }))

        setState({
          data: processedData,
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch employees list'
        }))
      }
    }

    fetchEmployeesList()
  }, [profile?.organization_id])

  return state
}

// Hook for departments list
export const useDepartmentsList = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    data: any[]
    loading: boolean
    error: string | null
  }>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchDepartmentsList = async () => {
      if (!profile?.organization_id) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        // First get departments
        const deptResponse = await fetch(`${supabaseConfig.url}/rest/v1/departments?organization_id=eq.${profile.organization_id}&select=id,name,description,created_at&order=created_at.desc`, {
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`
          }
        })

        if (!deptResponse.ok) {
          throw new Error(`HTTP error! status: ${deptResponse.status}`)
        }

        const departments = await deptResponse.json()

        // Then get employee counts for each department
        const employeeResponse = await fetch(`${supabaseConfig.url}/rest/v1/employees?organization_id=eq.${profile.organization_id}&is_active=eq.true&select=department`, {
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`
          }
        })

        if (!employeeResponse.ok) {
          throw new Error(`HTTP error! status: ${employeeResponse.status}`)
        }

        const employees = await employeeResponse.json()

        // Count employees by department
        const employeeCounts = employees.reduce((acc: any, emp: any) => {
          if (emp.department) {
            acc[emp.department] = (acc[emp.department] || 0) + 1
          }
          return acc
        }, {})

        // Add employee counts to departments
        const departmentsWithCounts = departments.map((dept: any) => ({
          ...dept,
          employee_count: employeeCounts[dept.name] || 0
        }))

        setState({
          data: departmentsWithCounts || [],
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch departments list'
        }))
      }
    }

    fetchDepartmentsList()
  }, [profile?.organization_id])

  return state
}

// Enhanced Hook for AI insights with filtering
export const useAIInsights = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    insights: any[]
    employees: any[]
    loading: boolean
    error: string | null
    generating: boolean
    scope: 'organization' | 'individual' | 'all'
    selectedEmployee: string | null
  }>({
    insights: [],
    employees: [],
    loading: true,
    error: null,
    generating: false,
    scope: 'all',
    selectedEmployee: null
  })

  const generateNewInsights = async (employeeId?: string) => {
    if (!profile?.organization_id) return

    setState(prev => ({ ...prev, generating: true, error: null }))

    try {
      const { aiInsightsService } = await import('../services/aiInsightsService')

      if (employeeId) {
        // Generate individual employee insights
        await aiInsightsService.generateEmployeeInsights(profile.organization_id, employeeId)
      } else {
        // Generate organization insights
        await aiInsightsService.generateInsights(profile.organization_id)
      }

      // Fetch updated insights
      await fetchInsights()
      await fetchEmployees()
    } catch (error) {
      setState(prev => ({
        ...prev,
        generating: false,
        error: error instanceof Error ? error.message : 'Failed to generate insights'
      }))
    }
  }

  const fetchInsights = async (scope?: 'organization' | 'individual', employeeId?: string) => {
    if (!profile?.organization_id) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { aiInsightsService } = await import('../services/aiInsightsService')
      const insights = await aiInsightsService.getStoredInsights(
        profile.organization_id,
        scope,
        employeeId
      )

      setState(prev => ({
        ...prev,
        insights: insights || [],
        loading: false,
        error: null,
        generating: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        generating: false,
        error: error instanceof Error ? error.message : 'Failed to fetch insights'
      }))
    }
  }

  const fetchEmployees = async () => {
    if (!profile?.organization_id) return

    try {
      const { aiInsightsService } = await import('../services/aiInsightsService')
      const employees = await aiInsightsService.getAllEmployeesWithInsights(profile.organization_id)

      setState(prev => ({
        ...prev,
        employees: employees || []
      }))
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const setScope = (newScope: 'organization' | 'individual' | 'all') => {
    setState(prev => ({ ...prev, scope: newScope, selectedEmployee: null }))

    if (newScope === 'all') {
      fetchInsights()
    } else {
      fetchInsights(newScope)
    }
  }

  const setSelectedEmployee = (employeeId: string | null) => {
    setState(prev => ({ ...prev, selectedEmployee: employeeId }))

    if (employeeId) {
      fetchInsights('individual', employeeId)
    } else {
      fetchInsights(state.scope === 'all' ? undefined : state.scope)
    }
  }

  useEffect(() => {
    fetchInsights()
    fetchEmployees()
  }, [profile?.organization_id])

  return {
    ...state,
    generateNewInsights,
    refreshInsights: fetchInsights,
    setScope,
    setSelectedEmployee,
    refreshEmployees: fetchEmployees
  }
}

// Hook for check-in campaigns
export const useCheckInCampaigns = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    campaigns: any[]
    loading: boolean
    error: string | null
  }>({
    campaigns: [],
    loading: true,
    error: null
  })

  const fetchCampaigns = async () => {
    if (!profile?.organization_id) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_checkin_campaigns`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_id: profile.organization_id,
          limit_count: 50
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status}`)
      }

      const campaigns = await response.json()

      setState({
        campaigns: campaigns || [],
        loading: false,
        error: null
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch campaigns'
      }))
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [profile?.organization_id])

  return {
    ...state,
    refreshCampaigns: fetchCampaigns
  }
}

// Hook for check-in targets (employees and departments)
export const useCheckInTargets = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<{
    data: any
    loading: boolean
    error: string | null
  }>({
    data: { departments: [], employees: [], stats: {} },
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchTargets = async () => {
      if (!profile?.organization_id) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_checkin_targets`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            org_id: profile.organization_id
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch targets: ${response.status}`)
        }

        const data = await response.json()

        setState({
          data: data || { departments: [], employees: [], stats: {} },
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch targets'
        }))
      }
    }

    fetchTargets()
  }, [profile?.organization_id])

  return state
}

// Helper functions for data processing
const groupDataByDate = (data: any[], grouping: 'day' | 'week' | 'month') => {
  const grouped: { [key: string]: { total: number; count: number; responses: number } } = {}

  data.forEach(item => {
    const date = new Date(item.created_at)
    let key: string

    switch (grouping) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
    }

    if (!grouped[key]) {
      grouped[key] = { total: 0, count: 0, responses: 0 }
    }

    grouped[key].total += item.mood_score
    grouped[key].count += 1
    grouped[key].responses += 1
  })

  return Object.entries(grouped)
    .map(([date, stats]) => ({
      date: formatDateLabel(date, grouping),
      mood: Number((stats.total / stats.count).toFixed(1)),
      responses: stats.responses
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const groupDataByDepartment = (data: any[]) => {
  const grouped: { [key: string]: { total: number; count: number } } = {}

  data.forEach(item => {
    const department = item.employees.department
    if (!grouped[department]) {
      grouped[department] = { total: 0, count: 0 }
    }
    grouped[department].total += item.mood_score
    grouped[department].count += 1
  })

  return Object.entries(grouped).map(([department, stats]) => ({
    department,
    mood: Number((stats.total / stats.count).toFixed(1)),
    count: stats.count
  }))
}

const calculateEngagementMetrics = (checkIns: any[], employees: any[], grouping: 'day' | 'week' | 'month') => {
  // Implementation for engagement metrics calculation
  const totalEmployees = employees.length
  const grouped = groupDataByDate(checkIns, grouping)

  return grouped.map(item => ({
    ...item,
    responseRate: totalEmployees > 0 ? Math.round((item.responses / totalEmployees) * 100) : 0
  }))
}

const formatDateLabel = (dateStr: string, grouping: 'day' | 'week' | 'month'): string => {
  const date = new Date(dateStr)
  
  switch (grouping) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'week':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    default:
      return dateStr
  }
}
