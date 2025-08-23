import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target,
  Lightbulb,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PollReportProps {
  pollId: string;
  onClose?: () => void;
}

interface PollReport {
  id: string;
  poll_id: string;
  report_title: string;
  executive_summary: string;
  key_insights: Array<{
    insight: string;
    confidence: number;
    category: 'positive' | 'negative' | 'neutral' | 'actionable';
  }>;
  sentiment_analysis: {
    overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    positive_percentage: number;
    negative_percentage: number;
    neutral_percentage: number;
    confidence_score: number;
  };
  recommendations: string[];
  response_themes: string[];
  participation_stats: {
    total_responses: number;
    response_rate: number;
    avg_response_length?: number;
    most_common_words: string[];
  };
  ai_confidence_score: number;
  created_at: string;
  poll: {
    id: string;
    title: string;
    question: string;
    created_at: string;
  };
  current_response_count: number;
}

export const PollReport: React.FC<PollReportProps> = ({ pollId, onClose }) => {
  const { toast } = useToast();
  const [report, setReport] = useState<PollReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReport();
  }, [pollId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/polls/${pollId}/report`);
      
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else if (response.status === 404) {
        // No report exists yet
        setReport(null);
      } else {
        throw new Error('Failed to load report');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: "Error",
        description: "Failed to load poll report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);

      // Use the poll analysis service directly instead of API route
      const { pollAnalysisService } = await import('../../services/pollAnalysisService');
      const generatedReport = await pollAnalysisService.generatePollReport(pollId);

      setReport(generatedReport);
      toast({
        title: "Success",
        description: "AI report generated successfully!",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI report",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'mixed': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'positive': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'negative': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'actionable': return <Target className="w-4 h-4 text-blue-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading AI report...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <CardTitle>AI Report Not Generated Yet</CardTitle>
          <CardDescription>
            Generate an AI-powered analysis of this poll's responses to get insights, sentiment analysis, and recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={generateReport} 
            disabled={generating}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating AI Report...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{report.report_title}</CardTitle>
                <CardDescription className="flex items-center space-x-4 mt-1">
                  <span>Generated {formatDistanceToNow(new Date(report.created_at))} ago</span>
                  <Badge variant="outline" className="text-xs">
                    AI Confidence: {(report.ai_confidence_score * 100).toFixed(0)}%
                  </Badge>
                </CardDescription>
              </div>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close Report
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Executive Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {report.executive_summary}
          </p>
        </CardContent>
      </Card>

      {/* Participation & Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Participation Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Participation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Responses</span>
              <span className="font-semibold">{report.participation_stats.total_responses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Response Rate</span>
              <span className="font-semibold">{report.participation_stats.response_rate.toFixed(1)}%</span>
            </div>
            {report.participation_stats.avg_response_length && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Response Length</span>
                <span className="font-semibold">{Math.round(report.participation_stats.avg_response_length)} chars</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Sentiment Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-3 rounded-lg border ${getSentimentColor(report.sentiment_analysis.overall_sentiment)}`}>
              <div className="text-center">
                <div className="font-semibold capitalize">{report.sentiment_analysis.overall_sentiment} Sentiment</div>
                <div className="text-xs mt-1">
                  Confidence: {(report.sentiment_analysis.confidence_score * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Positive</span>
                <span>{report.sentiment_analysis.positive_percentage.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Negative</span>
                <span>{report.sentiment_analysis.negative_percentage.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Neutral</span>
                <span>{report.sentiment_analysis.neutral_percentage.toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      {report.key_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5" />
              <span>Key Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.key_insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {getInsightIcon(insight.category)}
                  <div className="flex-1">
                    <p className="text-sm">{insight.insight}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {insight.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Confidence: {(insight.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Themes */}
      {report.response_themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Common Themes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {report.response_themes.map((theme, index) => (
                <Badge key={index} variant="secondary">
                  {theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {recommendation}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Common Words */}
      {report.participation_stats.most_common_words.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Most Mentioned Words</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {report.participation_stats.most_common_words.map((word, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {word}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Report generated on {new Date(report.created_at).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateReport}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></div>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Brain className="w-3 h-3 mr-2" />
                    Regenerate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
