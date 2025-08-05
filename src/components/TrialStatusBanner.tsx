import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Star, CreditCard, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { trialService, TrialStatus } from '@/services/trialService'
import { PLANS } from '@/services/planService'

interface TrialStatusBannerProps {
  onUpgradeClick?: () => void
  onDismiss?: () => void
  showDismiss?: boolean
}

export const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({
  onUpgradeClick,
  onDismiss,
  showDismiss = false
}) => {
  const { profile } = useAuth()
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!profile?.organization_id) return

      try {
        setLoading(true)
        const status = await trialService.getTrialStatus(profile.organization_id)
        setTrialStatus(status)
      } catch (error) {
        console.error('Error fetching trial status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrialStatus()
  }, [profile?.organization_id])

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const formatDaysRemaining = (days: number) => {
    if (days === 0) return 'Today'
    if (days === 1) return '1 day'
    return `${days} days`
  }

  const getCurrentPlan = () => {
    if (!trialStatus) return null
    return PLANS[trialStatus.planName]
  }

  if (loading || !trialStatus || !trialStatus.isOnTrial || dismissed) {
    return null
  }

  const currentPlan = getCurrentPlan()
  const isExpired = trialStatus.hasExpired
  const isExpiringSoon = trialStatus.isExpiringSoon

  // Expired trial banner
  if (isExpired) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100">
                  Trial Expired
                </h4>
                <p className="text-sm text-red-700 dark:text-red-200">
                  Your {currentPlan?.name} trial has ended. Upgrade now to continue using premium features.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={onUpgradeClick}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
              {showDismiss && (
                <Button variant="ghost" size="sm" onClick={handleDismiss}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Expiring soon banner
  if (isExpiringSoon) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                  Trial Ending Soon
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-200">
                  Your {currentPlan?.name} trial ends in {formatDaysRemaining(trialStatus.daysRemaining)}. 
                  Upgrade to keep your premium features.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={onUpgradeClick}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
              {showDismiss && (
                <Button variant="ghost" size="sm" onClick={handleDismiss}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Active trial banner
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-blue-500" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  {currentPlan?.name} Trial Active
                </h4>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {formatDaysRemaining(trialStatus.daysRemaining)} remaining
                </Badge>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                You're enjoying full access to {currentPlan?.name} features. 
                Upgrade anytime to continue after your trial.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onUpgradeClick}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade Early
            </Button>
            {showDismiss && (
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Trial Features Highlight */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-600 dark:text-blue-300">
            Trial includes: {currentPlan?.features.slice(0, 3).join(' • ')}
            {currentPlan?.features.length > 3 && ` • +${currentPlan.features.length - 3} more`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for trial status
export const useTrialStatus = () => {
  const { profile } = useAuth()
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!profile?.organization_id) return

      try {
        setLoading(true)
        const status = await trialService.getTrialStatus(profile.organization_id)
        setTrialStatus(status)
      } catch (error) {
        console.error('Error fetching trial status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrialStatus()

    // Set up real-time monitoring - check every hour
    const interval = setInterval(fetchTrialStatus, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [profile?.organization_id])

  const refreshTrialStatus = async () => {
    if (!profile?.organization_id) return

    try {
      const status = await trialService.getTrialStatus(profile.organization_id)
      setTrialStatus(status)
    } catch (error) {
      console.error('Error refreshing trial status:', error)
    }
  }

  return {
    trialStatus,
    loading,
    refreshTrialStatus,
    isOnTrial: trialStatus?.isOnTrial || false,
    isExpired: trialStatus?.hasExpired || false,
    isExpiringSoon: trialStatus?.isExpiringSoon || false,
    daysRemaining: trialStatus?.daysRemaining || 0
  }
}
