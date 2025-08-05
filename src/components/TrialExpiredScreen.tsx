import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Clock, CheckCircle, Star } from 'lucide-react'

interface TrialExpiredScreenProps {
  onUpgradeClick: () => void
}

export const TrialExpiredScreen: React.FC<TrialExpiredScreenProps> = ({
  onUpgradeClick
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-red-200 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-red-600" />
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-red-900 dark:text-red-100">
                Trial Expired
              </h1>
              <p className="text-lg text-red-700 dark:text-red-200">
                Your 14-day Business trial has ended
              </p>
            </div>

            {/* Message */}
            <div className="space-y-4 max-w-lg">
              <p className="text-gray-700 dark:text-gray-300">
                Thank you for trying StaffPulse! To continue using our employee wellness platform, 
                please choose a subscription plan that fits your organization's needs.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Don't worry!</strong> All your data is safely stored and will be available 
                  immediately when you subscribe.
                </p>
              </div>
            </div>

            {/* Features Reminder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Employee Check-ins</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>AI Wellness Insights</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Team Analytics</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>WhatsApp Integration</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={onUpgradeClick}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Choose Your Plan
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open('mailto:support@staffpulse.com', '_blank')}
              >
                <Star className="w-5 h-5 mr-2" />
                Contact Sales
              </Button>
            </div>

            {/* Pricing Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-8">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Startup</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$29</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">per month</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Up to 50 employees</p>
              </div>
              
              <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Business</h3>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">$79</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">per month</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Up to 200 employees</p>
                <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded mt-2">Most Popular</div>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Enterprise</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$199</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">per month</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Unlimited employees</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-500 dark:text-gray-500 max-w-md">
              All plans include full access to StaffPulse features with 24/7 support. 
              Cancel anytime. No setup fees.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
