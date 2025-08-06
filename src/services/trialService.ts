import { supabase } from '../lib/supabase'

export interface TrialStatus {
  isOnTrial: boolean
  trialEndsAt: Date | null
  daysRemaining: number
  planName: string
  hasExpired: boolean
  isExpiringSoon: boolean
}

export class TrialService {
  // Start trial for new organization
  async startTrial(organizationId: string, trialPlan: string = 'business', trialDays: number = 14): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('start_trial', {
        org_id: organizationId,
        trial_plan: trialPlan,
        trial_days: trialDays
      })

      if (error) throw error

      console.log('Trial started successfully:', data)
      return data
    } catch (error) {
      console.error('Error starting trial:', error)
      throw error
    }
  }

  // Get trial status for organization
  async getTrialStatus(organizationId: string): Promise<TrialStatus> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_name, is_trial, trial_ends_at, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)

      // Handle the case where no subscription exists (don't use .single())
      if (error) {
        console.error('Error fetching subscription:', error)
        throw error
      }

      // If no subscription data found, return default non-trial status
      if (!data || data.length === 0) {
        return {
          isOnTrial: false,
          trialEndsAt: null,
          daysRemaining: 0,
          planName: 'business',
          hasExpired: false,
          isExpiringSoon: false
        }
      }

      const subscription = data[0] // Get first result instead of using .single()

      if (!subscription || !subscription.is_trial) {
        return {
          isOnTrial: false,
          trialEndsAt: null,
          daysRemaining: 0,
          planName: subscription?.plan_name || 'business',
          hasExpired: false,
          isExpiringSoon: false
        }
      }

      const trialEndsAt = new Date(subscription.trial_ends_at)
      // Calculate days remaining using proper timezone handling
      const now = new Date()

      // Both dates are in UTC, so we can compare directly
      const timeDiff = trialEndsAt.getTime() - now.getTime()
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
      const hasExpired = daysRemaining <= 0
      const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 3

      // Auto-handle expired trials
      if (hasExpired) {
        console.log(`🔴 Trial expired for organization ${organizationId}, handling expiration...`)
        await this.handleExpiredTrial(organizationId)
      }

      return {
        isOnTrial: !hasExpired, // If expired, no longer on trial
        trialEndsAt,
        daysRemaining: Math.max(0, daysRemaining),
        planName: subscription.plan_name,
        hasExpired,
        isExpiringSoon
      }
    } catch (error) {
      console.error('Error getting trial status:', error)
      return {
        isOnTrial: false,
        trialEndsAt: null,
        daysRemaining: 0,
        planName: 'business',
        hasExpired: false,
        isExpiringSoon: false
      }
    }
  }

  // Convert trial to paid subscription
  async convertTrialToPaid(organizationId: string, paymentRef: string, amount: number): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('convert_trial_to_paid', {
        org_id: organizationId,
        payment_ref: paymentRef,
        amount: amount
      })

      if (error) throw error

      console.log('Trial converted to paid subscription:', data)
      return data
    } catch (error) {
      console.error('Error converting trial to paid:', error)
      throw error
    }
  }

  // Check if organization is eligible for trial
  async isEligibleForTrial(organizationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)

      if (error) throw error

      // If no subscriptions exist, eligible for trial
      return !data || data.length === 0
    } catch (error) {
      console.error('Error checking trial eligibility:', error)
      return false
    }
  }

  // Handle expired trials
  async handleExpiredTrial(organizationId: string): Promise<void> {
    try {
      // Update trial subscription to expired
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_trial', true)

      if (error) throw error

      // Log expiration event
      await supabase
        .from('subscription_events')
        .insert({
          organization_id: organizationId,
          event_type: 'expired',
          details: {
            trial_expired: true,
            expired_at: new Date().toISOString()
          }
        })

      console.log('🔴 Trial expired for organization:', organizationId)
      console.log('� Organization access suspended - subscription required to continue')
    } catch (error) {
      console.error('Error handling expired trial:', error)
    }
  }

  // Check if organization can use any features (NO FREE TIER)
  async canUseFeature(organizationId: string, _feature?: string): Promise<{ allowed: boolean, reason?: string }> {
    try {
      const trialStatus = await this.getTrialStatus(organizationId)

      // If on active trial, allow all features
      if (trialStatus.isOnTrial && !trialStatus.hasExpired) {
        return { allowed: true }
      }

      // If trial expired, check if they have paid subscription
      const { data: paidSubscription } = await supabase
        .from('subscriptions')
        .select('plan_name, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_trial', false)
        .limit(1)

      if (paidSubscription && paidSubscription.length > 0) {
        return { allowed: true }
      }

      // NO FREE TIER - Trial expired and no paid subscription = NO ACCESS
      return {
        allowed: false,
        reason: 'Your trial has expired. Please upgrade to a paid plan to continue using StaffPulse.'
      }
    } catch (error) {
      console.error('Error checking feature access:', error)
      return { allowed: false, reason: 'Unable to verify feature access' }
    }
  }

  // Check if organization has any active subscription (trial or paid)
  async hasActiveSubscription(organizationId: string): Promise<boolean> {
    try {
      const trialStatus = await this.getTrialStatus(organizationId)

      // Active trial counts as active subscription
      if (trialStatus.isOnTrial && !trialStatus.hasExpired) {
        return true
      }

      // Check for paid subscription
      const { data: paidSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_trial', false)
        .limit(1)

      return paidSubscription && paidSubscription.length > 0
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  // Get available plans for upgrade
  getAvailablePlans(): string[] {
    return [
      'startup',
      'business',
      'enterprise'
    ]
  }

  // Get trial conversion rate (for analytics)
  async getTrialConversionStats(): Promise<{
    totalTrials: number
    convertedTrials: number
    conversionRate: number
    activeTrials: number
    expiredTrials: number
  }> {
    try {
      // Get total trials
      const { data: totalTrialsData, error: totalError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('is_trial', true)

      if (totalError) throw totalError

      // Get converted trials (trials that became paid)
      const { data: convertedTrialsData, error: convertedError } = await supabase
        .from('subscription_events')
        .select('id')
        .eq('event_type', 'renewed')
        .contains('details', { converted_from_trial: true })

      if (convertedError) throw convertedError

      // Get active trials
      const { data: activeTrialsData, error: activeError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('is_trial', true)
        .eq('status', 'active')

      if (activeError) throw activeError

      // Get expired trials
      const { data: expiredTrialsData, error: expiredError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('is_trial', true)
        .eq('status', 'expired')

      if (expiredError) throw expiredError

      const totalTrials = totalTrialsData?.length || 0
      const convertedTrials = convertedTrialsData?.length || 0
      const activeTrials = activeTrialsData?.length || 0
      const expiredTrials = expiredTrialsData?.length || 0

      return {
        totalTrials,
        convertedTrials,
        conversionRate: totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0,
        activeTrials,
        expiredTrials
      }
    } catch (error) {
      console.error('Error getting trial conversion stats:', error)
      return {
        totalTrials: 0,
        convertedTrials: 0,
        conversionRate: 0,
        activeTrials: 0,
        expiredTrials: 0
      }
    }
  }

  // Send trial reminder notifications (to be called by cron job)
  async sendTrialReminders(): Promise<void> {
    try {
      // Get trials expiring in 3 days
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      const { data: expiringTrials, error } = await supabase
        .from('subscriptions')
        .select(`
          organization_id,
          plan_name,
          trial_ends_at,
          organizations (
            name,
            user_profiles (
              full_name,
              user_id,
              users (
                email
              )
            )
          )
        `)
        .eq('is_trial', true)
        .eq('status', 'active')
        .lte('trial_ends_at', threeDaysFromNow.toISOString())

      if (error) throw error

      // Here you would integrate with your email service
      // For now, just log the reminders
      expiringTrials?.forEach(trial => {
        console.log(`Trial reminder needed for organization: ${trial.organization_id}`)
        // Send email reminder logic here
      })

    } catch (error) {
      console.error('Error sending trial reminders:', error)
    }
  }
}

export const trialService = new TrialService()
