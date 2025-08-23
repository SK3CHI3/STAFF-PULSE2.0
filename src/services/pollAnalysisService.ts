import { supabase } from '@/lib/supabase';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

interface PollResponse {
  id: string;
  response_text: string;
  response_rating?: number;
  response_choice?: string;
  submitted_at: string;
}

interface Poll {
  id: string;
  title: string;
  question: string;
  poll_type: string;
  organization_id: string;
}

interface AIInsight {
  insight: string;
  confidence: number;
  category: 'positive' | 'negative' | 'neutral' | 'actionable';
}

interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;
  confidence_score: number;
}

interface PollReport {
  poll_id: string;
  organization_id: string;
  report_title: string;
  executive_summary: string;
  key_insights: AIInsight[];
  sentiment_analysis: SentimentAnalysis;
  recommendations: string[];
  response_themes: string[];
  participation_stats: {
    total_responses: number;
    response_rate: number;
    avg_response_length?: number;
    most_common_words: string[];
  };
  ai_confidence_score: number;
}

class PollAnalysisService {
  /**
   * Generate AI insights for a poll
   */
  async generatePollReport(pollId: string): Promise<PollReport | null> {
    try {
      // Get poll details with organization info
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select(`
          *,
          organizations!inner(
            id,
            name,
            industry,
            size,
            created_at
          )
        `)
        .eq('id', pollId)
        .single();

      if (pollError || !poll) {
        console.error('Error fetching poll:', pollError);
        return null;
      }

      // Get poll responses with employee context
      const { data: responses, error: responsesError } = await supabase
        .from('poll_responses')
        .select(`
          *,
          employees!inner(
            id,
            name,
            department,
            role
          )
        `)
        .eq('poll_id', pollId);

      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
        return null;
      }

      if (!responses || responses.length === 0) {
        return this.generateEmptyReport(poll);
      }

      // Get organization demographics for better context
      const { data: orgStats } = await supabase
        .from('employees')
        .select('department, role')
        .eq('organization_id', poll.organization_id);

      // Get total employee count for participation rate
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', poll.organization_id);

      // Generate AI analysis with enhanced context
      const report = await this.analyzeResponses(
        poll,
        responses,
        totalEmployees || 0,
        orgStats || []
      );

      // Save report to database
      await this.saveReport(report);

      return report;

    } catch (error) {
      console.error('Error generating poll report:', error);
      return null;
    }
  }

  /**
   * Analyze poll responses using AI-like logic with enhanced context
   */
  private async analyzeResponses(
    poll: any,
    responses: any[],
    totalEmployees: number,
    orgStats: any[]
  ): Promise<PollReport> {
    const textResponses = responses
      .filter(r => r.response_text && r.response_text.trim())
      .map(r => r.response_text.toLowerCase());

    // Enhanced context for better AI analysis
    const organizationContext = {
      name: poll.organizations?.name || 'Unknown Organization',
      industry: poll.organizations?.industry || 'Unknown Industry',
      size: poll.organizations?.size || 'Unknown Size',
      totalEmployees: totalEmployees,
      departments: [...new Set(orgStats.map(emp => emp.department).filter(Boolean))],
      responsesByDepartment: this.groupResponsesByDepartment(responses)
    };

    // Use real AI for comprehensive analysis
    const aiAnalysis = await this.performAIAnalysis(
      textResponses,
      poll.question,
      organizationContext,
      responses
    );

    const sentimentAnalysis = aiAnalysis.sentiment;
    const keyInsights = aiAnalysis.insights;
    const responseThemes = aiAnalysis.themes;
    const recommendations = aiAnalysis.recommendations;

    // Participation Stats
    const participationStats = {
      total_responses: responses.length,
      response_rate: totalEmployees > 0 ? (responses.length / totalEmployees) * 100 : 0,
      avg_response_length: textResponses.length > 0
        ? textResponses.reduce((sum, text) => sum + text.length, 0) / textResponses.length
        : 0,
      most_common_words: this.extractCommonWords(textResponses)
    };

    // Executive Summary
    const executiveSummary = this.generateExecutiveSummary(
      poll,
      participationStats,
      sentimentAnalysis,
      keyInsights.length
    );

    return {
      poll_id: poll.id,
      organization_id: poll.organization_id,
      report_title: `AI Analysis: ${poll.title}`,
      executive_summary: executiveSummary,
      key_insights: keyInsights,
      sentiment_analysis: sentimentAnalysis,
      recommendations,
      response_themes: responseThemes,
      participation_stats: participationStats,
      ai_confidence_score: this.calculateConfidenceScore(responses.length, textResponses.length)
    };
  }

  /**
   * Perform comprehensive AI analysis using OpenRouter
   */
  private async performAIAnalysis(
    textResponses: string[],
    question: string,
    organizationContext: any,
    responses: any[]
  ): Promise<{
    sentiment: SentimentAnalysis;
    insights: AIInsight[];
    themes: string[];
    recommendations: string[];
  }> {
    try {
      // Prepare detailed response context with employee info
      const detailedResponses = responses
        .filter(r => r.response_text && r.response_text.trim())
        .map((response, index) => {
          const employee = response.employees || {};
          return `Response ${index + 1}:
Department: ${employee.department || 'Unknown'}
Role: ${employee.role || 'Unknown'}
Response: "${response.response_text.trim()}"`;
        }).join('\n\n');

      const departmentBreakdown = Object.entries(organizationContext.responsesByDepartment)
        .map(([dept, count]) => `${dept}: ${count} responses`)
        .join(', ');

      const prompt = `Analyze the following employee poll responses and provide comprehensive insights:

POLL QUESTION: "${question}"

ORGANIZATION OVERVIEW:
- Company: ${organizationContext.name}
- Industry: ${organizationContext.industry}
- Size: ${organizationContext.size}
- Total Employees: ${organizationContext.totalEmployees}
- Departments: ${organizationContext.departments.join(', ')}
- Response Distribution by Department: ${departmentBreakdown}

EMPLOYEE RESPONSES:
${detailedResponses}

Please provide:
1. Overall assessment (2-3 sentences)
2. Key findings and patterns (3-4 bullet points)
3. Specific actionable recommendations (3-4 bullet points)
4. Any concerns that need immediate attention

Format your response in clear sections with bullet points for easy reading.`;

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StaffPulse HR Analytics'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse AI response in the same format as existing AI Engagement Report
      return this.parseAIResponse(aiResponse, responses.length, organizationContext);

    } catch (error) {
      console.error('AI Analysis error:', error);
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
  }

  /**
   * Parse AI response into structured format (similar to existing AI Engagement Report)
   */
  private parseAIResponse(aiResponse: string, responseCount: number, organizationContext: any): {
    sentiment: SentimentAnalysis;
    insights: AIInsight[];
    themes: string[];
    recommendations: string[];
  } {
    // Extract insights from AI response text
    const insights: AIInsight[] = [];

    // Create a summary insight with the full AI response
    insights.push({
      insight: aiResponse,
      confidence: 0.85,
      category: 'neutral'
    });

    // Basic sentiment analysis based on response content
    const sentiment: SentimentAnalysis = this.extractSentimentFromText(aiResponse, responseCount);

    // Extract themes from AI response
    const themes = this.extractThemesFromText(aiResponse);

    // Extract recommendations from AI response
    const recommendations = this.extractRecommendationsFromText(aiResponse);

    return { sentiment, insights, themes, recommendations };
  }

  /**
   * Extract sentiment from AI response text
   */
  private extractSentimentFromText(text: string, responseCount: number): SentimentAnalysis {
    const lowerText = text.toLowerCase();

    // Look for sentiment indicators in the AI response
    const positiveWords = ['positive', 'good', 'excellent', 'satisfied', 'happy', 'strong', 'successful'];
    const negativeWords = ['negative', 'poor', 'concerning', 'issues', 'problems', 'dissatisfied', 'low'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    let overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
    let positive_percentage = 40;
    let negative_percentage = 30;
    let neutral_percentage = 30;

    if (positiveCount > negativeCount) {
      overall_sentiment = 'positive';
      positive_percentage = 60;
      negative_percentage = 20;
      neutral_percentage = 20;
    } else if (negativeCount > positiveCount) {
      overall_sentiment = 'negative';
      positive_percentage = 20;
      negative_percentage = 60;
      neutral_percentage = 20;
    } else if (positiveCount > 0 && negativeCount > 0) {
      overall_sentiment = 'mixed';
      positive_percentage = 45;
      negative_percentage = 45;
      neutral_percentage = 10;
    }

    return {
      overall_sentiment,
      positive_percentage,
      negative_percentage,
      neutral_percentage,
      confidence_score: Math.min(responseCount / 10, 1)
    };
  }

  /**
   * Extract themes from AI response text
   */
  private extractThemesFromText(text: string): string[] {
    const themes: string[] = [];
    const lowerText = text.toLowerCase();

    // Common workplace themes
    const themeKeywords = {
      'Workplace Environment': ['office', 'workspace', 'environment', 'facilities'],
      'Team Collaboration': ['team', 'collaboration', 'communication', 'colleagues'],
      'Management & Leadership': ['management', 'leadership', 'supervisor', 'manager'],
      'Work-Life Balance': ['balance', 'flexible', 'remote', 'hours'],
      'Training & Development': ['training', 'development', 'learning', 'skills'],
      'Compensation & Benefits': ['salary', 'benefits', 'compensation', 'pay']
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        themes.push(theme);
      }
    });

    return themes.length > 0 ? themes : ['Employee Feedback'];
  }

  /**
   * Extract recommendations from AI response text
   */
  private extractRecommendationsFromText(text: string): string[] {
    const recommendations: string[] = [];

    // Look for recommendation patterns in the AI response
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const recommendation = trimmedLine.replace(/^[•\-*]\s*/, '').trim();
        if (recommendation.length > 10) {
          recommendations.push(recommendation);
        }
      }
    });

    // If no bullet points found, provide default recommendations
    if (recommendations.length === 0) {
      recommendations.push('Review individual employee responses for detailed insights');
      recommendations.push('Consider conducting follow-up discussions with employees');
      recommendations.push('Implement changes based on the feedback patterns identified');
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }



  /**
   * Group responses by department
   */
  private groupResponsesByDepartment(responses: any[]): { [key: string]: number } {
    const departmentCounts: { [key: string]: number } = {};

    responses.forEach(response => {
      const dept = response.employees?.department || 'Unknown';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    return departmentCounts;
  }












  /**
   * Extract most common words from responses
   */
  private extractCommonWords(textResponses: string[]): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those', 'my', 'our', 'your', 'their', 'his', 'her', 'its', 'me', 'us', 'him', 'them', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves'];

    const wordCount: { [key: string]: number } = {};

    textResponses.forEach(text => {
      const words = text.split(/\s+/).filter(word =>
        word.length > 2 &&
        !stopWords.includes(word.toLowerCase()) &&
        /^[a-zA-Z]+$/.test(word)
      );

      words.forEach(word => {
        const lowerWord = word.toLowerCase();
        wordCount[lowerWord] = (wordCount[lowerWord] || 0) + 1;
      });
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    poll: Poll,
    stats: any,
    sentiment: SentimentAnalysis,
    insightCount: number
  ): string {
    const responseRate = stats.response_rate.toFixed(1);
    const sentimentDesc = sentiment.overall_sentiment === 'positive' ? 'positive' :
                         sentiment.overall_sentiment === 'negative' ? 'concerning' :
                         sentiment.overall_sentiment === 'mixed' ? 'mixed' : 'neutral';

    return `This poll "${poll.title}" received ${stats.total_responses} responses (${responseRate}% response rate). The overall sentiment is ${sentimentDesc}, with ${sentiment.positive_percentage.toFixed(0)}% positive and ${sentiment.negative_percentage.toFixed(0)}% negative responses. AI analysis identified ${insightCount} key insights and ${stats.most_common_words.length} common themes in employee feedback. ${stats.avg_response_length > 50 ? 'Employees provided detailed feedback, indicating high engagement.' : 'Responses were concise, suggesting clear opinions on the topic.'}`;
  }

  /**
   * Calculate AI confidence score
   */
  private calculateConfidenceScore(totalResponses: number, textResponses: number): number {
    const responseScore = Math.min(totalResponses / 20, 1); // Higher confidence with more responses
    const textScore = textResponses > 0 ? Math.min(textResponses / 10, 1) : 0.3;
    return Math.round(((responseScore + textScore) / 2) * 100) / 100;
  }

  /**
   * Generate empty report for polls with no responses
   */
  private generateEmptyReport(poll: Poll): PollReport {
    return {
      poll_id: poll.id,
      organization_id: poll.organization_id,
      report_title: `AI Analysis: ${poll.title}`,
      executive_summary: 'No responses received yet for this poll. AI analysis will be available once employees start responding.',
      key_insights: [],
      sentiment_analysis: {
        overall_sentiment: 'neutral',
        positive_percentage: 0,
        negative_percentage: 0,
        neutral_percentage: 0,
        confidence_score: 0
      },
      recommendations: ['Encourage employee participation by following up on the poll', 'Consider sending reminder messages to increase response rates'],
      response_themes: [],
      participation_stats: {
        total_responses: 0,
        response_rate: 0,
        most_common_words: []
      },
      ai_confidence_score: 0
    };
  }

  /**
   * Save report to database
   */
  private async saveReport(report: PollReport): Promise<void> {
    const { error } = await supabase
      .from('poll_reports')
      .upsert({
        poll_id: report.poll_id,
        organization_id: report.organization_id,
        report_title: report.report_title,
        executive_summary: report.executive_summary,
        key_insights: report.key_insights,
        sentiment_analysis: report.sentiment_analysis,
        recommendations: report.recommendations,
        response_themes: report.response_themes,
        participation_stats: report.participation_stats,
        ai_confidence_score: report.ai_confidence_score,
        status: 'generated'
      }, {
        onConflict: 'poll_id'
      });

    if (error) {
      console.error('Error saving poll report:', error);
      throw error;
    }
  }

  /**
   * Get existing report for a poll
   */
  async getPollReport(pollId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('poll_reports')
      .select('*')
      .eq('poll_id', pollId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching poll report:', error);
      return null;
    }

    return data;
  }
}

export const pollAnalysisService = new PollAnalysisService();
