// Simple test utility for AI insights
import { aiInsightsService } from '../services/aiInsightsService'

export const testAIInsights = async (organizationId: string) => {
  try {
    console.log('🧠 Testing AI Insights Generation...')
    
    // Test organization insights
    console.log('📊 Generating organization insights...')
    const orgInsights = await aiInsightsService.generateInsights(organizationId)
    console.log('✅ Organization insights generated:', orgInsights.length, 'insights')
    
    // Log the insights
    orgInsights.forEach((insight, index) => {
      console.log(`\n📝 Insight ${index + 1}:`)
      console.log(`Type: ${insight.type}`)
      console.log(`Title: ${insight.title}`)
      console.log(`Priority: ${insight.priority}`)
      console.log(`Content: ${insight.content.substring(0, 200)}...`)
    })
    
    return {
      success: true,
      insights: orgInsights,
      message: `Generated ${orgInsights.length} AI insights successfully`
    }
  } catch (error) {
    console.error('❌ AI Insights test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'AI insights generation failed'
    }
  }
}

// Simple function to test just the data fetching
export const testAIData = async (organizationId: string) => {
  try {
    console.log('📊 Testing AI data fetching...')
    
    const response = await fetch(`https://kietxkkxhdwhkdiemuor.supabase.co/rest/v1/rpc/get_ai_insights_data`, {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZXR4a2t4aGR3aGtkaWVtdW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTQwNjYsImV4cCI6MjA2ODU5MDA2Nn0.0V00kLlrjPNHSyIayr2kPclDfVIdlp6abM2JMNvURNI',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZXR4a2t4aGR3aGtkaWVtdW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTQwNjYsImV4cCI6MjA2ODU5MDA2Nn0.0V00kLlrjPNHSyIayr2kPclDfVIdlp6abM2JMNvURNI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        org_id: organizationId,
        days_back: 30
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ AI data fetched successfully:', data)
    
    return {
      success: true,
      data,
      message: 'Data fetched successfully'
    }
  } catch (error) {
    console.error('❌ AI data test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Data fetching failed'
    }
  }
}
