import { supabase } from '../lib/supabase'

export type FeatureType = 'check_in_sent' | 'employee_added' | 'ai_insight_generated' | 'report_generated' | 'api_call' | 'poll_created' | 'poll_sent' | 'announcement_sent'

export interface UsageRecord {
  id: string
  organization_id: string
  feature_type: FeatureType
  quantity: number
  metadata?: any
  billing_period: string
  created_at: string
}

export interface UsageSummary {
  feature_type: FeatureType
  total_usage: number
  billing_period: string
}

export class UsageService {
  // Track feature usage
  async trackUsage(
    organizationId: string,
    featureType: FeatureType,
    quantity: number = 1,
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('usage_tracking')
        .insert({
          organization_id: organizationId,
          feature_type: featureType,
          quantity,
          metadata,
          billing_period: new Date().toISOString().slice(0, 7) + '-01' // First day of current month
        })

      if (error) throw error

      console.log(`Usage tracked: ${featureType} x${quantity} for org ${organizationId}`)
    } catch (error) {
      console.error('Error tracking usage:', error)
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }

  // Get usage summary for current billing period
  async getCurrentUsage(organizationId: string): Promise<UsageSummary[]> {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7) + '-01'
      
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('feature_type, quantity')
        .eq('organization_id', organizationId)
        .eq('billing_period', currentPeriod)

      if (error) throw error

      // Aggregate usage by feature type
      const usageMap = new Map<FeatureType, number>()
      
      data?.forEach(record => {
        const current = usageMap.get(record.feature_type as FeatureType) || 0
        usageMap.set(record.feature_type as FeatureType, current + record.quantity)
      })

      return Array.from(usageMap.entries()).map(([feature_type, total_usage]) => ({
        feature_type,
        total_usage,
        billing_period: currentPeriod
      }))
    } catch (error) {
      console.error('Error fetching current usage:', error)
      return []
    }
  }

  // Get usage history for multiple periods
  async getUsageHistory(organizationId: string, months: number = 6): Promise<UsageSummary[]> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('feature_type, quantity, billing_period')
        .eq('organization_id', organizationId)
        .gte('billing_period', startDate.toISOString().slice(0, 7) + '-01')
        .lte('billing_period', endDate.toISOString().slice(0, 7) + '-01')
        .order('billing_period', { ascending: false })

      if (error) throw error

      // Aggregate by feature type and billing period
      const usageMap = new Map<string, UsageSummary>()
      
      data?.forEach(record => {
        const key = `${record.feature_type}-${record.billing_period}`
        const existing = usageMap.get(key)
        
        if (existing) {
          existing.total_usage += record.quantity
        } else {
          usageMap.set(key, {
            feature_type: record.feature_type as FeatureType,
            total_usage: record.quantity,
            billing_period: record.billing_period
          })
        }
      })

      return Array.from(usageMap.values())
    } catch (error) {
      console.error('Error fetching usage history:', error)
      return []
    }
  }

  // Check if usage limit is exceeded for a feature
  async checkUsageLimit(
    organizationId: string,
    featureType: FeatureType,
    limit: number
  ): Promise<{ exceeded: boolean; current: number; limit: number }> {
    try {
      const usage = await this.getCurrentUsage(organizationId)
      const currentUsage = usage.find(u => u.feature_type === featureType)?.total_usage || 0
      
      return {
        exceeded: currentUsage >= limit,
        current: currentUsage,
        limit
      }
    } catch (error) {
      console.error('Error checking usage limit:', error)
      return { exceeded: false, current: 0, limit }
    }
  }

  // Calculate overage charges (for usage-based billing)
  calculateOverageCharges(
    usage: UsageSummary[],
    limits: Record<FeatureType, { included: number; overageRate: number }>
  ): { feature: FeatureType; overage: number; charge: number }[] {
    return usage
      .map(u => {
        const limit = limits[u.feature_type]
        if (!limit) return null

        const overage = Math.max(0, u.total_usage - limit.included)
        const charge = overage * limit.overageRate

        return {
          feature: u.feature_type,
          overage,
          charge
        }
      })
      .filter(Boolean) as { feature: FeatureType; overage: number; charge: number }[]
  }

  // Reset usage for new billing period (typically called by cron job)
  async resetUsageForNewPeriod(organizationId: string): Promise<void> {
    try {
      // Usage tracking is cumulative, so we don't actually delete records
      // This function could be used to send usage reports or trigger billing
      const usage = await this.getCurrentUsage(organizationId)
      console.log(`Usage summary for ${organizationId}:`, usage)
      
      // Here you could:
      // 1. Send usage report email
      // 2. Calculate and charge overage fees
      // 3. Reset any temporary usage counters
      // 4. Generate invoice for usage-based billing
      
    } catch (error) {
      console.error('Error resetting usage for new period:', error)
    }
  }
}

export const usageService = new UsageService()
