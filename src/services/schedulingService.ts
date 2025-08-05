import { supabaseConfig } from '../lib/supabase'
import { twilioService } from './twilioService'

interface ScheduledCampaign {
  id: string
  organization_id: string
  name: string
  message: string
  target_type: string
  target_departments: string[] | null
  target_employees: string[] | null
  total_recipients: number
  created_by: string
  send_mode: string
  automation_frequency?: string
  automation_days?: string[]
  automation_time?: string
  scheduled_at?: string
  next_run_at?: string
}

interface Employee {
  id: string
  name: string
  phone: string
  department: string
}

export class SchedulingService {
  private isProcessing = false

  async processScheduledCampaigns(): Promise<void> {
    if (this.isProcessing) {
      console.log('Already processing campaigns, skipping...')
      return
    }

    this.isProcessing = true
    console.log('🕐 Processing scheduled campaigns...')

    try {
      // Get campaigns ready to be sent
      const campaigns = await this.getCampaignsReadyToSend()
      console.log(`📋 Found ${campaigns.length} campaigns ready to send`)

      for (const campaign of campaigns) {
        await this.processCampaign(campaign)
      }
    } catch (error) {
      console.error('❌ Error processing scheduled campaigns:', error)
    } finally {
      this.isProcessing = false
    }
  }

  private async getCampaignsReadyToSend(): Promise<ScheduledCampaign[]> {
    try {
      console.log('🔍 Checking for campaigns ready to send...')

      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_campaigns_ready_to_send`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch ready campaigns: ${response.status} - ${errorText}`)
        throw new Error(`Failed to fetch ready campaigns: ${response.status}`)
      }

      const campaigns = await response.json()
      console.log(`📋 Found ${campaigns.length} campaigns ready to send`)
      return campaigns
    } catch (error) {
      console.error('❌ Failed to get campaigns ready to send:', error)
      return []
    }
  }

  private async processCampaign(campaign: ScheduledCampaign): Promise<void> {
    console.log(`📤 Processing campaign: ${campaign.name}`)

    try {
      // Mark campaign as sending
      await this.updateCampaignStatus(campaign.id, 'sending')

      // Get target employees
      const employees = await this.getTargetEmployees(campaign)
      
      if (employees.length === 0) {
        console.log(`⚠️ No employees found for campaign ${campaign.name}`)
        await this.updateCampaignStatus(campaign.id, 'failed')
        return
      }

      // Send via Twilio
      const result = await twilioService.sendCheckInCampaign({
        campaignId: campaign.id,
        employees,
        message: campaign.message,
        organizationId: campaign.organization_id
      })

      console.log(`✅ Campaign ${campaign.name} sent: ${result.totalSent} successful, ${result.failed} failed`)

      // Update campaign status
      await this.updateCampaignStatus(campaign.id, 'sent')

      // If this is an automated campaign, schedule the next run
      if (campaign.send_mode === 'automate') {
        await this.scheduleNextRun(campaign.id)
      }

    } catch (error) {
      console.error(`❌ Failed to process campaign ${campaign.name}:`, error)
      await this.updateCampaignStatus(campaign.id, 'failed')
    }
  }

  private async getTargetEmployees(campaign: ScheduledCampaign): Promise<Employee[]> {
    try {
      let query = `${supabaseConfig.url}/rest/v1/employees?organization_id=eq.${campaign.organization_id}&select=id,name,phone,department&is_active=eq.true`

      if (campaign.target_type === 'department' && campaign.target_departments && campaign.target_departments.length > 0) {
        // For department targeting, filter by department IDs
        const deptFilter = campaign.target_departments.map(deptId => `department.eq.${deptId}`).join(',')
        query += `&or=(${deptFilter})`
      } else if (campaign.target_type === 'individual' && campaign.target_employees && campaign.target_employees.length > 0) {
        // For individual targeting, filter by employee IDs
        const empFilter = campaign.target_employees.map(empId => `id.eq.${empId}`).join(',')
        query += `&or=(${empFilter})`
      }

      console.log(`🔍 Fetching employees with query: ${query}`)

      const response = await fetch(query, {
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`)
      }

      const employees = await response.json()
      const validEmployees = employees.filter((emp: any) => emp.phone && emp.phone.trim() !== '')

      console.log(`📋 Found ${validEmployees.length} valid employees for campaign ${campaign.name}`)
      return validEmployees
    } catch (error) {
      console.error('Failed to get target employees:', error)
      return []
    }
  }

  private async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    try {
      await fetch(`${supabaseConfig.url}/rest/v1/checkin_campaigns?id=eq.${campaignId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'sent' && { sent_at: new Date().toISOString() })
        })
      })
    } catch (error) {
      console.error('Failed to update campaign status:', error)
    }
  }

  private async scheduleNextRun(campaignId: string): Promise<void> {
    try {
      await fetch(`${supabaseConfig.url}/rest/v1/rpc/update_next_run_time`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ campaign_id: campaignId })
      })
    } catch (error) {
      console.error('Failed to schedule next run:', error)
    }
  }

  // Method to start the scheduling service
  startScheduler(): void {
    console.log('🚀 Starting scheduling service...')
    
    // Process immediately
    this.processScheduledCampaigns()
    
    // Then process every minute
    setInterval(() => {
      this.processScheduledCampaigns()
    }, 60000) // Check every minute
  }

  // Method to stop the scheduler (for cleanup)
  stopScheduler(): void {
    console.log('🛑 Stopping scheduling service...')
    // In a real implementation, you'd store the interval ID and clear it
  }
}

export const schedulingService = new SchedulingService()
