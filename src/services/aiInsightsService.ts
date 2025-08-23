import { supabaseConfig } from '../lib/supabase'

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

interface AIInsightData {
  organization_stats: {
    total_employees: number
    total_departments: number
    total_checkins: number
    avg_mood_score: number
    response_rate: number
  }
  mood_trends: Array<{
    date: string
    avg_mood: number
    response_count: number
  }>
  department_analysis: Array<{
    department: string
    avg_mood: number
    employee_count: number
    response_count: number
    response_rate: number
    mood_trend: string
  }>
  recent_feedback: Array<{
    employee_name: string
    department: string
    mood_score: number
    feedback: string
    created_at: string
    is_anonymous: boolean
  }>
  mood_distribution: Array<{
    mood_range: string
    count: number
    percentage: number
  }>
}

interface EmployeeInsightData {
  employee_info: {
    id: string
    name: string
    department: string
    role: string
    hire_date: string
    total_checkins: number
    avg_mood_score: number
    response_rate: number
  }
  mood_trends: Array<{
    date: string
    mood_score: number
    feedback: string | null
  }>
  mood_patterns: {
    best_day_of_week: string
    worst_day_of_week: string
    mood_variance: number
    trend_direction: 'improving' | 'declining' | 'stable'
  }
  feedback_analysis: {
    total_feedback_entries: number
    positive_feedback_count: number
    negative_feedback_count: number
    common_themes: string[]
  }
  comparison_to_peers: {
    department_avg_mood: number
    organization_avg_mood: number
    percentile_rank: number
  }
}

interface AIInsight {
  type: 'summary' | 'recommendation' | 'trend_analysis' | 'risk_alert' | 'personal_insight'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  employee_id?: string
  scope: 'organization' | 'individual'
}

export class AIInsightsService {
  private async callOpenRouterAPI(prompt: string, isPersonalInsight: boolean = false): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured')
    }

    try {
      const systemContent = isPersonalInsight
        ? `You are an expert HR analytics AI assistant for StaffPulse, specializing in individual employee wellness analysis.
           You analyze personal mood data, feedback patterns, and behavioral trends to provide personalized insights for HR managers.
           Always provide specific, actionable recommendations that respect employee privacy and focus on supportive interventions.
           Keep responses professional, empathetic, and focused on employee wellbeing and growth opportunities.
           Avoid making assumptions about personal circumstances and focus on observable patterns in the data.`
        : `You are an expert HR analytics AI assistant for StaffPulse, a employee wellness platform.
           You analyze employee mood data, feedback, and trends to provide actionable insights for HR managers.
           Always provide specific, actionable recommendations based on the data provided.
           Keep responses concise but insightful. Focus on employee wellbeing and organizational health.`

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StaffPulse AI Insights'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528:free',
          messages: [
            {
              role: 'system',
              content: systemContent
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      })

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error(`OpenRouter API Credits Required: Your account has insufficient credits. Please add credits at https://openrouter.ai/settings/credits to use AI insights.`)
        }
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'No response generated'
    } catch (error) {
      console.error('OpenRouter API call failed:', error)
      throw error
    }
  }

  private createAnalysisPrompt(data: AIInsightData): string {
    const { organization_stats, mood_trends, department_analysis, recent_feedback, mood_distribution } = data

    return `
Analyze the following employee wellness data and provide insights:

ORGANIZATION OVERVIEW:
- Total Employees: ${organization_stats?.total_employees || 0}
- Departments: ${organization_stats?.total_departments || 0}
- Total Check-ins: ${organization_stats?.total_checkins || 0}
- Average Mood Score: ${organization_stats?.avg_mood_score || 0}/10
- Response Rate: ${organization_stats?.response_rate || 0}%

MOOD DISTRIBUTION:
${mood_distribution && mood_distribution.length > 0
  ? mood_distribution.map(m => `- ${m.mood_range}: ${m.count} responses (${m.percentage}%)`).join('\n')
  : '- No mood distribution data available'
}

DEPARTMENT ANALYSIS:
${department_analysis && department_analysis.length > 0
  ? department_analysis.map(d =>
      `- ${d.department}: Avg Mood ${d.avg_mood}/10, ${d.employee_count} employees, ${d.response_rate.toFixed(1)} responses per employee, Trend: ${d.mood_trend}`
    ).join('\n')
  : '- No department analysis data available'
}

RECENT MOOD TRENDS (Last 7 days):
${mood_trends && mood_trends.length > 0
  ? mood_trends.slice(0, 7).map(t => `- ${t.date}: Avg Mood ${t.avg_mood}/10 (${t.response_count} responses)`).join('\n')
  : '- No recent mood trends available'
}

RECENT FEEDBACK HIGHLIGHTS:
${recent_feedback && recent_feedback.length > 0
  ? recent_feedback.slice(0, 10).map(f =>
      `- ${f.employee_name} (${f.department}): Mood ${f.mood_score}/10 - "${f.feedback}"`
    ).join('\n')
  : '- No recent feedback available'
}

Please provide:
1. Overall wellness assessment (2-3 sentences)
2. Key findings and patterns (3-4 bullet points)
3. Specific actionable recommendations (3-4 bullet points)
4. Any risk alerts or concerns that need immediate attention

Format your response in clear sections with bullet points for easy reading.
`
  }

  private createEmployeeAnalysisPrompt(data: EmployeeInsightData): string {
    const { employee_info, mood_trends, mood_patterns, feedback_analysis, comparison_to_peers } = data

    return `
Analyze the following individual employee wellness data and provide personalized insights:

EMPLOYEE PROFILE:
- Name: ${employee_info?.name || 'Unknown'}
- Department: ${employee_info?.department || 'Unknown'}
- Role: ${employee_info?.role || 'Unknown'}
- Tenure: ${employee_info?.hire_date || 'Unknown'}
- Total Check-ins: ${employee_info?.total_checkins || 0}
- Average Mood Score: ${employee_info?.avg_mood_score || 0}/10
- Response Rate: ${employee_info?.response_rate || 0}%

MOOD PATTERNS:
- Best performing day: ${mood_patterns?.best_day_of_week || 'Unknown'}
- Most challenging day: ${mood_patterns?.worst_day_of_week || 'Unknown'}
- Mood consistency: ${mood_patterns?.mood_variance ? (mood_patterns.mood_variance > 2 ? 'Highly variable' : mood_patterns.mood_variance > 1 ? 'Moderately variable' : 'Consistent') : 'Unknown'}
- Overall trend: ${mood_patterns?.trend_direction || 'Unknown'}

FEEDBACK ANALYSIS:
- Total feedback entries: ${feedback_analysis?.total_feedback_entries || 0}
- Positive feedback: ${feedback_analysis?.positive_feedback_count || 0}
- Concerns raised: ${feedback_analysis?.negative_feedback_count || 0}
- Common themes: ${feedback_analysis?.common_themes?.join(', ') || 'None identified'}

PEER COMPARISON:
- Department average: ${comparison_to_peers?.department_avg_mood || 0}/10
- Organization average: ${comparison_to_peers?.organization_avg_mood || 0}/10
- Performance percentile: ${comparison_to_peers?.percentile_rank || 0}th percentile

RECENT MOOD TRENDS:
${mood_trends && mood_trends.length > 0
  ? mood_trends.slice(-10).map(t => `- ${t.date}: ${t.mood_score}/10${t.feedback ? ` - "${t.feedback}"` : ''}`).join('\n')
  : '- No recent mood trends available'
}

Please provide:
1. Personal wellness assessment (2-3 sentences)
2. Behavioral patterns and insights (3-4 bullet points)
3. Potential areas of concern or strength (2-3 bullet points)
4. Personalized recommendations for support (3-4 bullet points)
5. Suggested interventions or check-ins (2-3 bullet points)

Focus on supportive, actionable insights that respect privacy while helping HR provide better support.
Format your response in clear sections with bullet points for easy reading.
`
  }

  async generateInsights(organizationId: string): Promise<AIInsight[]> {
    try {
      // Fetch comprehensive data from database
      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_ai_insights_data`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_id: organizationId,
          days_back: 30
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch insights data: ${response.status}`)
      }

      const data: AIInsightData = await response.json()

      // Validate data and provide defaults for null values
      const validatedData: AIInsightData = {
        organization_stats: data.organization_stats || {
          total_employees: 0,
          total_departments: 0,
          total_checkins: 0,
          avg_mood_score: 0,
          response_rate: 0
        },
        mood_trends: data.mood_trends || [],
        department_analysis: data.department_analysis || [],
        recent_feedback: data.recent_feedback || [],
        mood_distribution: data.mood_distribution || []
      }

      // Generate AI analysis
      const prompt = this.createAnalysisPrompt(validatedData)
      const aiResponse = await this.callOpenRouterAPI(prompt)

      // Parse AI response into structured insights
      const insights = this.parseAIResponse(aiResponse, validatedData)

      // Store insights in database
      await this.storeInsights(organizationId, insights)

      return insights
    } catch (error) {
      console.error('Failed to generate AI insights:', error)
      throw error
    }
  }

  async generateEmployeeInsights(organizationId: string, employeeId: string): Promise<AIInsight[]> {
    try {
      // Fetch employee-specific data from database
      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_employee_insights_data`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_id: organizationId,
          emp_id: employeeId,
          days_back: 90
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch employee insights data: ${response.status}`)
      }

      const data: EmployeeInsightData = await response.json()

      // Validate employee data and provide defaults
      const validatedData: EmployeeInsightData = {
        employee_info: data.employee_info || {
          id: employeeId,
          name: 'Unknown Employee',
          department: 'Unknown',
          role: 'Unknown',
          hire_date: new Date().toISOString(),
          total_checkins: 0,
          avg_mood_score: 0,
          response_rate: 0
        },
        mood_trends: data.mood_trends || [],
        mood_patterns: data.mood_patterns || {
          best_day_of_week: 'Unknown',
          worst_day_of_week: 'Unknown',
          mood_variance: 0,
          trend_direction: 'stable'
        },
        feedback_analysis: data.feedback_analysis || {
          total_feedback_entries: 0,
          positive_feedback_count: 0,
          negative_feedback_count: 0,
          common_themes: []
        },
        comparison_to_peers: data.comparison_to_peers || {
          department_avg_mood: 0,
          organization_avg_mood: 0,
          percentile_rank: 0
        }
      }

      // Generate AI analysis for individual employee
      const prompt = this.createEmployeeAnalysisPrompt(validatedData)
      const aiResponse = await this.callOpenRouterAPI(prompt, true)

      // Parse AI response into structured insights
      const insights = this.parseEmployeeAIResponse(aiResponse, validatedData)

      // Store insights in database
      await this.storeEmployeeInsights(organizationId, employeeId, insights)

      return insights
    } catch (error) {
      console.error('Failed to generate employee AI insights:', error)
      throw error
    }
  }

  private parseAIResponse(aiResponse: string, data: AIInsightData): AIInsight[] {
    const insights: AIInsight[] = []

    // Create summary insight
    insights.push({
      type: 'summary',
      title: 'Overall Wellness Assessment',
      content: aiResponse,
      priority: this.determinePriority(data.organization_stats.avg_mood_score),
      confidence: 0.85,
      scope: 'organization'
    })

    // Add specific insights based on data patterns
    if (data.organization_stats.avg_mood_score < 5) {
      insights.push({
        type: 'risk_alert',
        title: 'Low Team Morale Alert',
        content: `Average mood score of ${data.organization_stats.avg_mood_score}/10 indicates concerning team morale. Immediate intervention recommended.`,
        priority: 'critical',
        confidence: 0.95,
        scope: 'organization'
      })
    }

    if (data.organization_stats.response_rate < 50) {
      insights.push({
        type: 'recommendation',
        title: 'Low Response Rate',
        content: `Only ${data.organization_stats.response_rate}% of employees are participating in check-ins. Consider improving communication and incentives.`,
        priority: 'high',
        confidence: 0.90,
        scope: 'organization'
      })
    }

    return insights
  }

  private parseEmployeeAIResponse(aiResponse: string, data: EmployeeInsightData): AIInsight[] {
    const insights: AIInsight[] = []

    // Create personal insight
    insights.push({
      type: 'personal_insight',
      title: `Personal Wellness Assessment - ${data.employee_info.name}`,
      content: aiResponse,
      priority: this.determinePriority(data.employee_info.avg_mood_score),
      confidence: 0.85,
      employee_id: data.employee_info.id,
      scope: 'individual'
    })

    // Add specific insights based on individual patterns
    if (data.employee_info.avg_mood_score < 5) {
      insights.push({
        type: 'risk_alert',
        title: 'Individual Wellness Concern',
        content: `${data.employee_info.name} has an average mood score of ${data.employee_info.avg_mood_score}/10, indicating potential wellness concerns. Consider a supportive check-in.`,
        priority: 'high',
        confidence: 0.90,
        employee_id: data.employee_info.id,
        scope: 'individual'
      })
    }

    if (data.mood_patterns.trend_direction === 'declining') {
      insights.push({
        type: 'trend_analysis',
        title: 'Declining Mood Trend',
        content: `${data.employee_info.name}'s mood has been declining recently. This may indicate increased stress or challenges that could benefit from HR support.`,
        priority: 'medium',
        confidence: 0.80,
        employee_id: data.employee_info.id,
        scope: 'individual'
      })
    }

    if (data.employee_info.response_rate < 30) {
      insights.push({
        type: 'recommendation',
        title: 'Low Engagement',
        content: `${data.employee_info.name} has a low check-in response rate (${data.employee_info.response_rate}%). Consider reaching out to understand barriers to participation.`,
        priority: 'medium',
        confidence: 0.85,
        employee_id: data.employee_info.id,
        scope: 'individual'
      })
    }

    return insights
  }

  private parsePollAIResponse(aiResponse: string, pollsData: any[]): AIInsight[] {
    const insights: AIInsight[] = []

    // Create main poll analysis insight
    insights.push({
      type: 'summary',
      title: 'Poll Analysis Summary',
      content: aiResponse,
      priority: 'medium',
      confidence: 0.85,
      scope: 'organization'
    })

    // Add specific insights based on poll data patterns
    const totalPolls = pollsData.length
    const activePolls = pollsData.filter(p => p.is_active).length
    const totalResponses = pollsData.reduce((sum, p) => sum + (p.poll_responses?.length || 0), 0)
    const avgResponsesPerPoll = totalPolls > 0 ? totalResponses / totalPolls : 0

    if (avgResponsesPerPoll < 3) {
      insights.push({
        type: 'recommendation',
        title: 'Low Poll Engagement',
        content: `Average of ${avgResponsesPerPoll.toFixed(1)} responses per poll indicates low engagement. Consider improving poll design, timing, or incentives to increase participation.`,
        priority: 'high',
        confidence: 0.90,
        scope: 'organization'
      })
    }

    if (activePolls === 0 && totalPolls > 0) {
      insights.push({
        type: 'recommendation',
        title: 'No Active Polls',
        content: `All ${totalPolls} polls are inactive. Consider creating new polls to maintain employee engagement and gather fresh feedback.`,
        priority: 'medium',
        confidence: 0.95,
        scope: 'organization'
      })
    }

    // Check for polls with no responses
    const pollsWithoutResponses = pollsData.filter(p => !p.poll_responses || p.poll_responses.length === 0)
    if (pollsWithoutResponses.length > 0) {
      insights.push({
        type: 'trend_analysis',
        title: 'Unresponsive Polls Detected',
        content: `${pollsWithoutResponses.length} polls have received no responses. Review poll topics, timing, and distribution methods to improve engagement.`,
        priority: 'medium',
        confidence: 0.85,
        scope: 'organization'
      })
    }

    return insights
  }

  private parseEngagementAIResponse(aiResponse: string, data: any): AIInsight[] {
    const insights: AIInsight[] = []
    const { checkIns, polls, announcements } = data

    // Create main engagement analysis insight
    insights.push({
      type: 'summary',
      title: 'Employee Engagement Analysis',
      content: aiResponse,
      priority: 'medium',
      confidence: 0.85,
      scope: 'organization'
    })

    // Calculate engagement metrics
    const totalCheckIns = checkIns?.length || 0
    const totalPollResponses = polls?.reduce((sum: number, p: any) => sum + (p.poll_responses?.length || 0), 0) || 0
    const totalAnnouncements = announcements?.length || 0
    const totalAcknowledgments = announcements?.reduce((sum: number, a: any) => sum + (a.announcement_reads?.length || 0), 0) || 0

    // Add specific insights based on engagement patterns
    if (totalCheckIns === 0 && totalPollResponses === 0) {
      insights.push({
        type: 'risk_alert',
        title: 'Critical: No Employee Engagement',
        content: `No check-ins or poll responses detected. This indicates a complete lack of employee engagement. Immediate action required to establish communication channels.`,
        priority: 'critical',
        confidence: 0.95,
        scope: 'organization'
      })
    }

    if (totalCheckIns > 0 && totalPollResponses === 0) {
      insights.push({
        type: 'recommendation',
        title: 'Expand Engagement Channels',
        content: `Strong check-in participation (${totalCheckIns} responses) but no poll engagement. Consider creating polls to gather more structured feedback from employees.`,
        priority: 'medium',
        confidence: 0.85,
        scope: 'organization'
      })
    }

    if (totalAnnouncements > 0 && totalAcknowledgments === 0) {
      insights.push({
        type: 'trend_analysis',
        title: 'Low Announcement Engagement',
        content: `${totalAnnouncements} announcements sent but no acknowledgments received. Review announcement content and delivery methods to improve engagement.`,
        priority: 'high',
        confidence: 0.90,
        scope: 'organization'
      })
    }

    // Calculate overall engagement score
    const engagementScore = (totalCheckIns * 0.4) + (totalPollResponses * 0.4) + (totalAcknowledgments * 0.2)
    if (engagementScore < 10) {
      insights.push({
        type: 'recommendation',
        title: 'Low Overall Engagement Score',
        content: `Engagement score of ${engagementScore.toFixed(1)} indicates room for improvement. Focus on increasing participation across all channels through better communication and incentives.`,
        priority: 'high',
        confidence: 0.85,
        scope: 'organization'
      })
    }

    return insights
  }

  private determinePriority(avgMood: number): 'low' | 'medium' | 'high' | 'critical' {
    if (avgMood < 4) return 'critical'
    if (avgMood < 6) return 'high'
    if (avgMood < 7) return 'medium'
    return 'low'
  }

  private async storeInsights(organizationId: string, insights: AIInsight[]): Promise<void> {
    for (const insight of insights) {
      await fetch(`${supabaseConfig.url}/rest/v1/ai_insights`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          employee_id: insight.employee_id || null,
          insight_type: insight.type,
          title: insight.title,
          content: insight.content,
          priority: insight.priority,
          confidence_score: insight.confidence,
          scope: insight.scope,
          data_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          data_period_end: new Date().toISOString()
        })
      })
    }
  }

  private async storeEmployeeInsights(organizationId: string, employeeId: string, insights: AIInsight[]): Promise<void> {
    for (const insight of insights) {
      await fetch(`${supabaseConfig.url}/rest/v1/ai_insights`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          employee_id: employeeId,
          insight_type: insight.type,
          title: insight.title,
          content: insight.content,
          priority: insight.priority,
          confidence_score: insight.confidence,
          scope: 'individual',
          data_period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          data_period_end: new Date().toISOString()
        })
      })
    }
  }

  async getAllEmployeesWithInsights(organizationId: string): Promise<any[]> {
    try {
      console.log(`🔍 Fetching employees for organization: ${organizationId}`)

      const response = await fetch(`${supabaseConfig.url}/rest/v1/employees?organization_id=eq.${organizationId}&is_active=eq.true&select=id,name,department,position,phone,email`, {
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch employees: ${response.status} - ${errorText}`)
        throw new Error(`Failed to fetch employees: ${response.status}`)
      }

      const employees = await response.json()
      console.log(`📋 Found ${employees.length} employees`)

      // For each employee, get their latest insights
      const employeesWithInsights = await Promise.all(
        employees.map(async (employee: any) => {
          try {
            const insightsResponse = await fetch(`${supabaseConfig.url}/rest/v1/ai_insights?organization_id=eq.${organizationId}&employee_id=eq.${employee.id}&order=created_at.desc&limit=3`, {
              headers: {
                'apikey': supabaseConfig.anonKey,
                'Authorization': `Bearer ${supabaseConfig.anonKey}`
              }
            })

            const insights = insightsResponse.ok ? await insightsResponse.json() : []

            return {
              ...employee,
              role: employee.position, // Map position to role for compatibility
              insights: insights || [],
              hasInsights: insights.length > 0
            }
          } catch (error) {
            console.error(`Failed to fetch insights for employee ${employee.id}:`, error)
            return {
              ...employee,
              role: employee.position,
              insights: [],
              hasInsights: false
            }
          }
        })
      )

      console.log(`✅ Successfully fetched ${employeesWithInsights.length} employees with insights`)
      return employeesWithInsights
    } catch (error) {
      console.error('❌ Failed to get employees with insights:', error)
      return []
    }
  }

  async generatePollInsights(organizationId: string): Promise<AIInsight[]> {
    try {
      // Fetch poll data from database
      const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_poll_insights_data`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_id: organizationId,
          days_back: 30
        })
      })

      if (!response.ok) {
        // If RPC doesn't exist, fetch poll data directly
        const pollsResponse = await fetch(`${supabaseConfig.url}/rest/v1/polls?organization_id=eq.${organizationId}&select=*,poll_responses(*)`, {
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`
          }
        })

        if (!pollsResponse.ok) {
          throw new Error(`Failed to fetch poll data: ${pollsResponse.status}`)
        }

        const pollsData = await pollsResponse.json()
        return await this.generatePollInsightsFromData(organizationId, pollsData)
      }

      const data = await response.json()
      return await this.generatePollInsightsFromData(organizationId, data)
    } catch (error) {
      console.error('Failed to generate poll insights:', error)
      throw error
    }
  }

  async generateEngagementInsights(organizationId: string): Promise<AIInsight[]> {
    try {
      // Fetch comprehensive engagement data
      const [checksResponse, pollsResponse, announcementsResponse] = await Promise.all([
        fetch(`${supabaseConfig.url}/rest/v1/check_ins?organization_id=eq.${organizationId}&select=*`, {
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`
          }
        }),
        fetch(`${supabaseConfig.url}/rest/v1/polls?organization_id=eq.${organizationId}&select=*,poll_responses(*)`, {
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`
          }
        }),
        fetch(`${supabaseConfig.url}/rest/v1/announcements?organization_id=eq.${organizationId}&select=*,announcement_reads(*)`, {
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`
          }
        })
      ])

      const [checksData, pollsData, announcementsData] = await Promise.all([
        checksResponse.json(),
        pollsResponse.json(),
        announcementsResponse.json()
      ])

      return await this.generateEngagementInsightsFromData(organizationId, {
        checkIns: checksData,
        polls: pollsData,
        announcements: announcementsData
      })
    } catch (error) {
      console.error('Failed to generate engagement insights:', error)
      throw error
    }
  }

  private async generatePollInsightsFromData(organizationId: string, pollsData: any[]): Promise<AIInsight[]> {
    const prompt = this.createPollAnalysisPrompt(pollsData)
    const aiResponse = await this.callOpenRouterAPI(prompt)

    // Parse AI response into structured insights (same as wellness insights)
    const insights = this.parsePollAIResponse(aiResponse, pollsData)

    // Store insights
    await this.storeInsights(organizationId, insights)
    return insights
  }

  private async generateEngagementInsightsFromData(organizationId: string, data: any): Promise<AIInsight[]> {
    const prompt = this.createEngagementAnalysisPrompt(data)
    const aiResponse = await this.callOpenRouterAPI(prompt)

    // Parse AI response into structured insights (same as wellness insights)
    const insights = this.parseEngagementAIResponse(aiResponse, data)

    // Store insights
    await this.storeInsights(organizationId, insights)
    return insights
  }

  private createPollAnalysisPrompt(pollsData: any[]): string {
    return `
Analyze the following poll and survey data to provide insights on employee feedback patterns:

POLLS OVERVIEW:
- Total Polls: ${pollsData.length}
- Active Polls: ${pollsData.filter(p => p.is_active).length}

POLL DETAILS:
${pollsData.map(poll => `
- "${poll.title}" (${poll.poll_type})
  Question: ${poll.question}
  Responses: ${poll.poll_responses?.length || 0}
  ${poll.poll_responses?.map((r: any) => `  • ${r.response_text || r.response_choice || r.response_rating}`).join('\n') || '  No responses yet'}
`).join('\n')}

Please provide:
1. Overall poll engagement assessment (2-3 sentences)
2. Key themes and patterns from responses (3-4 bullet points)
3. Recommendations for improving poll effectiveness (3-4 bullet points)
4. Insights about employee sentiment from poll responses

Format your response in clear sections with bullet points for easy reading.
`
  }

  private createEngagementAnalysisPrompt(data: any): string {
    const { checkIns, polls, announcements } = data

    return `
Analyze the following comprehensive employee engagement data:

CHECK-INS DATA:
- Total Check-ins: ${checkIns?.length || 0}
- Average Mood: ${checkIns?.length ? (checkIns.reduce((sum: number, c: any) => sum + (c.mood_score || 0), 0) / checkIns.length).toFixed(1) : 'N/A'}

POLLS DATA:
- Total Polls: ${polls?.length || 0}
- Total Poll Responses: ${polls?.reduce((sum: number, p: any) => sum + (p.poll_responses?.length || 0), 0) || 0}

ANNOUNCEMENTS DATA:
- Total Announcements: ${announcements?.length || 0}
- Total Acknowledgments: ${announcements?.reduce((sum: number, a: any) => sum + (a.announcement_reads?.length || 0), 0) || 0}

Please provide:
1. Overall employee engagement assessment (2-3 sentences)
2. Cross-platform engagement patterns (3-4 bullet points)
3. Recommendations for improving overall engagement (4-5 bullet points)
4. Potential areas of concern or opportunity

Focus on how different engagement channels (check-ins, polls, announcements) work together.
Format your response in clear sections with bullet points for easy reading.
`
  }

  async getStoredInsights(organizationId: string): Promise<any[]> {
    const response = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_ai_insights`, {
      method: 'POST',
      headers: {
        'apikey': supabaseConfig.anonKey,
        'Authorization': `Bearer ${supabaseConfig.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        org_id: organizationId,
        limit_count: 20
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch stored insights: ${response.status}`)
    }

    return await response.json()
  }
}

export const aiInsightsService = new AIInsightsService()
