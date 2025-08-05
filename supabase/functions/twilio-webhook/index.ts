import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts"

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

serve(async (req) => {
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

    // Validate Twilio signature if auth token is available
    if (twilioAuthToken && twilioSignature) {
      const isValidSignature = await validateTwilioSignature(
        twilioAuthToken,
        twilioSignature,
        requestUrl,
        params
      )

      if (!isValidSignature) {
        console.error('Invalid Twilio signature')
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        })
      }
    } else {
      console.warn('Twilio signature validation skipped - missing auth token or signature')
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

    // First, log the incoming message
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
        received_at: new Date().toISOString()
      }

      await supabase
        .from('twilio_messages')
        .insert(messageData)

      console.log('📨 Incoming message logged:', messageSid)
    } catch (messageLogError) {
      console.error('Error logging message:', messageLogError)
    }

    // Process the WhatsApp response manually
    try {
      // Clean the phone number (remove whatsapp: prefix)
      const cleanNumber = from.replace('whatsapp:', '')

      // Find employee by phone number
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
        console.log('No employee found for phone number:', cleanNumber)
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
        })
      }

      const employee = employees[0]
      console.log('Found employee:', employee.name)

      // Parse the response
      const parsedResponse = parseCheckInResponse(body)

      // Store the check-in response
      const checkInData = {
        employee_id: employee.id,
        organization_id: employee.organization_id,
        mood_score: parsedResponse.mood,
        stress_level: parsedResponse.stress,
        workload_level: parsedResponse.workload,
        feedback: body, // Store the full message as feedback
        response_method: 'whatsapp',
        submitted_at: new Date().toISOString()
      }

      const { data: checkInResult, error: checkInError } = await supabase
        .from('check_ins')
        .insert(checkInData)
        .select()

      if (checkInError) {
        console.error('Error storing check-in:', checkInError)
      } else {
        console.log('✅ Check-in response stored for:', employee.name)

        // Send thank you message
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

        if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
          const thankYouMessage = `Thank you ${employee.name}! 🙏 We've received your check-in and appreciate you taking the time to share how you're feeling. Your wellbeing matters to us! 💙`

          const whatsappFrom = `whatsapp:${twilioPhoneNumber}`
          const whatsappTo = from // Already in whatsapp:+number format

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
            console.log(`Thank you WhatsApp sent to ${employee.name}`)
          } else {
            console.error('Failed to send thank you WhatsApp:', await twilioResponse.text())
          }
        }
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
