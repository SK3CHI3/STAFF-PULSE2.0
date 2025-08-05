import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export interface PaymentRecord {
  id: string
  organization_id: string
  subscription_id?: string
  amount: number
  currency: string
  payment_ref: string
  provider: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
}

export const usePaymentHistory = () => {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!profile?.organization_id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        setPayments(data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching payment history:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch payment history')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentHistory()
  }, [profile?.organization_id])

  const refreshPayments = () => {
    if (profile?.organization_id) {
      setLoading(true)
      // Re-fetch payments
      supabase
        .from('payments')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data, error }) => {
          if (error) throw error
          setPayments(data || [])
          setError(null)
        })
        .catch((err) => {
          console.error('Error refreshing payment history:', err)
          setError(err instanceof Error ? err.message : 'Failed to refresh payment history')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  return {
    payments,
    loading,
    error,
    refreshPayments
  }
}
