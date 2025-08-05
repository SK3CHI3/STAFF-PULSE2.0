/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
}

// Function to validate Twilio signature
async function validateTwilioSignature(
  authToken: string,
  twilioSignature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  try {
    // Create the signature string by concatenating URL and sorted parameters
    const sortedParams = Object.keys(params).sort().map(key => `${key}${params[key]}`).join('')
    const data = url + sortedParams

    // Create HMAC-SHA1 signature
    const key = new TextEncoder().encode(authToken)
    const message = new TextEncoder().encode(data)
    const signature = await createHmac("sha1", key).update(message).digest()

    // Convert to base64
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))

    return expectedSignature === twilioSignature
  } catch (error) {
    console.error('Error validating signature:', error)
    return false
  }
}

// Parse check-in response from message body
function parseCheckInResponse(messageBody: string) {
  const body = messageBody.toLowerCase().trim()

  // Look for numeric mood score (1-10)
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

  // Look for stress indicators
  let stress = 3 // default
  if (body.includes('stressed') || body.includes('overwhelmed') || body.includes('pressure') || body.includes('anxious')) stress = 8
  else if (body.includes('calm') || body.includes('relaxed') || body.includes('peaceful') || body.includes('chill')) stress = 2

  // Look for workload indicators
  let workload = 5 // default
  if (body.includes('busy') || body.includes('swamped') || body.includes('overloaded') || body.includes('hectic')) workload = 8
  else if (body.includes('light') || body.includes('manageable') || body.includes('easy') || body.includes('quiet')) workload = 3

  return {
    mood,
    stress,
    workload
  }
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

    // Temporarily disable signature validation for testing
    console.log('Twilio signature validation temporarily disabled for testing')
    // TODO: Re-enable signature validation in production

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

    // Process the WhatsApp response manually
    try {
      // Clean the phone number (remove whatsapp: prefix)
      const cleanNumber = from.replace('whatsapp:', '')
      console.log('🔍 Phone number debug:', {
        original: from,
        cleaned: cleanNumber,
        length: cleanNumber.length
      })

      // Find employee by phone number FIRST to get organization_id
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('phone', cleanNumber)
        .limit(1)

      if (employeeError) {
        console.error('Error finding employee:', employeeError)
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        })
      }

      if (!employees || employees.length === 0) {
        console.log('❌ No employee found for phone number:', cleanNumber)
        console.log('Available employees:', await supabase.from('employees').select('name,phone').limit(3))
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        })
      }

      const employee = employees[0]
      console.log('✅ Found employee:', employee.name, 'for phone:', cleanNumber)

      // Now log the incoming message with organization_id for proper isolation
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
          organization_id: employee.organization_id  // Add organization_id for proper isolation
        }

        await supabase
          .from('twilio_messages')
          .insert(messageData)

        console.log('📨 Incoming message logged with org_id:', messageSid, employee.organization_id)
      } catch (messageLogError) {
        console.error('Error logging message:', messageLogError)
      }

      // Parse the response
      const parsedResponse = parseCheckInResponse(body)

      // WhatsApp responses are already stored in twilio_messages table above
      // Dashboard function pulls from both twilio_messages and check_ins
      // No need to duplicate in check_ins table
      console.log('✅ WhatsApp response processed for:', employee.name)

      // Send thank you message
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
      const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

      console.log('🔧 Twilio credentials check:', {
        hasAccountSid: !!twilioAccountSid,
        hasAuthToken: !!twilioAuthToken,
        hasPhoneNumber: !!twilioPhoneNumber,
        phoneNumber: twilioPhoneNumber
      })

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
          const thankYouMessage = `Thank you ${employee.name}! 🙏 We've received your check-in and appreciate you taking the time to share how you're feeling. Your wellbeing matters to us! 💙`

          // Handle phone number format - add whatsapp: prefix if not present
          const whatsappFrom = twilioPhoneNumber.startsWith('whatsapp:')
            ? twilioPhoneNumber
            : `whatsapp:${twilioPhoneNumber}`
          const whatsappTo = from // Already in whatsapp:+number format

          console.log('📤 Sending thank you message:', {
            from: whatsappFrom,
            to: whatsappTo,
            messageLength: thankYouMessage.length
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
                Body: thankYouMessage
              })
            }
          )

          if (twilioResponse.ok) {
            console.log(`✅ Thank you WhatsApp sent to ${employee.name}`)
          } else {
            const errorText = await twilioResponse.text()
            console.error('❌ Failed to send thank you WhatsApp:', {
              status: twilioResponse.status,
              statusText: twilioResponse.statusText,
              error: errorText
            })
          }
      } else {
        console.error('❌ Missing Twilio credentials - cannot send thank you message')
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
