import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TimelineOption, getDateRange, formatDateForQuery, getDateGrouping } from '../components/charts/TimelineSelector'

interface ChartDataState<T> {
  data: T[]
  loading: boolean
  error: string | null
}

// Hook for platform growth data (organizations and employees over time)
export const usePlatformGrowthData = (timeline: TimelineOption) => {
  const [state, setState] = useState<ChartDataState<any>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchPlatformGrowthData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { startDate, endDate } = getDateRange(timeline)
        const grouping = getDateGrouping(timeline)

        // Get organizations created over time
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('created_at')
          .gte('created_at', formatDateForQuery(startDate))
          .lte('created_at', formatDateForQuery(endDate))

        if (orgsError) throw orgsError

        // Get employees created over time
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('created_at')
          .gte('created_at', formatDateForQuery(startDate))
          .lte('created_at', formatDateForQuery(endDate))

        if (employeesError) throw employeesError

        // Process and group the data
        const growthData = processGrowthData(orgsData || [], employeesData || [], grouping)
        
        setState({
          data: growthData,
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch platform growth data'
        }))
      }
    }

    fetchPlatformGrowthData()
  }, [timeline])

  return state
}

// Hook for revenue analytics (based on organization plans)
export const useRevenueData = (timeline: TimelineOption) => {
  const [state, setState] = useState<ChartDataState<any>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchRevenueData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { startDate, endDate } = getDateRange(timeline)
        const grouping = getDateGrouping(timeline)

        // Get actual completed payments for real revenue calculation
        const { data: paymentsData, error } = await supabase
          .from('payments')
          .select('amount, currency, created_at, status')
          .eq('status', 'completed')
          .gte('created_at', formatDateForQuery(startDate))
          .lte('created_at', formatDateForQuery(endDate))

        if (error) throw error

        // Calculate revenue based on actual payments
        const revenueData = calculateRealRevenueData(paymentsData || [], grouping)

        setState({
          data: revenueData,
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch revenue data'
        }))
      }
    }

    fetchRevenueData()
  }, [timeline])

  return state
}

// Hook for user engagement metrics across all organizations
export const useUserEngagementData = (timeline: TimelineOption) => {
  const [state, setState] = useState<ChartDataState<any>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchEngagementData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { startDate, endDate } = getDateRange(timeline)
        const grouping = getDateGrouping(timeline)

        // Get check-ins data
        const { data: checkInsData, error: checkInsError } = await supabase
          .from('check_ins')
          .select('created_at, mood_score')
          .gte('created_at', formatDateForQuery(startDate))
          .lte('created_at', formatDateForQuery(endDate))

        if (checkInsError) throw checkInsError

        // Get total active employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id')
          .eq('is_active', true)

        if (employeesError) throw employeesError

        // Process engagement data
        const engagementData = processEngagementData(
          checkInsData || [], 
          employeesData?.length || 0, 
          grouping
        )
        
        setState({
          data: engagementData,
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
  }, [timeline])

  return state
}

// Hook for organization distribution data
export const useOrganizationDistributionData = () => {
  const [state, setState] = useState<ChartDataState<any>>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchDistributionData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        // Get organizations with employee counts
        const { data: orgsData, error } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            created_at,
            employees(count)
          `)

        if (error) throw error

        // Process distribution data (categorize by size)
        const distributionData = processOrganizationDistribution(orgsData || [])
        
        setState({
          data: distributionData,
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch organization distribution data'
        }))
      }
    }

    fetchDistributionData()
  }, [])

  return state
}

// Helper functions for data processing
const processGrowthData = (orgsData: any[], employeesData: any[], grouping: 'day' | 'week' | 'month') => {
  const grouped: { [key: string]: { organizations: number; employees: number } } = {}

  // Process organizations
  orgsData.forEach(org => {
    const key = getDateKey(new Date(org.created_at), grouping)
    if (!grouped[key]) grouped[key] = { organizations: 0, employees: 0 }
    grouped[key].organizations += 1
  })

  // Process employees
  employeesData.forEach(emp => {
    const key = getDateKey(new Date(emp.created_at), grouping)
    if (!grouped[key]) grouped[key] = { organizations: 0, employees: 0 }
    grouped[key].employees += 1
  })

  return Object.entries(grouped)
    .map(([date, stats]) => ({
      date: formatDateLabel(date, grouping),
      organizations: stats.organizations,
      employees: stats.employees
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const calculateRealRevenueData = (paymentsData: any[], grouping: 'day' | 'week' | 'month') => {
  const grouped: { [key: string]: number } = {}

  paymentsData.forEach(payment => {
    const key = getDateKey(new Date(payment.created_at), grouping)
    if (!grouped[key]) grouped[key] = 0

    // Convert amount to number and add to revenue
    const amount = parseFloat(payment.amount) || 0
    grouped[key] += amount
  })

  return Object.entries(grouped)
    .map(([date, revenue]) => ({
      date: formatDateLabel(date, grouping),
      revenue
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const processEngagementData = (checkInsData: any[], totalEmployees: number, grouping: 'day' | 'week' | 'month') => {
  const grouped: { [key: string]: { checkIns: number; totalMood: number; responses: number } } = {}

  checkInsData.forEach(checkIn => {
    const key = getDateKey(new Date(checkIn.created_at), grouping)
    if (!grouped[key]) grouped[key] = { checkIns: 0, totalMood: 0, responses: 0 }
    grouped[key].checkIns += 1
    grouped[key].totalMood += checkIn.mood_score
    grouped[key].responses += 1
  })

  return Object.entries(grouped)
    .map(([date, stats]) => ({
      date: formatDateLabel(date, grouping),
      checkIns: stats.checkIns,
      responses: stats.responses,
      satisfaction: stats.responses > 0 ? Math.round((stats.totalMood / stats.responses) * 10) : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const processOrganizationDistribution = (orgsData: any[]) => {
  const distribution = {
    'Small (1-20)': { active: 0, trial: 0, suspended: 0 },
    'Medium (21-100)': { active: 0, trial: 0, suspended: 0 },
    'Large (100+)': { active: 0, trial: 0, suspended: 0 }
  }

  orgsData.forEach(org => {
    const employeeCount = org.employees?.[0]?.count || 0
    let category: keyof typeof distribution

    if (employeeCount <= 20) category = 'Small (1-20)'
    else if (employeeCount <= 100) category = 'Medium (21-100)'
    else category = 'Large (100+)'

    // Mock status - in real app, you'd have subscription status
    const isRecent = new Date(org.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    if (isRecent) {
      distribution[category].trial += 1
    } else {
      distribution[category].active += 1
    }
  })

  return Object.entries(distribution).map(([plan, stats]) => ({
    plan,
    ...stats
  }))
}

const getDateKey = (date: Date, grouping: 'day' | 'week' | 'month'): string => {
  switch (grouping) {
    case 'day':
      return date.toISOString().split('T')[0]
    case 'week':
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      return weekStart.toISOString().split('T')[0]
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
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
