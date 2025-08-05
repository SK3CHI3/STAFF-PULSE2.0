import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, TrendingUp, X } from 'lucide-react'

interface UpgradeNoticeProps {
  featureName: string
  currentPlan: string
  requiredPlan: string
  description: string
  onUpgrade: () => void
  onClose?: () => void
  showClose?: boolean
}

export const UpgradeNotice: React.FC<UpgradeNoticeProps> = ({
  featureName,
  currentPlan,
  requiredPlan,
  description,
  onUpgrade,
  onClose,
  showClose = true
}) => {
  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'startup':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'business':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'enterprise':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Upgrade Required
              </h3>
              <p className="text-sm text-gray-600">
                {featureName} is not available in your current plan
              </p>
            </div>
          </div>
          {showClose && onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {description}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Current Plan:</span>
              <Badge className={getPlanColor(currentPlan)}>
                {currentPlan}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Required Plan:</span>
              <Badge className={getPlanColor(requiredPlan)}>
                {requiredPlan}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 pt-0">
          <Button
            onClick={onUpgrade}
            className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Upgrade to {requiredPlan}
          </Button>
          {showClose && onClose && (
            <Button variant="outline" onClick={onClose} className="px-6">
              Maybe Later
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for showing upgrade notices
export const useUpgradeNotice = () => {
  const [showNotice, setShowNotice] = React.useState(false)
  const [noticeProps, setNoticeProps] = React.useState<Partial<UpgradeNoticeProps>>({})

  const showUpgradeNotice = (props: Omit<UpgradeNoticeProps, 'onUpgrade' | 'onClose'>) => {
    setNoticeProps(props)
    setShowNotice(true)
  }

  const hideUpgradeNotice = () => {
    setShowNotice(false)
    setNoticeProps({})
  }

  return {
    showNotice,
    noticeProps,
    showUpgradeNotice,
    hideUpgradeNotice
  }
}
