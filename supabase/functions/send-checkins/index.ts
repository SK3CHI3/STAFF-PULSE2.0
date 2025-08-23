import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Send check-ins function triggered at:', new Date().toISOString())

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://kietxkkxhdwhkdiemuor.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials in environment')
      return new Response(JSON.stringify({
        success: false,
        error: 'Twilio credentials not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Using Twilio phone number:', twilioPhoneNumber)

    // Get pending check-ins from database
    const { data: pendingCheckins, error: fetchError } = await supabase
      .from('check_ins')
      .select(`
        id,
        organization_id,
        phone_number,
        message_sent,
        organizations!inner(name)
      `)
      .eq('status', 'pending')
      .not('phone_number', 'is', null)
      .neq('phone_number', '')
      .limit(100)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching pending check-ins:', fetchError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch pending check-ins'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!pendingCheckins || pendingCheckins.length === 0) {
      console.log('No pending check-ins found')
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending check-ins to send',
        sent: 0,
        failed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${pendingCheckins.length} pending check-ins to send`)

    let totalSent = 0
    let totalFailed = 0
    const whatsappFrom = `whatsapp:${twilioPhoneNumber}`

    // Process each pending check-in
    for (const checkin of pendingCheckins) {
      try {
        // Format WhatsApp number
        let whatsappTo: string
        if (checkin.phone_number.startsWith('+')) {
          whatsappTo = `whatsapp:${checkin.phone_number}`
        } else {
          whatsappTo = `whatsapp:+${checkin.phone_number}`
        }

        console.log(`Sending WhatsApp to ${whatsappTo} for organization: ${checkin.organizations.name}`)

        // Send WhatsApp message via Twilio
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
              Body: checkin.message_sent
            })
          }
        )

        if (twilioResponse.ok) {
          const twilioData = await twilioResponse.json()

          // Update check-in status to sent
          const { error: updateError } = await supabase
            .from('check_ins')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              twilio_response: twilioData
            })
            .eq('id', checkin.id)

          if (updateError) {
            console.error(`Failed to update check-in ${checkin.id}:`, updateError)
          } else {
            totalSent++
            console.log(`WhatsApp check-in sent successfully: ${checkin.id} to ${whatsappTo}`)

            // Set organization context to expect check-in responses
            await supabase
              .from('organization_context')
              .upsert({
                organization_id: checkin.organization_id,
                current_context: 'checkin',
                context_data: { checkin_batch: new Date().toISOString() },
                set_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
              }, {
                onConflict: 'organization_id'
              })
          }
        } else {
          const errorText = await twilioResponse.text()
          console.error(`Failed to send WhatsApp to ${whatsappTo}:`, errorText)
          
          // Update check-in status to failed
          const { error: updateError } = await supabase
            .from('check_ins')
            .update({
              status: 'failed',
              error_message: errorText,
              updated_at: new Date().toISOString()
            })
            .eq('id', checkin.id)

          if (updateError) {
            console.error(`Failed to update failed check-in ${checkin.id}:`, updateError)
          }
          
          totalFailed++
        }
      } catch (error) {
        console.error(`Error processing check-in ${checkin.id}:`, error)
        
        // Update check-in status to failed
        const { error: updateError } = await supabase
          .from('check_ins')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', checkin.id)

        if (updateError) {
          console.error(`Failed to update failed check-in ${checkin.id}:`, updateError)
        }
        
        totalFailed++
      }
    }

    console.log(`Check-in sending completed. Sent: ${totalSent}, Failed: ${totalFailed}`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Check-in sending completed',
      sent: totalSent,
      failed: totalFailed,
      total_processed: pendingCheckins.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in send-checkins function:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
