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

interface AIInsight {
  type: 'summary' | 'recommendation' | 'trend_analysis' | 'risk_alert'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
}

export class AIInsightsService {
  private async callOpenRouterAPI(prompt: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured')
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StaffPulse AI Insights'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are an expert HR analytics AI assistant for StaffPulse, a employee wellness platform. 
              You analyze employee mood data, feedback, and trends to provide actionable insights for HR managers.
              Always provide specific, actionable recommendations based on the data provided.
              Keep responses concise but insightful. Focus on employee wellbeing and organizational health.`
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
- Total Employees: ${organization_stats.total_employees}
- Departments: ${organization_stats.total_departments}
- Total Check-ins: ${organization_stats.total_checkins}
- Average Mood Score: ${organization_stats.avg_mood_score}/10
- Response Rate: ${organization_stats.response_rate}%

MOOD DISTRIBUTION:
${mood_distribution.map(m => `- ${m.mood_range}: ${m.count} responses (${m.percentage}%)`).join('\n')}

DEPARTMENT ANALYSIS:
${department_analysis.map(d => 
  `- ${d.department}: Avg Mood ${d.avg_mood}/10, ${d.employee_count} employees, ${d.response_rate.toFixed(1)} responses per employee, Trend: ${d.mood_trend}`
).join('\n')}

RECENT MOOD TRENDS (Last 7 days):
${mood_trends.slice(0, 7).map(t => `- ${t.date}: Avg Mood ${t.avg_mood}/10 (${t.response_count} responses)`).join('\n')}

RECENT FEEDBACK HIGHLIGHTS:
${recent_feedback.slice(0, 10).map(f => 
  `- ${f.employee_name} (${f.department}): Mood ${f.mood_score}/10 - "${f.feedback}"`
).join('\n')}

Please provide:
1. Overall wellness assessment (2-3 sentences)
2. Key findings and patterns (3-4 bullet points)
3. Specific actionable recommendations (3-4 bullet points)
4. Any risk alerts or concerns that need immediate attention

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

      // Generate AI analysis
      const prompt = this.createAnalysisPrompt(data)
      const aiResponse = await this.callOpenRouterAPI(prompt)

      // Parse AI response into structured insights
      const insights = this.parseAIResponse(aiResponse, data)

      // Store insights in database
      await this.storeInsights(organizationId, insights)

      return insights
    } catch (error) {
      console.error('Failed to generate AI insights:', error)
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
      confidence: 0.85
    })

    // Add specific insights based on data patterns
    if (data.organization_stats.avg_mood_score < 5) {
      insights.push({
        type: 'risk_alert',
        title: 'Low Team Morale Alert',
        content: `Average mood score of ${data.organization_stats.avg_mood_score}/10 indicates concerning team morale. Immediate intervention recommended.`,
        priority: 'critical',
        confidence: 0.95
      })
    }

    if (data.organization_stats.response_rate < 50) {
      insights.push({
        type: 'recommendation',
        title: 'Low Response Rate',
        content: `Only ${data.organization_stats.response_rate}% of employees are participating in check-ins. Consider improving communication and incentives.`,
        priority: 'high',
        confidence: 0.90
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
          insight_type: insight.type,
          title: insight.title,
          content: insight.content,
          priority: insight.priority,
          confidence_score: insight.confidence,
          data_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          data_period_end: new Date().toISOString()
        })
      })
    }
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
