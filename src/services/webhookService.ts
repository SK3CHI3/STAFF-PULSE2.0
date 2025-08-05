import { supabaseConfig } from '../lib/supabase'

// Webhook endpoints for Twilio callbacks
export const WEBHOOK_ENDPOINTS = {
  SMS_STATUS: '/api/webhooks/twilio/sms-status',
  SMS_INCOMING: '/api/webhooks/twilio/sms-incoming', 
  WHATSAPP_STATUS: '/api/webhooks/twilio/whatsapp-status',
  WHATSAPP_INCOMING: '/api/webhooks/twilio/whatsapp-incoming',
  MESSAGE_STATUS: '/api/webhooks/twilio/message-status'
}

// Get full webhook URLs for your domain
export const getWebhookUrls = (baseUrl: string) => ({
  smsStatus: `${baseUrl}${WEBHOOK_ENDPOINTS.SMS_STATUS}`,
  smsIncoming: `${baseUrl}${WEBHOOK_ENDPOINTS.SMS_INCOMING}`,
  whatsappStatus: `${baseUrl}${WEBHOOK_ENDPOINTS.WHATSAPP_STATUS}`,
  whatsappIncoming: `${baseUrl}${WEBHOOK_ENDPOINTS.WHATSAPP_INCOMING}`,
  messageStatus: `${baseUrl}${WEBHOOK_ENDPOINTS.MESSAGE_STATUS}`
})

// Handle incoming SMS/WhatsApp messages
export const handleIncomingMessage = async (twilioData: any) => {
  try {
    const {
      MessageSid,
      From,
      To,
      Body,
      NumMedia,
      MediaUrl0,
      ProfileName
    } = twilioData

    // Log the incoming message
    console.log('📨 Incoming message:', {
      sid: MessageSid,
      from: From,
      to: To,
      body: Body,
      profileName: ProfileName
    })

    // Store in database
    const messageData = {
      message_sid: MessageSid,
      from_number: From,
      to_number: To,
      message_body: Body,
      media_count: parseInt(NumMedia) || 0,
      media_url: MediaUrl0 || null,
      profile_name: ProfileName || null,
      direction: 'inbound',
      status: 'received',
      received_at: new Date().toISOString()
    }

    const response = await fetch(`${supabaseConfig.url}/rest/v1/twilio_messages`, {
      method: 'POST',
      headers: {
        'apikey': supabaseConfig.anonKey,
        'Authorization': `Bearer ${supabaseConfig.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    })

    if (!response.ok) {
      throw new Error(`Failed to store message: ${response.status}`)
    }

    // Check if this is a check-in response
    await processCheckInResponse(From, Body)

    return { success: true }
  } catch (error) {
    console.error('Error handling incoming message:', error)
    return { success: false, error: error.message }
  }
}

// Handle message status updates
export const handleMessageStatus = async (twilioData: any) => {
  try {
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage
    } = twilioData

    console.log('📊 Message status update:', {
      sid: MessageSid,
      status: MessageStatus,
      error: ErrorCode ? `${ErrorCode}: ${ErrorMessage}` : null
    })

    // Update message status in database
    const updateData = {
      status: MessageStatus,
      error_code: ErrorCode || null,
      error_message: ErrorMessage || null,
      updated_at: new Date().toISOString()
    }

    const response = await fetch(`${supabaseConfig.url}/rest/v1/twilio_messages?message_sid=eq.${MessageSid}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseConfig.anonKey,
        'Authorization': `Bearer ${supabaseConfig.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      throw new Error(`Failed to update message status: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error handling message status:', error)
    return { success: false, error: error.message }
  }
}

// Process check-in responses
const processCheckInResponse = async (fromNumber: string, messageBody: string) => {
  try {
    // Clean the phone number (remove whatsapp: prefix if present)
    const cleanNumber = fromNumber.replace('whatsapp:', '')
    
    // Find employee by phone number
    const employeeResponse = await fetch(`${supabaseConfig.url}/rest/v1/employees?phone=eq.${cleanNumber}`, {
      headers: {
        'apikey': supabaseConfig.anonKey,
        'Authorization': `Bearer ${supabaseConfig.anonKey}`
      }
    })

    if (!employeeResponse.ok) return

    const employees = await employeeResponse.json()
    if (employees.length === 0) return

    const employee = employees[0]

    // Parse the response (you can customize this logic)
    const response = parseCheckInResponse(messageBody)
    
    if (response) {
      // Store check-in response
      const checkInData = {
        employee_id: employee.id,
        organization_id: employee.organization_id,
        mood_score: response.mood,
        stress_level: response.stress,
        workload_level: response.workload,
        feedback: response.feedback,
        response_method: fromNumber.includes('whatsapp') ? 'whatsapp' : 'sms',
        submitted_at: new Date().toISOString()
      }

      await fetch(`${supabaseConfig.url}/rest/v1/check_ins`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkInData)
      })

      console.log('✅ Check-in response processed for:', employee.name)
    }
  } catch (error) {
    console.error('Error processing check-in response:', error)
  }
}

// Parse check-in response from message body
const parseCheckInResponse = (messageBody: string) => {
  // Simple parsing logic - you can make this more sophisticated
  const body = messageBody.toLowerCase().trim()
  
  // Look for mood indicators
  let mood = 5 // default
  if (body.includes('great') || body.includes('excellent') || body.includes('amazing')) mood = 9
  else if (body.includes('good') || body.includes('fine') || body.includes('ok')) mood = 7
  else if (body.includes('bad') || body.includes('terrible') || body.includes('awful')) mood = 3
  else if (body.includes('stressed') || body.includes('overwhelmed')) mood = 4

  // Look for stress indicators
  let stress = 3 // default
  if (body.includes('stressed') || body.includes('overwhelmed') || body.includes('pressure')) stress = 8
  else if (body.includes('calm') || body.includes('relaxed') || body.includes('peaceful')) stress = 2

  // Look for workload indicators
  let workload = 5 // default
  if (body.includes('busy') || body.includes('swamped') || body.includes('overloaded')) workload = 8
  else if (body.includes('light') || body.includes('manageable') || body.includes('easy')) workload = 3

  return {
    mood,
    stress,
    workload,
    feedback: messageBody
  }
}

// Validate Twilio webhook signature (for security)
export const validateTwilioSignature = (signature: string, url: string, params: any) => {
  // Implementation for webhook signature validation
  // This ensures the webhook is actually from Twilio
  const crypto = require('crypto')
  const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN
  
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url)
  
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64')
  
  return signature === expectedSignature
}
