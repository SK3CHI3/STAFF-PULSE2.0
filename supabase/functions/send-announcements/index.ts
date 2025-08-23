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
    console.log('Send announcements function triggered at:', new Date().toISOString())

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
    const { announcement_id, organization_id } = await req.json()

    if (!announcement_id || !organization_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Announcement ID and Organization ID are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Processing announcement:', announcement_id, 'for organization:', organization_id)

    // Get announcement details
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcement_id)
      .eq('organization_id', organization_id)
      .single()

    if (announcementError || !announcement) {
      console.error('Error fetching announcement:', announcementError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Announcement not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!announcement.is_published) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot send unpublished announcement'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if announcement has expired
    if (announcement.expires_at && new Date(announcement.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cannot send expired announcement'
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
    if (announcement.target_type === 'department' && announcement.target_departments) {
      employeesQuery = employeesQuery.in('department', announcement.target_departments)
    } else if (announcement.target_type === 'specific' && announcement.target_employees) {
      employeesQuery = employeesQuery.in('id', announcement.target_employees)
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

    // Generate announcement message
    const generateAnnouncementMessage = (announcement: any): string => {
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
        priorityPrefix = '⚠️ *HIGH PRIORITY* ⚠️\n\n'
      }

      return `${priorityPrefix}${emoji} *${announcement.title}*\n\n${announcement.content}\n\nHi {name}, this announcement is from your organization. 📢`
    }

    const announcementMessage = generateAnnouncementMessage(announcement)

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

        const personalizedMessage = announcementMessage.replace('{name}', employee.name)

        console.log(`Sending WhatsApp announcement to ${whatsappTo} for employee: ${employee.name}`)

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
          console.log(`WhatsApp announcement sent successfully to ${employee.name}: ${twilioData.sid}`)

          // Track message context for response routing
          await supabase
            .from('message_context')
            .insert({
              organization_id: organization_id,
              employee_id: employee.id,
              message_type: 'announcement',
              reference_id: announcement_id,
              sent_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
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

    // Update announcement to mark as sent via WhatsApp
    if (totalSent > 0) {
      await supabase
        .from('announcements')
        .update({ 
          send_via_whatsapp: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', announcement_id)
    }

    console.log(`Announcement sending completed. Sent: ${totalSent}, Failed: ${totalFailed}`)

    return new Response(JSON.stringify({
      success: totalSent > 0,
      message: `Announcement sent to ${totalSent} employees`,
      totalSent,
      totalFailed,
      totalEmployees: validEmployees.length,
      errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in send-announcements function:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
