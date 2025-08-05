import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseConfig } from '@/lib/supabase'

interface UnreadReportsState {
  unreadCount: number
  loading: boolean
  error: string | null
}

export const useUnreadReports = () => {
  const { profile } = useAuth()
  const [state, setState] = useState<UnreadReportsState>({
    unreadCount: 0,
    loading: true,
    error: null
  })

  // Get last viewed timestamp from localStorage
  const getLastViewedTimestamp = (): string | null => {
    if (!profile?.organization_id) return null
    return localStorage.getItem(`reports_last_viewed_${profile.organization_id}`)
  }

  // Set last viewed timestamp in localStorage
  const markReportsAsViewed = (): void => {
    if (!profile?.organization_id) return
    const timestamp = new Date().toISOString()
    localStorage.setItem(`reports_last_viewed_${profile.organization_id}`, timestamp)
    setState(prev => ({ ...prev, unreadCount: 0 }))
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!profile?.organization_id) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const lastViewed = getLastViewedTimestamp()
      
      // If no last viewed timestamp, get count of all responses from last 24 hours
      const cutoffTime = lastViewed || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_unread_reports_count`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_id: profile.organization_id,
          last_viewed: cutoffTime
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const count = await response.json()

      setState({
        unreadCount: count || 0,
        loading: false,
        error: null
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch unread count'
      }))
    }
  }

  // Refresh unread count
  const refreshUnreadCount = () => {
    fetchUnreadCount()
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Set up polling to check for new reports every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [profile?.organization_id])

  return {
    ...state,
    markReportsAsViewed,
    refreshUnreadCount
  }
}
