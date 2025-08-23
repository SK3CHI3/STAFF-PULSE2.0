import { supabaseConfig } from '../lib/supabase'

// Twilio configuration from environment variables
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER

// Twilio API endpoints
const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01'
const TWILIO_MESSAGES_ENDPOINT = `${TWILIO_API_BASE}/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
const TWILIO_ACCOUNT_ENDPOINT = `${TWILIO_API_BASE}/Accounts/${TWILIO_ACCOUNT_SID}.json`

interface SendCheckInParams {
  campaignId: string
  employees: Array<{
    id: string
    name: string
    phone: string
    department?: string
  }>
  message: string
  organizationId: string
}

interface CheckInResponse {
  success: boolean
  totalSent: number
  failed: number
  errors: string[]
  details?: Array<{
    employeeId: string
    employeeName: string
    phone: string
    status: 'sent' | 'failed'
    messageSid?: string
    error?: string
  }>
}

interface SendPollParams {
  pollId: string
  employees: Array<{
    id: string
    name: string
    phone: string
    department?: string
  }>
  poll: {
    title: string
    question: string
    poll_type: string
    options?: string[]
    rating_scale?: number
  }
  organizationId: string
}

interface SendAnnouncementParams {
  announcementId: string
  employees: Array<{
    id: string
    name: string
    phone: string
    department?: string
  }>
  announcement: {
    title: string
    content: string
    announcement_type: string
    priority: string
  }
  organizationId: string
}

interface TwilioMessageResponse {
  sid: string
  status: string
  error_code?: string
  error_message?: string
}

interface PhoneValidationResult {
  isValid: boolean
  formatted: string
  error?: string
}

export class TwilioService {
  private validateConfig(): void {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Twilio configuration missing. Please check your environment variables.')
    }
  }

  private validateAndFormatPhone(phone: string): PhoneValidationResult {
    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        formatted: '',
        error: 'Phone number is required'
      }
    }

    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')

    // Remove any + that's not at the beginning
    const normalizedPhone = cleaned.replace(/(?!^)\+/g, '')

    // Validate minimum length
    if (normalizedPhone.replace(/\+/g, '').length < 9) {
      return {
        isValid: false,
        formatted: '',
        error: 'Phone number too short'
      }
    }

    let formatted = ''

    // Handle different formats for Kenya (+254)
    if (normalizedPhone.startsWith('+254')) {
      formatted = normalizedPhone
    } else if (normalizedPhone.startsWith('254')) {
      formatted = `+${normalizedPhone}`
    } else if (normalizedPhone.startsWith('0')) {
      // Convert local format (0xxx) to international (+254xxx)
      formatted = `+254${normalizedPhone.substring(1)}`
    } else if (normalizedPhone.startsWith('+')) {
      // Already has country code
      formatted = normalizedPhone
    } else {
      // Assume Kenya if no country code
      formatted = `+254${normalizedPhone}`
    }

    // Final validation - should be +254 followed by 9 digits
    const kenyanPhoneRegex = /^\+254[17]\d{8}$/
    if (!kenyanPhoneRegex.test(formatted)) {
      return {
        isValid: false,
        formatted: '',
        error: 'Invalid Kenyan phone number format. Expected format: +254XXXXXXXXX'
      }
    }

    return {
      isValid: true,
      formatted,
      error: undefined
    }
  }

  private formatPhoneNumber(phone: string): string {
    const result = this.validateAndFormatPhone(phone)
    if (!result.isValid) {
      throw new Error(result.error || 'Invalid phone number')
    }
    return result.formatted
  }

  private async sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    try {
      this.validateConfig()

      // Validate phone number first
      const phoneValidation = this.validateAndFormatPhone(to)
      if (!phoneValidation.isValid) {
        return {
          success: false,
          error: phoneValidation.error || 'Invalid phone number'
        }
      }

      const whatsappTo = `whatsapp:${phoneValidation.formatted}`
      const whatsappFrom = TWILIO_WHATSAPP_NUMBER?.startsWith('whatsapp:')
        ? TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`

      // Validate message content
      if (!message || message.trim().length === 0) {
        return {
          success: false,
          error: 'Message content cannot be empty'
        }
      }

      if (message.length > 1600) {
        return {
          success: false,
          error: 'Message too long. WhatsApp messages must be under 1600 characters'
        }
      }

      // Create basic auth header
      const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

      // Note: StatusCallback is for delivery status, not incoming messages
      // Incoming message webhook must be configured in Twilio Console:
      // https://console.twilio.com/us1/develop/sms/senders/whatsapp
      // Set webhook URL to: https://kietxkkxhdwhkdiemuor.supabase.co/functions/v1/twilio-webhook

      const response = await fetch(TWILIO_MESSAGES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: whatsappFrom,
          To: whatsappTo,
          Body: message.trim()
          // StatusCallback removed - incoming messages are handled via Console webhook configuration
        })
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.error_message) {
            errorMessage = errorData.error_message
          }
        } catch {
          // If JSON parsing fails, use the status text
          const textError = await response.text()
          if (textError) {
            errorMessage = textError
          }
        }

        return {
          success: false,
          error: errorMessage
        }
      }

      const data: TwilioMessageResponse = await response.json()

      // Check if Twilio returned an error in the response
      if (data.error_code) {
        return {
          success: false,
          error: data.error_message || `Twilio error: ${data.error_code}`
        }
      }

      return {
        success: true,
        messageSid: data.sid
      }
    } catch (error) {
      console.error('WhatsApp send error:', error)
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

  /**
   * Send poll to employees via WhatsApp
   */
  async sendPoll(params: SendPollParams): Promise<CheckInResponse> {
    if (!this.isConfigured()) {
      throw new Error('Twilio is not properly configured')
    }

    const results: CheckInResponse = {
      success: false,
      totalSent: 0,
      failed: 0,
      errors: [],
      details: []
    }

    try {
      // Generate poll message
      const pollMessage = this.generatePollMessage(params.poll)

      // Send to each employee
      for (const employee of params.employees) {
        try {
          const formattedPhone = this.validateAndFormatPhone(employee.phone)
          if (!formattedPhone.isValid) {
            results.failed++
            results.errors.push(`Invalid phone number for ${employee.name}: ${formattedPhone.error}`)
            results.details?.push({
              employeeId: employee.id,
              employeeName: employee.name,
              phone: employee.phone,
              status: 'failed',
              error: formattedPhone.error
            })
            continue
          }

          const personalizedMessage = pollMessage.replace('{name}', employee.name)

          const response = await this.sendWhatsAppMessage(
            formattedPhone.formatted,
            personalizedMessage
          )

          if (response.success && response.messageSid) {
            results.totalSent++
            results.details?.push({
              employeeId: employee.id,
              employeeName: employee.name,
              phone: employee.phone,
              status: 'sent',
              messageSid: response.messageSid
            })
          } else {
            results.failed++
            results.errors.push(`Failed to send to ${employee.name}: ${response.error}`)
            results.details?.push({
              employeeId: employee.id,
              employeeName: employee.name,
              phone: employee.phone,
              status: 'failed',
              error: response.error
            })
          }
        } catch (error) {
          results.failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(`Error sending to ${employee.name}: ${errorMessage}`)
          results.details?.push({
            employeeId: employee.id,
            employeeName: employee.name,
            phone: employee.phone,
            status: 'failed',
            error: errorMessage
          })
        }
      }

      results.success = results.totalSent > 0
      return results

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      results.errors.push(errorMessage)
      throw new Error(`Failed to send poll: ${errorMessage}`)
    }
  }

  /**
   * Send announcement to employees via WhatsApp
   */
  async sendAnnouncement(params: SendAnnouncementParams): Promise<CheckInResponse> {
    if (!this.isConfigured()) {
      throw new Error('Twilio is not properly configured')
    }

    const results: CheckInResponse = {
      success: false,
      totalSent: 0,
      failed: 0,
      errors: [],
      details: []
    }

    try {
      // Generate announcement message
      const announcementMessage = this.generateAnnouncementMessage(params.announcement)

      // Send to each employee
      for (const employee of params.employees) {
        try {
          const formattedPhone = this.validateAndFormatPhone(employee.phone)
          if (!formattedPhone.isValid) {
            results.failed++
            results.errors.push(`Invalid phone number for ${employee.name}: ${formattedPhone.error}`)
            results.details?.push({
              employeeId: employee.id,
              employeeName: employee.name,
              phone: employee.phone,
              status: 'failed',
              error: formattedPhone.error
            })
            continue
          }

          const personalizedMessage = announcementMessage.replace('{name}', employee.name)

          const response = await this.sendWhatsAppMessage(
            formattedPhone.formatted,
            personalizedMessage
          )

          if (response.success && response.messageSid) {
            results.totalSent++
            results.details?.push({
              employeeId: employee.id,
              employeeName: employee.name,
              phone: employee.phone,
              status: 'sent',
              messageSid: response.messageSid
            })
          } else {
            results.failed++
            results.errors.push(`Failed to send to ${employee.name}: ${response.error}`)
            results.details?.push({
              employeeId: employee.id,
              employeeName: employee.name,
              phone: employee.phone,
              status: 'failed',
              error: response.error
            })
          }
        } catch (error) {
          results.failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(`Error sending to ${employee.name}: ${errorMessage}`)
          results.details?.push({
            employeeId: employee.id,
            employeeName: employee.name,
            phone: employee.phone,
            status: 'failed',
            error: errorMessage
          })
        }
      }

      results.success = results.totalSent > 0
      return results

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      results.errors.push(errorMessage)
      throw new Error(`Failed to send announcement: ${errorMessage}`)
    }
  }

  async sendCheckInCampaign(params: SendCheckInParams): Promise<CheckInResponse> {
    const { campaignId, employees, message } = params

    let totalSent = 0
    let failed = 0
    const errors: string[] = []
    const details: CheckInResponse['details'] = []

    console.log(`🚀 Starting WhatsApp campaign ${campaignId} for ${employees.length} employees`)

    // Validate inputs
    if (!employees || employees.length === 0) {
      return {
        success: false,
        totalSent: 0,
        failed: 0,
        errors: ['No employees provided for campaign'],
        details: []
      }
    }

    if (!message || message.trim().length === 0) {
      return {
        success: false,
        totalSent: 0,
        failed: 0,
        errors: ['Message content cannot be empty'],
        details: []
      }
    }

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
      console.log(`📱 Sending to ${employee.name} (${employee.phone})`)

      if (!employee.phone || employee.phone.trim() === '') {
        failed++
        const errorMsg = 'No phone number provided'
        errors.push(`${employee.name}: ${errorMsg}`)
        details.push({
          employeeId: employee.id,
          employeeName: employee.name,
          phone: '',
          status: 'failed',
          error: errorMsg
        })
        await this.logCheckInSend(campaignId, employee.id, '', undefined, 'failed', errorMsg)
        continue
      }

      try {
        // Personalize the message
        const personalizedMessage = message
          .replace(/\{employee_name\}/g, employee.name)
          .replace(/\{name\}/g, employee.name)
          .replace(/\{company_name\}/g, 'StaffPulse')
          .replace(/\{organization_name\}/g, 'StaffPulse')
          .replace(/\{department\}/g, employee.department || 'your department')

        // Debug logging to check placeholder replacement
        console.log('🔍 Message personalization debug:', {
          originalMessage: message.substring(0, 100) + '...',
          employeeName: employee.name,
          personalizedMessage: personalizedMessage.substring(0, 100) + '...',
          hasEmployeeName: personalizedMessage.includes(employee.name),
          hasCompanyName: personalizedMessage.includes('StaffPulse')
        })

        const result = await this.sendWhatsAppMessage(employee.phone, personalizedMessage)

        if (result.success) {
          totalSent++
          console.log(`✅ Sent to ${employee.name}: ${result.messageSid}`)
          details.push({
            employeeId: employee.id,
            employeeName: employee.name,
            phone: employee.phone,
            status: 'sent',
            messageSid: result.messageSid
          })
          await this.logCheckInSend(campaignId, employee.id, employee.phone, result.messageSid, 'sent')
        } else {
          failed++
          console.log(`❌ Failed to send to ${employee.name}: ${result.error}`)
          errors.push(`${employee.name}: ${result.error}`)
          details.push({
            employeeId: employee.id,
            employeeName: employee.name,
            phone: employee.phone,
            status: 'failed',
            error: result.error
          })
          await this.logCheckInSend(campaignId, employee.id, employee.phone, undefined, 'failed', result.error)
        }

        // Add delay to avoid rate limiting (Twilio allows 1 message per second)
        await new Promise(resolve => setTimeout(resolve, 1100))
      } catch (error) {
        failed++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ Exception sending to ${employee.name}: ${errorMsg}`)
        errors.push(`${employee.name}: ${errorMsg}`)
        details.push({
          employeeId: employee.id,
          employeeName: employee.name,
          phone: employee.phone,
          status: 'failed',
          error: errorMsg
        })
        await this.logCheckInSend(campaignId, employee.id, employee.phone, undefined, 'failed', errorMsg)
      }
    }

    // Update final campaign stats
    await this.updateCampaignStats(campaignId, totalSent)

    console.log(`📊 Campaign ${campaignId} completed: ${totalSent} sent, ${failed} failed`)

    return {
      success: totalSent > 0,
      totalSent,
      failed,
      errors,
      details
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string; accountInfo?: any }> {
    try {
      console.log('🔍 Testing Twilio connection...')
      this.validateConfig()

      const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

      const response = await fetch(TWILIO_ACCOUNT_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
        }
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          // Use status text if JSON parsing fails
        }
        throw new Error(errorMessage)
      }

      const accountData = await response.json()
      console.log('✅ Twilio connection successful')

      return {
        success: true,
        accountInfo: {
          friendlyName: accountData.friendly_name,
          status: accountData.status,
          type: accountData.type
        }
      }
    } catch (error) {
      console.error('❌ Twilio connection failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Validate multiple phone numbers
  validatePhoneNumbers(phones: string[]): Array<{ phone: string; isValid: boolean; formatted: string; error?: string }> {
    return phones.map(phone => {
      const result = this.validateAndFormatPhone(phone)
      return {
        phone,
        isValid: result.isValid,
        formatted: result.formatted,
        error: result.error
      }
    })
  }

  // Check if Twilio is properly configured
  private isConfigured(): boolean {
    return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER)
  }

  // Generate poll message for WhatsApp
  private generatePollMessage(poll: { title: string; question: string; poll_type: string; options?: string[]; rating_scale?: number }): string {
    let message = `📊 *${poll.title}*\n\n${poll.question}\n\n`

    switch (poll.poll_type) {
      case 'multiple_choice':
        if (poll.options) {
          poll.options.forEach((option, index) => {
            message += `${index + 1}️⃣ ${option}\n`
          })
          message += `\nReply with the number of your choice (1-${poll.options.length})`
        }
        break

      case 'yes_no':
        message += `1️⃣ Yes\n2️⃣ No\n\nReply with 1 for Yes or 2 for No`
        break

      case 'rating':
        const scale = poll.rating_scale || 10
        message += `Please rate from 1 to ${scale}\n\nReply with your rating (1-${scale})`
        break

      case 'open_text':
        message += `Please share your thoughts in your reply.`
        break
    }

    message += `\n\nHi {name}, your participation helps us improve! 🙏`
    return message
  }

  // Generate announcement message for WhatsApp
  private generateAnnouncementMessage(announcement: { title: string; content: string; announcement_type: string; priority: string }): string {
    let emoji = '📢'

    switch (announcement.announcement_type) {
      case 'urgent':
        emoji = '🚨'
        break
      case 'celebration':
        emoji = '🎉'
        break
      case 'policy':
        emoji = '📋'
        break
      case 'event':
        emoji = '📅'
        break
    }

    let priorityPrefix = ''
    if (announcement.priority === 'urgent') {
      priorityPrefix = '🚨 *URGENT* 🚨\n\n'
    } else if (announcement.priority === 'high') {
      priorityPrefix = '⚠️ *IMPORTANT* ⚠️\n\n'
    }

    return `${priorityPrefix}${emoji} *${announcement.title}*\n\n${announcement.content}\n\nHi {name}, this message is from your organization.`
  }

  // Get message templates - Only the two types we support
  getMessageTemplates(): Array<{ id: string; name: string; template: string; description: string }> {
    return [
      {
        id: 'professional_psychological',
        name: 'Professional & Human',
        template: 'Hi {employee_name}, hope you\'re having a good day! 😊 We genuinely care about your wellbeing at {company_name}. Taking a moment to check in with yourself is so important. How are you feeling today? Please reply with:\n\n1️⃣ Your mood (1-10 scale)\n2️⃣ Any comments or thoughts (optional)\n\nExample: "8 - Having a great week, thanks for checking in!"\n\nYour wellbeing matters to us! 💙',
        description: 'Thoughtfully crafted message that balances professionalism with genuine care'
      },
      {
        id: 'custom',
        name: 'Custom Message',
        template: 'Hi {employee_name}, how are you feeling today? Please reply with your mood (1-10) and any comments. Example: "7 - Busy but good day!"',
        description: 'Create your own personalized message with editable placeholders'
      }
    ]
  }
}

export const twilioService = new TwilioService()
