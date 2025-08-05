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

    // Call the database function to process the SMS response
    const { data, error } = await supabase.rpc('process_sms_response', {
      from_phone: from,
      message_body: body,
      twilio_message_sid: messageSid
    })

    if (error) {
      console.error('Error processing SMS response:', error)
    } else {
      console.log('SMS response processed successfully:', data)

      // If the response was processed successfully and we have thank you message data,
      // send the thank you message using Edge Function's access to environment variables
      if (data?.success && data?.thank_you_message && data?.employee_name) {
        try {
          const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
          const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
          const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

          if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
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
                  Body: data.thank_you_message
                })
              }
            )

            if (twilioResponse.ok) {
              console.log(`Thank you WhatsApp sent to ${data.employee_name}`)
            } else {
              console.error('Failed to send thank you WhatsApp:', await twilioResponse.text())
            }
          } else {
            console.warn('Twilio credentials not configured in Edge Function environment')
          }
        } catch (thankYouError) {
          console.error('Error sending thank you message:', thankYouError)
        }
      }
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
