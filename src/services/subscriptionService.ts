import { supabase } from '../lib/supabase'
import { PLANS, Plan } from './planService'

export interface SubscriptionStatus {
  isActive: boolean
  isExpired: boolean
  isExpiringSoon: boolean
  daysUntilExpiry: number
  currentPlan: Plan
  expiryDate: Date | null
}

export class SubscriptionService {
  // Check subscription status and expiration
  async getSubscriptionStatus(organizationId: string): Promise<SubscriptionStatus> {
    try {
      const { data, error } = await supabase.rpc('get_current_plan', {
        org_id: organizationId
      })

      if (error) throw error

      const planName = data?.plan_name || 'business'
      const currentPlan = PLANS[planName] || PLANS.business
      const expiryDate = data?.expires_at ? new Date(data.expires_at) : null
      
      const now = new Date()
      const isExpired = expiryDate ? expiryDate < now : false
      const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : -1
      const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 7
      const isActive = data?.status === 'active' && !isExpired

      return {
        isActive,
        isExpired,
        isExpiringSoon,
        daysUntilExpiry,
        currentPlan,
        expiryDate
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
      // Return default status
      return {
        isActive: true,
        isExpired: false,
        isExpiringSoon: false,
        daysUntilExpiry: -1,
        currentPlan: PLANS.business,
        expiryDate: null
      }
    }
  }

  // Handle expired subscriptions
  async handleExpiredSubscription(organizationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (error) throw error

      console.log('Subscription marked as expired for organization:', organizationId)
    } catch (error) {
      console.error('Error handling expired subscription:', error)
    }
  }

  // Extend subscription (for renewals)
  async extendSubscription(organizationId: string, months: number): Promise<void> {
    try {
      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('expires_at')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

      const currentExpiry = currentSub?.expires_at ? new Date(currentSub.expires_at) : new Date()
      const newExpiry = new Date(currentExpiry)
      newExpiry.setMonth(newExpiry.getMonth() + months)

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (error) throw error

      console.log(`Subscription extended by ${months} months for organization:`, organizationId)
    } catch (error) {
      console.error('Error extending subscription:', error)
      throw error
    }
  }

  // Cancel subscription
  async cancelSubscription(organizationId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (error) throw error

      // Log cancellation reason if provided
      if (reason) {
        await supabase
          .from('subscription_events')
          .insert({
            organization_id: organizationId,
            event_type: 'cancellation',
            details: { reason },
            created_at: new Date().toISOString()
          })
      }

      console.log('Subscription cancelled for organization:', organizationId)
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }

  // Calculate prorated amount for upgrades/downgrades
  calculateProratedAmount(
    currentPlan: Plan,
    newPlan: Plan,
    daysRemaining: number,
    totalDaysInPeriod: number = 30
  ): number {
    const currentDailyRate = currentPlan.price / totalDaysInPeriod
    const newDailyRate = newPlan.price / totalDaysInPeriod
    
    const refundAmount = currentDailyRate * daysRemaining
    const newAmount = newDailyRate * daysRemaining
    
    return Math.max(0, newAmount - refundAmount)
  }

  // Get subscription events/history
  async getSubscriptionHistory(organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_events')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching subscription history:', error)
      return []
    }
  }
}

export const subscriptionService = new SubscriptionService()
