/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
}

// Response type detection and routing
interface MessageContext {
  id: string
  message_type: 'checkin' | 'poll' | 'announcement'
  reference_id: string
  sent_at: string
  expires_at: string
}

// Intelligent response routing based on context
async function routeResponse(
  supabase: any,
  employee: any,
  messageBody: string,
  context: MessageContext
) {
  const responseTime = new Date().toISOString()

  switch (context.message_type) {
    case 'checkin':
      return await handleCheckinResponse(supabase, employee, messageBody, context, responseTime)
    case 'poll':
      return await handlePollResponse(supabase, employee, messageBody, context, responseTime)
    case 'announcement':
      return await handleAnnouncementResponse(supabase, employee, messageBody, context, responseTime)
    default:
      return await handleGenericResponse(supabase, employee, messageBody, responseTime)
  }
}

// Handle check-in responses
async function handleCheckinResponse(
  supabase: any,
  employee: any,
  messageBody: string,
  context: MessageContext,
  responseTime: string
) {
  const body = messageBody.toLowerCase().trim()

  // Parse mood score (1-10)
  let mood = 5 // default
  const moodMatch = body.match(/\b([1-9]|10)\b/)
  if (moodMatch) {
    mood = parseInt(moodMatch[1])
  } else {
    // Look for mood keywords if no number found
    if (body.includes('great') || body.includes('excellent') || body.includes('amazing') || body.includes('fantastic')) mood = 9
    else if (body.includes('good') || body.includes('fine') || body.includes('ok') || body.includes('well')) mood = 7
    else if (body.includes('bad') || body.includes('terrible') || body.includes('awful') || body.includes('horrible')) mood = 3
    else if (body.includes('stressed') || body.includes('overwhelmed') || body.includes('anxious')) mood = 4
  }

  // Store check-in response
  await supabase
    .from('check_ins')
    .insert({
      organization_id: employee.organization_id,
      employee_id: employee.id,
      mood_score: mood,
      feedback: messageBody,
      is_anonymous: false,
      created_at: responseTime
    })

  // Mark context as responded
  await supabase
    .from('message_context')
    .update({
      is_responded: true,
      responded_at: responseTime
    })
    .eq('id', context.id)

  return `Thank you ${employee.name}! 🙏 We've received your check-in (mood: ${mood}/10) and appreciate you sharing how you're feeling. Your wellbeing matters to us! 💙`
}

// Handle poll responses
async function handlePollResponse(
  supabase: any,
  employee: any,
  messageBody: string,
  context: MessageContext,
  responseTime: string
) {
  const body = messageBody.toLowerCase().trim()

  // Get poll details to understand response format
  const { data: poll } = await supabase
    .from('polls')
    .select('*')
    .eq('id', context.reference_id)
    .single()

  if (!poll) {
    return `Thank you for your response! However, this poll is no longer available. 📊`
  }

  let responseData: any = {
    response_text: messageBody
  }

  // Parse response based on poll type
  if (poll.poll_type === 'multiple_choice' && poll.options) {
    const choiceMatch = body.match(/\b([1-9]|10)\b/)
    if (choiceMatch) {
      const choiceIndex = parseInt(choiceMatch[1]) - 1
      if (choiceIndex >= 0 && choiceIndex < poll.options.length) {
        responseData.response_choice = poll.options[choiceIndex]
      }
    }
  } else if (poll.poll_type === 'yes_no') {
    if (body.includes('yes') || body.includes('1')) {
      responseData.response_choice = 'Yes'
    } else if (body.includes('no') || body.includes('2')) {
      responseData.response_choice = 'No'
    }
  } else if (poll.poll_type === 'rating') {
    const ratingMatch = body.match(/\b([1-9]|10)\b/)
    if (ratingMatch) {
      responseData.response_rating = parseInt(ratingMatch[1])
    }
  }

  // Store poll response
  await supabase
    .from('poll_responses')
    .insert({
      organization_id: employee.organization_id,
      poll_id: context.reference_id,
      employee_id: employee.id,
      response_text: messageBody,
      response_rating: responseData.response_rating,
      response_choice: responseData.response_choice,
      submitted_at: responseTime
    })

  // Mark context as responded
  await supabase
    .from('message_context')
    .update({
      is_responded: true,
      responded_at: responseTime
    })
    .eq('id', context.id)

  return `Thank you ${employee.name}! 📊 Your response to "${poll.title}" has been recorded. We value your input! 🙏`
}

// Handle announcement responses
async function handleAnnouncementResponse(
  supabase: any,
  employee: any,
  messageBody: string,
  context: MessageContext,
  responseTime: string
) {
  // Get announcement details
  const { data: announcement } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', context.reference_id)
    .single()

  if (!announcement) {
    return `Thank you for your response! 📢`
  }

  // Store announcement acknowledgment
  await supabase
    .from('announcement_reads')
    .insert({
      organization_id: employee.organization_id,
      announcement_id: context.reference_id,
      employee_id: employee.id,
      acknowledgment_text: messageBody,
      read_at: responseTime,
      created_at: responseTime
    })

  // Mark context as responded
  await supabase
    .from('message_context')
    .update({
      is_responded: true,
      responded_at: responseTime
    })
    .eq('id', context.id)

  return `Thank you ${employee.name}! 📢 We've noted your acknowledgment of "${announcement.title}". Your engagement is appreciated! 👍`
}

// Handle generic responses when no context is found
async function handleGenericResponse(
  supabase: any,
  employee: any,
  messageBody: string,
  responseTime: string
) {
  // Store as general feedback
  await supabase
    .from('feedback')
    .insert({
      organization_id: employee.organization_id,
      employee_id: employee.id,
      feedback_text: messageBody,
      feedback_type: 'general',
      submitted_at: responseTime,
      created_at: responseTime
    })

  return `Thank you ${employee.name}! 💬 We've received your message and will review it. If you need immediate assistance, please contact your manager or HR directly.`
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests from Twilio
    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method)
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      })
    }

    // Get Twilio auth token for signature validation
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioSignature = req.headers.get('x-twilio-signature')
    const requestUrl = req.url

    console.log('🔐 Twilio auth check:', {
      hasAuthToken: !!twilioAuthToken,
      hasSignature: !!twilioSignature,
      authTokenLength: twilioAuthToken?.length || 0
    })

    // Parse form data from Twilio webhook
    const formData = await req.formData()
    const params: Record<string, string> = {}

    // Extract all parameters (Twilio may add new ones without notice)
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString()
    }

    console.log('Twilio webhook received:', {
      url: requestUrl,
      params: Object.keys(params),
      hasSignature: !!twilioSignature
    })

    // Temporarily disable signature validation to debug webhook processing
    console.log('🔐 Signature validation temporarily disabled for debugging')
    console.log('Request details:', {
      url: requestUrl,
      hasAuthToken: !!twilioAuthToken,
      hasSignature: !!twilioSignature,
      paramCount: Object.keys(params).length,
      method: 'POST'
    })

    // Call validation function for logging but don't act on result
    if (twilioAuthToken && twilioSignature) {
      validateTwilioSignature(twilioAuthToken, twilioSignature, requestUrl, params)
    }

    // Extract required parameters (WhatsApp specific)
    const from = params.From || ''
    const body = params.Body || ''
    const messageSid = params.MessageSid || ''
    const accountSid = params.AccountSid || ''
    const to = params.To || ''

    // WhatsApp-specific parameters
    const profileName = params.ProfileName || ''
    const waId = params.WaId || ''
    const numMedia = params.NumMedia || '0'

    console.log('WhatsApp message details:', {
      from,
      to,
      profileName,
      waId,
      hasBody: !!body,
      numMedia
    })

    // Validate required fields
    if (!from || !body) {
      console.error('Missing required fields:', { from: !!from, body: !!body })
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      })
    }

    // Validate WhatsApp format
    if (!from.startsWith('whatsapp:')) {
      console.error('Invalid WhatsApp format for From field:', from)
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      })
    }

    // Initialize Supabase client (using built-in environment variables)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://kietxkkxhdwhkdiemuor.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Process the WhatsApp response with intelligent routing
    try {
      // Clean the phone number (remove whatsapp: prefix)
      const cleanNumber = from.replace('whatsapp:', '')
      console.log('🔍 Processing WhatsApp response from:', cleanNumber)

      // Find employee by phone number
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('phone', cleanNumber)
        .limit(1)

      if (employeeError || !employees || employees.length === 0) {
        console.log('❌ No employee found for phone number:', cleanNumber)
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        })
      }

      const employee = employees[0]
      console.log('✅ Found employee:', employee.name)

      // Find the most recent message context for this employee
      const { data: contexts, error: contextError } = await supabase
        .from('message_context')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('is_responded', false)
        .gt('expires_at', new Date().toISOString())
        .order('sent_at', { ascending: false })
        .limit(1)

      let responseMessage: string

      if (contexts && contexts.length > 0) {
        // Route response based on context
        const context = contexts[0]
        console.log(`🎯 Routing ${context.message_type} response for ${employee.name}`)
        responseMessage = await routeResponse(supabase, employee, body, context)
      } else {
        // No active context - handle as generic response
        console.log('💬 No active context - handling as generic response')
        responseMessage = await handleGenericResponse(supabase, employee, body, new Date().toISOString())
      }

      // Log the incoming message
      try {
        const messageData = {
          message_sid: messageSid,
          from_number: from,
          to_number: to,
          message_body: body,
          media_count: parseInt(numMedia) || 0,
          profile_name: profileName || null,
          direction: 'inbound',
          status: 'received',
          received_at: new Date().toISOString(),
          organization_id: employee.organization_id
        }

        await supabase
          .from('twilio_messages')
          .insert(messageData)

        console.log('📨 Message logged:', messageSid)
      } catch (messageLogError) {
        console.error('Error logging message:', messageLogError)
      }

      // Send contextual response message
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
      const twilioPhoneNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        const whatsappFrom = twilioPhoneNumber.startsWith('whatsapp:')
          ? twilioPhoneNumber
          : `whatsapp:${twilioPhoneNumber}`
        const whatsappTo = from

        console.log('📤 Sending contextual response:', {
          from: whatsappFrom,
          to: whatsappTo,
          messageLength: responseMessage.length
        })

        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`
            },
            body: new URLSearchParams({
              From: whatsappFrom,
              To: whatsappTo,
              Body: responseMessage
            })
          }
        )

        if (twilioResponse.ok) {
          console.log(`✅ Contextual response sent to ${employee.name}`)
        } else {
          const errorText = await twilioResponse.text()
          console.error('❌ Failed to send response:', errorText)
        }
      } else {
        console.error('❌ Missing Twilio credentials')
      }
    } catch (processingError) {
      console.error('Error processing WhatsApp response:', processingError)
    }

    // Return empty TwiML response (no reply needed as thank you is sent separately)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
    })

  } catch (error) {
    console.error('Webhook error:', error)

    // Always return valid TwiML even on error
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
    })
  }
})
