import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { planService, Plan, PlanLimits } from '../services/planService'

export const usePlan = () => {
  const { profile } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlan = async () => {
      if (!profile?.organization_id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const plan = await planService.getCurrentPlan(profile.organization_id)
        setCurrentPlan(plan)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plan')
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [profile?.organization_id])

  const canUseFeature = (feature: keyof PlanLimits): boolean => {
    if (!currentPlan) return false
    return planService.canUseFeature(currentPlan, feature)
  }

  const canAddEmployee = (currentEmployeeCount: number): boolean => {
    if (!currentPlan) return false
    return planService.canAddEmployee(currentPlan, currentEmployeeCount)
  }

  const getRestrictionMessage = (feature: keyof PlanLimits): string => {
    if (!currentPlan) return 'Plan information not available'
    return planService.getRestrictionMessage(feature, currentPlan)
  }

  const canSendCheckIn = (lastSentDate: Date): boolean => {
    if (!currentPlan) return false
    return planService.canSendCheckIn(currentPlan, lastSentDate)
  }

  const getCheckInFrequencyMessage = (): string => {
    if (!currentPlan) return 'Unknown frequency'
    
    switch (currentPlan.limits.checkInFrequency) {
      case 'daily':
        return 'You can send check-ins daily'
      case 'weekly':
        return 'You can send check-ins weekly'
      case 'monthly':
        return 'You can send check-ins monthly'
      default:
        return 'Check-in frequency not defined'
    }
  }

  return {
    currentPlan,
    loading,
    error,
    canUseFeature,
    canAddEmployee,
    getRestrictionMessage,
    canSendCheckIn,
    getCheckInFrequencyMessage,
    refreshPlan: () => {
      if (profile?.organization_id) {
        planService.getCurrentPlan(profile.organization_id).then(setCurrentPlan)
      }
    }
  }
}
