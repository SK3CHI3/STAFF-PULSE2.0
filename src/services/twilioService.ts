import { supabaseConfig } from '../lib/supabase'

// Twilio configuration from environment variables
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER

interface SendCheckInParams {
  campaignId: string
  employees: Array<{
    id: string
    name: string
    phone: string
  }>
  message: string
  organizationId: string
}

interface CheckInResponse {
  success: boolean
  totalSent: number
  failed: number
  errors: string[]
}

export class TwilioService {
  private validateConfig(): void {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Twilio configuration missing. Please check your environment variables.')
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Add country code if missing (assuming Kenya +254)
    if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`
    } else if (cleaned.startsWith('254')) {
      return `+${cleaned}`
    } else if (!cleaned.startsWith('+')) {
      return `+254${cleaned}`
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
  }

  private async sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    try {
      this.validateConfig()

      const formattedPhone = this.formatPhoneNumber(to)
      const whatsappTo = `whatsapp:${formattedPhone}`

      // Create basic auth header
      const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_NUMBER || '',
          To: whatsappTo,
          Body: message
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        messageSid: data.sid
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async logCheckInSend(
    campaignId: string,
    employeeId: string,
    phone: string,
    messageSid?: string,
    status: string = 'sent',
    errorMessage?: string
  ): Promise<void> {
    try {
      await fetch(`${supabaseConfig.url}/rest/v1/checkin_logs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          employee_id: employeeId,
          phone_number: phone,
          message_sid: messageSid,
          status: status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          error_message: errorMessage
        })
      })
    } catch (error) {
      console.error('Failed to log check-in send:', error)
    }
  }

  private async updateCampaignStats(campaignId: string, sentCount: number): Promise<void> {
    try {
      await fetch(`${supabaseConfig.url}/rest/v1/checkin_campaigns?id=eq.${campaignId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sent_count: sentCount,
          sent_at: new Date().toISOString(),
          status: 'sent',
          updated_at: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to update campaign stats:', error)
    }
  }

  async sendCheckInCampaign(params: SendCheckInParams): Promise<CheckInResponse> {
    const { campaignId, employees, message, organizationId } = params
    
    let totalSent = 0
    let failed = 0
    const errors: string[] = []

    // Update campaign status to 'sending'
    try {
      await fetch(`${supabaseConfig.url}/rest/v1/checkin_campaigns?id=eq.${campaignId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'sending',
          updated_at: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to update campaign status:', error)
    }

    // Send messages to each employee
    for (const employee of employees) {
      if (!employee.phone || employee.phone.trim() === '') {
        failed++
        errors.push(`${employee.name}: No phone number provided`)
        await this.logCheckInSend(campaignId, employee.id, '', undefined, 'failed', 'No phone number')
        continue
      }

      try {
        // Personalize the message
        const personalizedMessage = message.replace(/\{name\}/g, employee.name)
        
        const result = await this.sendWhatsAppMessage(employee.phone, personalizedMessage)
        
        if (result.success) {
          totalSent++
          await this.logCheckInSend(campaignId, employee.id, employee.phone, result.messageSid, 'sent')
        } else {
          failed++
          errors.push(`${employee.name}: ${result.error}`)
          await this.logCheckInSend(campaignId, employee.id, employee.phone, undefined, 'failed', result.error)
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        failed++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${employee.name}: ${errorMsg}`)
        await this.logCheckInSend(campaignId, employee.id, employee.phone, undefined, 'failed', errorMsg)
      }
    }

    // Update final campaign stats
    await this.updateCampaignStats(campaignId, totalSent)

    return {
      success: totalSent > 0,
      totalSent,
      failed,
      errors
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      this.validateConfig()

      const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

export const twilioService = new TwilioService()
