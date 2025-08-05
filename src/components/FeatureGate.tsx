import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, CreditCard, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { trialService } from '@/services/trialService'

interface FeatureGateProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
  onUpgradeClick?: () => void
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  onUpgradeClick
}) => {
  const { profile } = useAuth()
  const [canAccess, setCanAccess] = useState(true)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState<string>('')

  useEffect(() => {
    const checkAccess = async () => {
      if (!profile?.organization_id) return

      try {
        setLoading(true)
        const result = await trialService.canUseFeature(profile.organization_id, feature)
        setCanAccess(result.allowed)
        setReason(result.reason || '')
      } catch (error) {
        console.error('Error checking feature access:', error)
        setCanAccess(false)
        setReason('Unable to verify feature access')
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [profile?.organization_id, feature])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    )
  }

  if (canAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  // Default restriction UI - NO FREE TIER
  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
              Subscription Required
            </h3>
            <p className="text-sm text-red-700 dark:text-red-200 max-w-md">
              {reason || 'Your trial has expired. Please upgrade to continue using StaffPulse.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={onUpgradeClick}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Subscribe Now
            </Button>
            <Button variant="outline" size="sm">
              <Star className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </div>

          <div className="text-xs text-red-600 dark:text-red-300">
            Choose a subscription plan to continue using StaffPulse
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for feature access checking
export const useFeatureAccess = (feature: string) => {
  const { profile } = useAuth()
  const [canAccess, setCanAccess] = useState(true)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState<string>('')

  useEffect(() => {
    const checkAccess = async () => {
      if (!profile?.organization_id) return

      try {
        setLoading(true)
        const result = await trialService.canUseFeature(profile.organization_id, feature)
        setCanAccess(result.allowed)
        setReason(result.reason || '')
      } catch (error) {
        console.error('Error checking feature access:', error)
        setCanAccess(false)
        setReason('Unable to verify feature access')
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [profile?.organization_id, feature])

  return {
    canAccess,
    loading,
    reason
  }
}
