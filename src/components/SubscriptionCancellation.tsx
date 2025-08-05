import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Calendar, CreditCard, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { subscriptionService } from '@/services/subscriptionService'
import { usePlan } from '@/hooks/usePlan'

interface SubscriptionCancellationProps {
  onClose: () => void
  onSuccess: () => void
}

export const SubscriptionCancellation: React.FC<SubscriptionCancellationProps> = ({
  onClose,
  onSuccess
}) => {
  const { profile } = useAuth()
  const { currentPlan } = usePlan()
  const [step, setStep] = useState<'reason' | 'confirm' | 'processing'>('reason')
  const [cancellationType, setCancellationType] = useState<'immediate' | 'end_of_period'>('end_of_period')
  const [reason, setReason] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [loading, setLoading] = useState(false)

  const cancellationReasons = [
    'Too expensive',
    'Not using enough features',
    'Found a better alternative',
    'Technical issues',
    'Company downsizing',
    'Temporary pause',
    'Other'
  ]

  const handleCancel = async () => {
    if (!profile?.organization_id) return

    try {
      setLoading(true)
      setStep('processing')

      const finalReason = selectedReason === 'Other' ? reason : selectedReason
      const immediate = cancellationType === 'immediate'

      await subscriptionService.cancelSubscription(
        profile.organization_id,
        finalReason,
        immediate
      )

      // Show success and close
      onSuccess()
      
      // Use toast notification if available
      if ((window as any).toast) {
        (window as any).toast.showSuccess(
          'Subscription Cancelled',
          immediate 
            ? 'Your subscription has been cancelled immediately.'
            : 'Your subscription will be cancelled at the end of the current billing period.'
        )
      }

    } catch (error) {
      console.error('Error cancelling subscription:', error)
      
      if ((window as any).toast) {
        (window as any).toast.showError(
          'Cancellation Failed',
          'There was an error cancelling your subscription. Please contact support.'
        )
      } else {
        alert('Failed to cancel subscription. Please contact support.')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderReasonStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Why are you cancelling?</h3>
        <p className="text-sm text-muted-foreground">
          Help us improve by letting us know why you're leaving
        </p>
      </div>

      <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
        <div className="space-y-3">
          {cancellationReasons.map((reasonOption) => (
            <div key={reasonOption} className="flex items-center space-x-2">
              <RadioGroupItem value={reasonOption} id={reasonOption} />
              <Label htmlFor={reasonOption} className="text-sm">
                {reasonOption}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {selectedReason === 'Other' && (
        <div>
          <Label htmlFor="custom-reason" className="text-sm font-medium">
            Please specify
          </Label>
          <Textarea
            id="custom-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us more about your reason for cancelling..."
            className="mt-1"
          />
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-3">When should we cancel your subscription?</h4>
        <RadioGroup value={cancellationType} onValueChange={setCancellationType as any}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="end_of_period" id="end_of_period" />
              <Label htmlFor="end_of_period" className="text-sm">
                At the end of current billing period (Recommended)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="immediate" id="immediate" />
              <Label htmlFor="immediate" className="text-sm">
                Cancel immediately (No refund)
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Keep Subscription
        </Button>
        <Button
          onClick={() => setStep('confirm')}
          disabled={!selectedReason}
          variant="destructive"
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <div>
          <h4 className="font-medium text-red-900">Confirm Cancellation</h4>
          <p className="text-sm text-red-700">
            This action cannot be undone. Please review the details below.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm font-medium">Current Plan</span>
          <Badge variant="outline">{currentPlan?.name}</Badge>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm font-medium">Monthly Cost</span>
          <span className="font-medium">
            KES {currentPlan?.price.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm font-medium">Cancellation Type</span>
          <span className="font-medium">
            {cancellationType === 'immediate' ? 'Immediate' : 'End of billing period'}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm font-medium">Reason</span>
          <span className="font-medium text-right max-w-[200px] truncate">
            {selectedReason === 'Other' ? reason : selectedReason}
          </span>
        </div>
      </div>

      {cancellationType === 'end_of_period' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-900">
              What happens next?
            </span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• You'll continue to have access until your next billing date</li>
            <li>• No further charges will be made</li>
            <li>• You can reactivate anytime before the cancellation date</li>
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep('reason')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleCancel}
          disabled={loading}
          variant="destructive"
          className="flex-1"
        >
          {loading ? 'Cancelling...' : 'Confirm Cancellation'}
        </Button>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold mb-2">Processing Cancellation</h3>
      <p className="text-muted-foreground">
        Please wait while we process your cancellation request...
      </p>
    </div>
  )

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Cancel Subscription
          </CardTitle>
          <CardDescription>
            We're sorry to see you go. Let us know how we can improve.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {step === 'reason' && renderReasonStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'processing' && renderProcessingStep()}
      </CardContent>
    </Card>
  )
}
