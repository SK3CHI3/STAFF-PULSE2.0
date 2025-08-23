import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Heart,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Activity,
  Sparkles,
  Zap,
  Target,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Download,
  AlertTriangle
} from 'lucide-react';

interface AIInsightsHubProps {
  // Wellness insights (check-ins)
  wellnessInsights: any[];
  onGenerateWellnessInsights: () => void;
  wellnessLoading: boolean;
  
  // Poll insights
  pollInsights: any[];
  onGeneratePollInsights: () => void;
  pollLoading: boolean;
  
  // Combined engagement insights
  engagementInsights: any[];
  onGenerateEngagementInsights: () => void;
  engagementLoading: boolean;
  
  // Custom AI questions
  customQuestions: any[];
  onAskCustomQuestion: (question: string) => void;
  customLoading: boolean;
}

export const AIInsightsHub: React.FC<AIInsightsHubProps> = ({
  wellnessInsights,
  onGenerateWellnessInsights,
  wellnessLoading,
  pollInsights,
  onGeneratePollInsights,
  pollLoading,
  engagementInsights,
  onGenerateEngagementInsights,
  engagementLoading,
  customQuestions,
  onAskCustomQuestion,
  customLoading
}) => {
  const [activeTab, setActiveTab] = useState('wellness');
  const [currentInsightPage, setCurrentInsightPage] = useState(0);

  const presetQuestions = [
    {
      id: 'team-morale',
      question: 'How is the overall team morale and what factors are influencing it?',
      category: 'Team Health',
      icon: Heart
    },
    {
      id: 'productivity-trends',
      question: 'What trends do you see in employee productivity and engagement?',
      category: 'Performance',
      icon: TrendingUp
    },
    {
      id: 'retention-risk',
      question: 'Which employees might be at risk of leaving and why?',
      category: 'Retention',
      icon: Target
    },
    {
      id: 'department-comparison',
      question: 'How do different departments compare in terms of satisfaction?',
      category: 'Departments',
      icon: BarChart3
    },
    {
      id: 'improvement-areas',
      question: 'What are the top 3 areas we should focus on improving?',
      category: 'Strategy',
      icon: Lightbulb
    },
    {
      id: 'communication-gaps',
      question: 'Are there any communication gaps or issues in the organization?',
      category: 'Communication',
      icon: MessageSquare
    }
  ];

  const renderWellnessInsights = () => (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Wellness Insights</h3>
          <p className="text-sm text-muted-foreground">AI analysis of employee check-ins and mood data</p>
        </div>
        <Button
          onClick={onGenerateWellnessInsights}
          disabled={wellnessLoading}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          {wellnessLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2" />
              Generate Wellness Insights
            </>
          )}
        </Button>
      </div>

      {/* Wellness Insights Content - Professional Paginated Format */}
      {wellnessLoading ? (
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Generating Wellness Insights...</h3>
            <p className="text-muted-foreground">
              Our AI is analyzing your team's wellness data to provide actionable insights.
            </p>
          </CardContent>
        </Card>
      ) : wellnessInsights.length === 0 ? (
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Wellness Insights Yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate AI insights from your employee check-in data to understand team wellness patterns.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Insights Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {wellnessInsights.filter((i: any) => i.type === 'summary' || i.type === 'personal_insight').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Assessments</div>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {wellnessInsights.filter((i: any) => i.type === 'recommendation').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Recommendations</div>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {wellnessInsights.filter((i: any) => i.type === 'risk_alert').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Risk Alerts</div>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {wellnessInsights.filter((i: any) => i.type === 'trend_analysis').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Trend Analysis</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Paginated View */}
          {(() => {
            const currentInsight = wellnessInsights[currentInsightPage];
            const totalInsights = wellnessInsights.length;

            if (totalInsights === 0) return null;

            return (
              <div className="space-y-6">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          AI Wellness Report
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(currentInsight.created_at || Date.now()).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(currentInsight.created_at || Date.now()).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{Math.round((currentInsight.confidence || 0.85) * 100)}% Confidence</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Report {currentInsightPage + 1} of {totalInsights}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentInsightPage(Math.max(0, currentInsightPage - 1))}
                          disabled={currentInsightPage === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentInsightPage(Math.min(totalInsights - 1, currentInsightPage + 1))}
                          disabled={currentInsightPage === totalInsights - 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                <Card className="bg-white dark:bg-gray-900 border-0 shadow-lg">
                  <CardContent className="p-8">
                    {/* Report Type Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <Badge
                        variant={
                          currentInsight.priority === 'critical' ? 'destructive' :
                          currentInsight.priority === 'high' ? 'default' :
                          currentInsight.priority === 'medium' ? 'secondary' : 'outline'
                        }
                        className="text-sm px-3 py-1"
                      >
                        {currentInsight.priority || 'medium'} Priority
                      </Badge>

                      {currentInsight.scope === 'individual' && (
                        <Badge variant="outline" className="text-sm">
                          <User className="w-3 h-3 mr-1" />
                          Individual Analysis
                        </Badge>
                      )}
                    </div>

                    {/* Report Content */}
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="text-base leading-relaxed space-y-6">
                        {currentInsight.content
                          // Clean formatting like the original
                          .replace(/### \d+\. /g, '')
                          .replace(/### /g, '')
                          .replace(/\*\*(.*?)\*\*/g, '$1')
                          .replace(/---[\s\S]*$/g, '')
                          .split('\n')
                          .filter(line => line.trim() !== '' && !line.includes('---'))
                          .map((line, index) => {
                            const trimmedLine = line.trim();

                            if (!trimmedLine) return null;

                            // Section headers
                            if (trimmedLine.match(/^[A-Z][a-zA-Z\s]+:?$/) && !trimmedLine.includes('-')) {
                              return (
                                <div key={index} className="font-bold text-lg text-gray-800 dark:text-gray-200 mt-8 mb-4 pb-3 border-b-2 border-green-200 dark:border-green-700">
                                  {trimmedLine.replace(':', '')}
                                </div>
                              );
                            }

                            // Bullet points
                            if (trimmedLine.startsWith('-')) {
                              return (
                                <div key={index} className="flex items-start space-x-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <span className="text-green-500 font-bold mt-1 text-lg">•</span>
                                  <span className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {trimmedLine.substring(1).trim()}
                                  </span>
                                </div>
                              );
                            }

                            // Regular paragraphs
                            return (
                              <p key={index} className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-base">
                                {trimmedLine}
                              </p>
                            );
                          })
                          .filter(Boolean)
                        }
                      </div>
                    </div>

                    {/* Report Footer */}
                    <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Recent wellness data analysis</span>
                          </div>
                          {currentInsight.employee_name && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{currentInsight.employee_name} ({currentInsight.department})</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-green-50 hover:border-green-300"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderPollInsights = () => (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Poll Insights</h3>
          <p className="text-sm text-muted-foreground">AI analysis of poll and survey responses</p>
        </div>
        <Button
          onClick={onGeneratePollInsights}
          disabled={pollLoading}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {pollLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Poll Insights
            </>
          )}
        </Button>
      </div>

      {/* Poll Insights Content */}
      <div className="grid grid-cols-1 gap-6">
        {pollInsights.length > 0 ? (
          pollInsights.map((insight, index) => (
            <Card key={index} className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>{insight.title}</span>
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {(insight.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {insight.content}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-500 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Poll Insights Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate AI insights from your poll and survey data to understand employee feedback patterns.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderEngagementInsights = () => (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Engagement Insights</h3>
          <p className="text-sm text-muted-foreground">Combined AI analysis of all employee engagement data</p>
        </div>
        <Button
          onClick={onGenerateEngagementInsights}
          disabled={engagementLoading}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {engagementLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate Engagement Insights
            </>
          )}
        </Button>
      </div>

      {/* Engagement Insights Content */}
      <div className="grid grid-cols-1 gap-6">
        {engagementInsights.length > 0 ? (
          engagementInsights.map((insight, index) => (
            <Card key={index} className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span>{insight.title}</span>
                  </CardTitle>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    {(insight.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {insight.content}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-purple-500 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Engagement Insights Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate comprehensive AI insights combining check-ins, polls, and engagement data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderCustomQuestions = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Custom AI Questions</h3>
        <p className="text-sm text-muted-foreground">Ask specific questions about your team and get AI-powered insights</p>
      </div>

      {/* Preset Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presetQuestions.map((preset) => {
          const Icon = preset.icon;
          return (
            <Card 
              key={preset.id} 
              className="bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
              onClick={() => onAskCustomQuestion(preset.question)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {preset.category}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {preset.question}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Question Input */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-orange-500" />
            <span>Ask Your Own Question</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-orange-500 opacity-50" />
            <p>Custom question input will be implemented here</p>
            <p className="text-sm mt-2">Type your own questions and get AI-powered insights</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Custom Questions */}
      {customQuestions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold">Recent Questions & Answers</h4>
          {customQuestions.map((qa, index) => (
            <Card key={index} className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Q: {qa.question}
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Brain className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      A: {qa.answer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              AI Insights Hub
            </h2>
            <p className="text-sm text-muted-foreground">Comprehensive AI-powered employee engagement analysis</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wellness" className="flex items-center space-x-2">
            <Heart className="w-4 h-4" />
            <span>Wellness</span>
          </TabsTrigger>
          <TabsTrigger value="polls" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Polls</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Engagement</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Custom</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wellness" className="mt-6">
          {renderWellnessInsights()}
        </TabsContent>

        <TabsContent value="polls" className="mt-6">
          {renderPollInsights()}
        </TabsContent>

        <TabsContent value="engagement" className="mt-6">
          {renderEngagementInsights()}
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          {renderCustomQuestions()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
