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
    console.log('Send polls function triggered at:', new Date().toISOString())

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://kietxkkxhdwhkdiemuor.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

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

    // Parse request body
    const { poll_id, organization_id } = await req.json()

    if (!poll_id || !organization_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Poll ID and Organization ID are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Processing poll:', poll_id, 'for organization:', organization_id)

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', poll_id)
      .eq('organization_id', organization_id)
      .single()

    if (pollError || !poll) {
      console.error('Error fetching poll:', pollError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Poll not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!poll.is_active) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot send inactive poll'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot send expired poll'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get target employees
    let employeesQuery = supabase
      .from('employees')
      .select('id, name, phone, department')
      .eq('organization_id', organization_id)
      .eq('is_active', true)

    // Apply targeting
    if (poll.target_type === 'department' && poll.target_departments) {
      employeesQuery = employeesQuery.in('department', poll.target_departments)
    } else if (poll.target_type === 'specific' && poll.target_employees) {
      employeesQuery = employeesQuery.in('id', poll.target_employees)
    }

    const { data: employees, error: employeesError } = await employeesQuery

    if (employeesError) {
      console.error('Error fetching employees:', employeesError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch employees'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!employees || employees.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No employees found for the specified target'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Filter employees with valid phone numbers
    const validEmployees = employees.filter(emp => emp.phone && emp.phone.trim())

    if (validEmployees.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No employees with valid phone numbers found'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${validEmployees.length} employees with valid phone numbers`)

    // Generate poll message
    const generatePollMessage = (poll: any): string => {
      let message = `📊 *${poll.title}*\n\n${poll.question}\n\n`

      if (poll.poll_type === 'multiple_choice' && poll.options) {
        message += 'Please choose one:\n'
        poll.options.forEach((option: string, index: number) => {
          message += `${index + 1}. ${option}\n`
        })
      } else if (poll.poll_type === 'yes_no') {
        message += 'Please reply:\n1. Yes\n2. No\n'
      } else if (poll.poll_type === 'rating') {
        const scale = poll.rating_scale || 10
        message += `Please rate from 1 to ${scale}:\n`
      } else if (poll.poll_type === 'open_text') {
        message += 'Please share your thoughts:\n'
      }

      message += `\n\nHi {name}, your participation helps us improve! 🙏`
      return message
    }

    const pollMessage = generatePollMessage(poll)

    let totalSent = 0
    let totalFailed = 0
    const errors: string[] = []
    const whatsappFrom = twilioPhoneNumber.startsWith('whatsapp:') 
      ? twilioPhoneNumber 
      : `whatsapp:${twilioPhoneNumber}`

    // Send to each employee
    for (const employee of validEmployees) {
      try {
        // Format phone number for WhatsApp
        let whatsappTo = employee.phone
        if (!whatsappTo.startsWith('whatsapp:')) {
          // Clean and format phone number
          const cleanPhone = whatsappTo.replace(/[^\d+]/g, '')
          whatsappTo = `whatsapp:${cleanPhone.startsWith('+') ? cleanPhone : '+' + cleanPhone}`
        }

        const personalizedMessage = pollMessage.replace('{name}', employee.name)

        console.log(`Sending WhatsApp poll to ${whatsappTo} for employee: ${employee.name}`)

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
              Body: personalizedMessage
            })
          }
        )

        if (twilioResponse.ok) {
          const twilioData = await twilioResponse.json()
          totalSent++
          console.log(`WhatsApp poll sent successfully to ${employee.name}: ${twilioData.sid}`)

          // Track message context for response routing
          await supabase
            .from('message_context')
            .insert({
              organization_id: organization_id,
              employee_id: employee.id,
              message_type: 'poll',
              reference_id: poll_id,
              sent_at: new Date().toISOString(),
              expires_at: poll.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days or poll expiry
              is_responded: false
            })
        } else {
          const errorText = await twilioResponse.text()
          console.error(`Failed to send WhatsApp to ${employee.name}:`, errorText)
          errors.push(`Failed to send to ${employee.name}: ${errorText}`)
          totalFailed++
        }
      } catch (error) {
        console.error(`Error sending to ${employee.name}:`, error)
        errors.push(`Error sending to ${employee.name}: ${error.message}`)
        totalFailed++
      }
    }

    // Update poll to mark as sent via WhatsApp
    if (totalSent > 0) {
      await supabase
        .from('polls')
        .update({ 
          send_via_whatsapp: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', poll_id)
    }

    console.log(`Poll sending completed. Sent: ${totalSent}, Failed: ${totalFailed}`)

    return new Response(JSON.stringify({
      success: totalSent > 0,
      message: `Poll sent to ${totalSent} employees`,
      totalSent,
      totalFailed,
      totalEmployees: validEmployees.length,
      errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in send-polls function:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
