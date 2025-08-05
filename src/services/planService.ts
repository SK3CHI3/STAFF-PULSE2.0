// Plan management and feature restrictions service

export interface PlanLimits {
  maxEmployees: number
  checkInFrequency: 'monthly' | 'weekly' | 'daily'
  analyticsLevel: 'basic' | 'advanced' | 'custom'
  aiInsights: boolean
  individualInsights: boolean
  departmentInsights: boolean
  apiAccess: boolean
  customBranding: boolean
  prioritySupport: boolean
  dedicatedManager: boolean
}

export interface Plan {
  id: string
  name: string
  price: number
  currency: string
  priceUSD: number
  description: string
  features: string[]
  limits: PlanLimits
  popular?: boolean
  savings?: string
}

export const PLANS: Record<string, Plan> = {
  startup: {
    id: 'startup',
    name: 'Startup',
    price: 2500,
    currency: 'KES',
    priceUSD: 19,
    description: 'Perfect for small teams',
    features: [
      'Up to 25 employees',
      'Monthly check-ins',
      'Basic analytics',
      'WhatsApp & SMS integration',
      'Email support'
    ],
    limits: {
      maxEmployees: 25,
      checkInFrequency: 'monthly',
      analyticsLevel: 'basic',
      aiInsights: false,
      individualInsights: false,
      departmentInsights: false,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
      dedicatedManager: false
    }
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 6500,
    currency: 'KES',
    priceUSD: 49,
    description: 'For growing organizations',
    features: [
      'Up to 100 employees',
      'Weekly check-ins',
      'Advanced analytics',
      'AI insights (organization-level)',
      'Department insights',
      'Priority support',
      'Custom branding'
    ],
    limits: {
      maxEmployees: 100,
      checkInFrequency: 'weekly',
      analyticsLevel: 'advanced',
      aiInsights: true,
      individualInsights: false,
      departmentInsights: true,
      apiAccess: false,
      customBranding: true,
      prioritySupport: true,
      dedicatedManager: false
    },
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 15000,
    currency: 'KES',
    priceUSD: 115,
    description: 'For large corporations',
    features: [
      'Unlimited employees',
      'Daily check-ins',
      'Custom analytics',
      'AI insights (organization + individual)',
      'API access',
      'Dedicated success manager',
      'On-site training'
    ],
    limits: {
      maxEmployees: -1, // unlimited
      checkInFrequency: 'daily',
      analyticsLevel: 'custom',
      aiInsights: true,
      individualInsights: true,
      departmentInsights: true,
      apiAccess: true,
      customBranding: true,
      prioritySupport: true,
      dedicatedManager: true
    },
    savings: 'Best Value'
  }
}

export class PlanService {
  // Get current user's plan from database
  async getCurrentPlan(organizationId: string): Promise<Plan> {
    try {
      const { supabaseConfig } = await import('../lib/supabase')

      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_current_plan`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_id: organizationId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch current plan')
      }

      const planData = await response.json()
      const planName = planData.plan_name || 'business'

      return PLANS[planName] || PLANS.business
    } catch (error) {
      console.error('Error fetching current plan:', error)
      return PLANS.business // fallback
    }
  }

  // Check if feature is available for current plan
  canUseFeature(plan: Plan, feature: keyof PlanLimits): boolean {
    return plan.limits[feature] as boolean
  }

  // Check employee limit
  canAddEmployee(plan: Plan, currentEmployeeCount: number): boolean {
    if (plan.limits.maxEmployees === -1) return true // unlimited
    return currentEmployeeCount < plan.limits.maxEmployees
  }

  // Get feature restrictions message
  getRestrictionMessage(feature: keyof PlanLimits, currentPlan: Plan): string {
    const requiredPlans = Object.values(PLANS).filter(plan => 
      plan.limits[feature] === true || (feature === 'maxEmployees' && plan.limits.maxEmployees > currentPlan.limits.maxEmployees)
    )

    if (requiredPlans.length === 0) return 'This feature is not available in any plan.'

    const cheapestPlan = requiredPlans.reduce((min, plan) => 
      plan.price < min.price ? plan : min
    )

    return `This feature requires ${cheapestPlan.name} plan or higher. Upgrade to unlock this feature.`
  }

  // Validate check-in frequency
  canSendCheckIn(plan: Plan, lastSentDate: Date): boolean {
    const now = new Date()
    const daysSinceLastSent = Math.floor((now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24))

    switch (plan.limits.checkInFrequency) {
      case 'daily':
        return daysSinceLastSent >= 1
      case 'weekly':
        return daysSinceLastSent >= 7
      case 'monthly':
        return daysSinceLastSent >= 30
      default:
        return false
    }
  }
}

export const planService = new PlanService()
