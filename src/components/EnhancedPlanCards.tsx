import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, CreditCard, Star, TrendingUp } from 'lucide-react'
import { PLANS, Plan } from '@/services/planService'
import { usePlan } from '@/hooks/usePlan'
import { useAuth } from '@/contexts/AuthContext'

interface EnhancedPlanCardsProps {
  showComparison?: boolean
  highlightDifferences?: boolean
}

export const EnhancedPlanCards: React.FC<EnhancedPlanCardsProps> = ({
  showComparison = true,
  highlightDifferences = true
}) => {
  const { currentPlan } = usePlan()
  const { user, profile } = useAuth()

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount)
  }



  const renderPlanCard = (plan: Plan) => {
    const isCurrentPlan = currentPlan?.id === plan.id
    const isPopular = plan.popular

    return (
      <Card
        key={plan.id}
        className={`relative transition-all duration-300 hover:shadow-lg ${
          isCurrentPlan ? 'ring-2 ring-green-400 bg-green-50/50' : 'bg-white'
        } ${isPopular ? 'border-2 border-purple-200 bg-purple-50/30' : 'border border-gray-200'} ${
          plan.id === 'startup' && !isCurrentPlan && !isPopular ? 'hover:border-blue-300' :
          plan.id === 'enterprise' && !isCurrentPlan && !isPopular ? 'hover:border-indigo-300' : ''
        }`}
      >
        {isCurrentPlan && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge variant="default" className="bg-blue-500 text-white">
              Current Plan
            </Badge>
          </div>
        )}
        
        {isPopular && !isCurrentPlan && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
          </div>
        )}

        {plan.savings && (
          <div className="absolute -top-3 right-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {plan.savings}
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
          <CardDescription className="text-base">{plan.description}</CardDescription>
          
          <div className="mt-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">
                {formatCurrency(plan.price, plan.currency)}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ~${plan.priceUSD} USD
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Simple Feature List */}
          <div className="space-y-2">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-4">
            {isCurrentPlan ? (
              <Button className="w-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" disabled>
                <TrendingUp className="w-4 h-4 mr-2" />
                Current Plan
              </Button>
            ) : (
              <button
                className={`intaSendPayButton w-full font-medium py-2.5 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 ${
                  plan.id === 'startup'
                    ? 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                    : plan.id === 'business'
                    ? 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300'
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
                }`}
                data-amount={plan.price.toString()}
                data-currency="KES"
                data-email={user?.email || "hr@company.com"}
                data-api_ref={`staffpulse-${plan.id}-upgrade`}
                data-comment={`StaffPulse ${plan.name} Plan Upgrade`}
                data-first_name={profile?.full_name?.split(' ')[0] || "HR"}
                data-last_name={profile?.full_name?.split(' ')[1] || "Manager"}
                data-country="KE"
                data-card_tarrif="BUSINESS-PAYS"
                data-mobile_tarrif="BUSINESS-PAYS"
              >
                <span>Upgrade to {plan.name}</span>
              </button>
            )}
          </div>


        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          All plans include WhatsApp & SMS integration and secure data handling.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {Object.values(PLANS).map(renderPlanCard)}
      </div>


    </div>
  )
}
