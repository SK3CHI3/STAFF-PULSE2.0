import { useState, useEffect } from "react";
import { TimelineSelector, TimelineOption } from '@/components/charts/TimelineSelector';
import { MoodTrendChart, DepartmentWellnessChart, EngagementChart } from '@/components/charts/EnhancedChart';
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { useMoodTrendData, useDepartmentWellnessData, useEngagementData, useDashboardStats, useRecentResponses, useMoodDistribution, useEmployeeStats, useEmployeesList, useDepartmentsList, useAIInsights, useCheckInCampaigns, useCheckInTargets } from '@/hooks/useChartData';
import { usePlan } from '@/hooks/usePlan';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { PLANS } from '@/services/planService';

// IntaSend type declaration
declare global {
  interface Window {
    IntaSend: any;
    intaSendInstance: any;
  }
}
import { useAuth } from '@/contexts/AuthContext';
import { supabaseConfig } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModernSidebar, hrDashboardItems } from "@/components/layout/ModernSidebar";

import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Filter,
  Download,
  Send,
  Plus,
  BarChart3,
  Activity,
  Heart,
  Smile,
  Frown,
  Meh,
  Clock,
  Shield,
  Eye,
  Brain,
  CreditCard,
  Zap,
  CheckCircle,
  Star,
  Settings,
  DollarSign,
  Phone,
  Building,
  Bell,
  Trash2,
  Upload,
  FileText,
  Save,
  History,
  UserPlus,
  LineChart,
  Play,
  Pause,
  User,
  Globe
} from "lucide-react";

const HRDashboard = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [timeline, setTimeline] = useState<TimelineOption>('7d');

  // Check-ins state
  const [selectedTargetType, setSelectedTargetType] = useState('all');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [checkInMessage, setCheckInMessage] = useState('Hi {name}! 👋 How are you feeling today? Please share your mood and any feedback with us. Your wellbeing matters! 💙');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Enhanced check-ins state
  const [sendMode, setSendMode] = useState<'now' | 'schedule' | 'automate'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [automationFrequency, setAutomationFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [automationDays, setAutomationDays] = useState<string[]>(['monday']);
  const [automationTime, setAutomationTime] = useState('09:00');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Message templates
  const messageTemplates = [
    {
      id: 'daily_checkin',
      name: 'Daily Check-in',
      template: 'Hi {name}! 👋\n\nHow are you feeling today? Please take a moment to share your mood and any thoughts with us.\n\nReply to this message or use our app to check in.\n\nThanks!\nYour HR Team',
      description: 'Standard daily wellness check-in'
    },
    {
      id: 'weekly_pulse',
      name: 'Weekly Pulse',
      template: 'Hello {name}! 🌟\n\nIt\'s time for your weekly pulse check! How has your week been so far?\n\nWe\'d love to hear about:\n• Your overall mood\n• Any challenges you\'re facing\n• Wins or achievements\n\nYour feedback helps us support you better.\n\nBest regards,\n{department} Team',
      description: 'Weekly comprehensive check-in'
    },
    {
      id: 'project_feedback',
      name: 'Project Feedback',
      template: 'Hi {name}! 💼\n\nWe\'d appreciate your feedback on the current project you\'re working on.\n\nPlease share:\n• How you\'re feeling about the project\n• Any support you might need\n• Your stress levels (1-10)\n\nYour input is valuable to us!\n\nThanks,\nProject Management Team',
      description: 'Project-specific wellness check'
    },
    {
      id: 'custom',
      name: 'Custom Message',
      template: 'Hi {name}!\n\n[Your custom message here]\n\nBest regards,\nYour Team',
      description: 'Customizable template'
    }
  ];
  const [connectionStatus, setConnectionStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  // Chart data hooks
  const moodTrendChartData = useMoodTrendData(timeline);
  const departmentWellnessChartData = useDepartmentWellnessData(timeline);
  const engagementChartData = useEngagementData(timeline);

  // Dashboard data hooks
  const dashboardStats = useDashboardStats();
  const recentResponses = useRecentResponses(10);
  const moodDistributionData = useMoodDistribution(timeline);

  // Employee management hooks
  const employeeStats = useEmployeeStats();
  const employeesList = useEmployeesList();
  const departmentsList = useDepartmentsList();

  // AI insights hook
  const aiInsights = useAIInsights();

  // Plan restrictions hook
  const { currentPlan, canUseFeature, getRestrictionMessage } = usePlan();

  // Payment history hook
  const { payments, loading: paymentsLoading, error: paymentsError } = usePaymentHistory();

  // IntaSend integration - Simple and correct implementation
  useEffect(() => {
    // Load IntaSend script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/intasend-inlinejs-sdk@4.0.7/build/intasend-inline.js';
    script.async = true;

    script.onload = () => {
      console.log('IntaSend script loaded');
      // Initialize IntaSend after script loads
      if (window.IntaSend) {
        console.log('Initializing IntaSend...');
        new window.IntaSend({
          publicAPIKey: "ISPubKey_test_39c6a0b0-629e-4ac0-94d9-9b9c6e2f8c5a",
          live: false
        })
        .on("COMPLETE", async (results) => {
          console.log("Payment completed:", results);
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/activate_plan`, {
              method: 'POST',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                org_id: profile?.organization_id,
                plan_name: results.api_ref?.split('-')[1] || 'business',
                payment_ref: results.tracking_id,
                amount: results.value
              })
            });
            if (response.ok) {
              alert("Payment successful! Your plan has been upgraded. Please refresh the page.");
              window.location.reload();
            }
          } catch (error) {
            console.error('Plan activation error:', error);
            alert("Payment received but plan activation failed. Please contact support.");
          }
        })
        .on("FAILED", (results) => {
          console.log("Payment failed:", results);
          alert("Payment failed. Please try again or contact support.");
        })
        .on("IN-PROGRESS", (results) => {
          console.log("Payment in progress:", results);
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [profile?.organization_id]);

  // Check-in hooks
  const checkInCampaigns = useCheckInCampaigns();
  const checkInTargets = useCheckInTargets();

  const [selectedMoodFilter, setSelectedMoodFilter] = useState("all");
  const responsesPerPage = 5;

  // Helper function to get appropriate interval for X-axis labels
  const getXAxisInterval = (timeline: string, dataLength: number) => {
    if (dataLength <= 7) return 0; // Show all labels for 7 or fewer points

    switch (timeline) {
      case '7d':
        return 0; // Show all days
      case '1m':
        return Math.ceil(dataLength / 8); // Show ~8 labels
      case '3m':
        return Math.ceil(dataLength / 6); // Show ~6 labels
      case '6m':
        return Math.ceil(dataLength / 6); // Show ~6 labels
      case '1y':
        return Math.ceil(dataLength / 8); // Show ~8 labels
      default:
        return Math.ceil(dataLength / 8);
    }
  };

  // Helper function to calculate trend (appreciation/depreciation)
  const calculateTrend = (data: any[], key: string) => {
    if (!data || data.length < 2) return { trend: 'neutral', percentage: 0 };

    const validData = data.filter(item => item[key] !== undefined && item[key] !== null && item[key] > 0);
    if (validData.length < 2) return { trend: 'neutral', percentage: 0 };

    const firstValue = validData[0][key];
    const lastValue = validData[validData.length - 1][key];

    if (firstValue === 0) return { trend: 'neutral', percentage: 0 };

    const percentage = ((lastValue - firstValue) / firstValue) * 100;
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';

    return { trend, percentage: Math.abs(percentage) };
  };

  // Use real mood distribution data
  const moodDistribution = moodDistributionData.data || [];



  // Get real employee responses from database and map to expected format
  const allEmployeeResponses = (recentResponses.data || []).map((response: any) => ({
    id: response.id,
    employeeName: response.employee_name,
    department: response.department,
    mood: response.mood_score,
    comment: response.feedback || 'No feedback provided',
    timestamp: new Date(response.created_at).toLocaleString(),
    timeAgo: response.time_ago,
    phoneNumber: 'N/A', // Phone number not available from check-ins
    source: 'Database'
  }));



  // Department and mood filtering logic
  let filteredResponses = allEmployeeResponses;

  // Apply department filter
  if (selectedDepartment !== "all") {
    filteredResponses = filteredResponses.filter(response => response.department === selectedDepartment);
  }

  // Apply mood filter
  if (selectedMoodFilter !== "all") {
    switch (selectedMoodFilter) {
      case "positive":
        filteredResponses = filteredResponses.filter(response => response.mood >= 7);
        break;
      case "neutral":
        filteredResponses = filteredResponses.filter(response => response.mood >= 5 && response.mood < 7);
        break;
      case "attention":
        filteredResponses = filteredResponses.filter(response => response.mood < 5);
        break;
    }
  }

  const totalResponses = filteredResponses.length;
  const totalPages = Math.ceil(totalResponses / responsesPerPage);
  const startIndex = (currentPage - 1) * responsesPerPage;
  const endIndex = startIndex + responsesPerPage;
  const currentResponses = filteredResponses.slice(startIndex, endIndex);

  // Get unique departments for filter - use both response data and departments list
  const departments = ["all", ...new Set([
    ...allEmployeeResponses.map(r => r.department),
    ...departmentsList.data.map(d => d.name)
  ])];

  const getMoodIcon = (mood: number) => {
    if (mood >= 8) return <Smile className="w-4 h-4 text-success" />;
    if (mood >= 6) return <Meh className="w-4 h-4 text-warning" />;
    return <Frown className="w-4 h-4 text-destructive" />;
  };



  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverviewContent();
      case "analytics":
        return renderAnalyticsContent();
      case "reports":
        return renderReportsContent();
      case "checkins":
        return renderCheckinsContent();
      case "ai-insights":
        return renderAIInsightsContent();
      case "billing":
        return renderBillingContent();
      case "feedback":
        return renderFeedbackContent();
      case "employee-management":
        return renderEmployeeManagementContent();
      case "settings":
        return renderSettingsContent();
      default:
        return renderOverviewContent();
    }
  };

  const renderOverviewContent = () => (
    <div className="space-y-8">
      {/* Compact Professional Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Title Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                HR Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Team wellness and engagement insights</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="group">
              <Filter className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="group">
              <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Export
            </Button>
            <Button variant="hero" size="sm" className="group">
              <Send className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              Send Check-in
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">
                  {dashboardStats.loading ? '...' : dashboardStats.data?.total_employees || 0}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {(() => {
                    const trend = calculateTrend(engagementChartData.data || [], 'activeEmployees');
                    return (
                      <>
                        {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {trend.trend === 'neutral' ? 'Stable' : `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Average Mood</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardStats.loading ? '...' : `${dashboardStats.data?.average_mood || 0}/10`}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {(() => {
                    const trend = calculateTrend(moodTrendChartData.data || [], 'averageMood');
                    return (
                      <>
                        {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {trend.trend === 'neutral' ? 'Stable' : `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'improvement' : 'decline'}`}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardStats.loading ? '...' : `${dashboardStats.data?.response_rate || 0}%`}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {(() => {
                    const trend = calculateTrend(engagementChartData.data || [], 'responseRate');
                    return (
                      <>
                        {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {trend.trend === 'neutral' ? 'Stable' : `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Recent Check-ins</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardStats.loading ? '...' : dashboardStats.data?.recent_checkins || 0}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {(() => {
                    const trend = calculateTrend(engagementChartData.data || [], 'checkIns');
                    return (
                      <>
                        {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {trend.trend === 'neutral' ? 'Stable' : `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Team Analytics</h3>
          <p className="text-sm text-muted-foreground">Wellness and engagement trends</p>
        </div>
        <TimelineSelector
          value={timeline}
          onChange={setTimeline}
          className="ml-auto"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Trend Chart */}
        <MoodTrendChart
          data={moodTrendChartData.data}
          loading={moodTrendChartData.loading}
          error={moodTrendChartData.error}
          title="Team Mood Trend"
          description={`Wellness patterns over the ${
            timeline === '7d' ? 'last 7 days' :
            timeline === '1m' ? 'last month' :
            timeline === '3m' ? 'last 3 months' :
            timeline === '6m' ? 'last 6 months' : 'last year'
          }`}
          timeline={timeline}
        />

        {/* Department Mood */}
        <DepartmentWellnessChart
          data={departmentWellnessChartData.data}
          loading={departmentWellnessChartData.loading}
          error={departmentWellnessChartData.error}
          title="Department Wellness"
          description={`Average mood scores by department over the ${
            timeline === '7d' ? 'last 7 days' :
            timeline === '1m' ? 'last month' :
            timeline === '3m' ? 'last 3 months' :
            timeline === '6m' ? 'last 6 months' : 'last year'
          }`}
        />
      </div>
    </div>
  );

  const renderAnalyticsContent = () => (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                Team Analytics
              </h2>
              <p className="text-sm text-muted-foreground">Comprehensive wellness insights for your team</p>
            </div>
          </div>
          <TimelineSelector
            value={timeline}
            onChange={setTimeline}
            className="ml-auto"
          />
        </div>
      </div>

      {/* Four Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Team Mood Trends */}
        <MoodTrendChart
          data={moodTrendChartData.data}
          loading={moodTrendChartData.loading}
          error={moodTrendChartData.error}
          title="Team Mood Trends"
          description={`Wellness patterns over the ${timeline === '7d' ? 'last 7 days' : timeline === '1m' ? 'last month' : timeline === '3m' ? 'last 3 months' : timeline === '6m' ? 'last 6 months' : 'last year'}`}
          timeline={timeline}
        />

        {/* 2. Department Wellness Comparison */}
        <DepartmentWellnessChart
          data={departmentWellnessChartData.data}
          loading={departmentWellnessChartData.loading}
          error={departmentWellnessChartData.error}
          title="Department Wellness"
          description={`Average wellness scores by department over the ${timeline === '7d' ? 'last 7 days' : timeline === '1m' ? 'last month' : timeline === '3m' ? 'last 3 months' : timeline === '6m' ? 'last 6 months' : 'last year'}`}
        />

        {/* 3. Response Rate & Engagement */}
        <EngagementChart
          data={engagementChartData.data}
          loading={engagementChartData.loading}
          error={engagementChartData.error}
          title="Engagement Metrics"
          description={`Response rates and participation over the ${timeline === '7d' ? 'last 7 days' : timeline === '1m' ? 'last month' : timeline === '3m' ? 'last 3 months' : timeline === '6m' ? 'last 6 months' : 'last year'}`}
          timeline={timeline}
        />

        {/* 4. Wellness Distribution */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <span>Wellness Distribution</span>
            </CardTitle>
            <CardDescription>How your team is feeling today</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moodDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {moodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Average Mood</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.loading ? '...' : `${dashboardStats.data?.average_mood || 0}/10`}
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const trend = calculateTrend(moodTrendChartData.data || [], 'mood');
                return (
                  <>
                    {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {trend.trend === 'neutral' ? 'Stable' : `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'improvement' : 'decline'}`}
                    </p>
                  </>
                );
              })()}
            </div>
            <Progress value={(dashboardStats.data?.average_mood || 0) * 10} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.loading ? '...' : `${dashboardStats.data?.response_rate || 0}%`}
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const trend = calculateTrend(engagementChartData.data || [], 'responseRate');
                return (
                  <>
                    {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {trend.trend === 'neutral' ? 'Stable' : `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
                    </p>
                  </>
                );
              })()}
            </div>
            <Progress value={dashboardStats.data?.response_rate || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Team Wellness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {(() => {
                const avgMood = dashboardStats.data?.average_mood || 0;
                const isGood = avgMood >= 7;
                return (
                  <>
                    {isGood ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                    <span className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                      {isGood ? 'Excellent' : avgMood >= 5 ? 'Good' : 'Needs Attention'}
                    </span>
                  </>
                );
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Overall team wellness status</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderReportsContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Team Reports
            </h2>
            <p className="text-sm text-muted-foreground">Employee feedback and wellness reports</p>
          </div>
        </div>
      </div>

      {/* Clickable Response Stats Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className={`bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMoodFilter === "all" ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
          onClick={() => {
            console.log("Clicked Total Responses - setting filter to 'all'");
            setSelectedMoodFilter("all");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-xl font-bold">{allEmployeeResponses.length}</p>
              </div>
            </div>
            {selectedMoodFilter === "all" && (
              <div className="mt-2">
                <Badge variant="default" className="text-xs">Active Filter</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMoodFilter === "positive" ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20" : ""
          }`}
          onClick={() => {
            console.log("Clicked Positive - setting filter to 'positive'");
            setSelectedMoodFilter("positive");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Smile className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positive (7-10)</p>
                <p className="text-xl font-bold">{allEmployeeResponses.filter(r => r.mood >= 7).length}</p>
              </div>
            </div>
            {selectedMoodFilter === "positive" && (
              <div className="mt-2">
                <Badge variant="default" className="text-xs bg-green-100 text-green-700">Active Filter</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMoodFilter === "neutral" ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20" : ""
          }`}
          onClick={() => {
            console.log("Clicked Neutral - setting filter to 'neutral'");
            setSelectedMoodFilter("neutral");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Meh className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Neutral (5-6)</p>
                <p className="text-xl font-bold">{allEmployeeResponses.filter(r => r.mood >= 5 && r.mood < 7).length}</p>
              </div>
            </div>
            {selectedMoodFilter === "neutral" && (
              <div className="mt-2">
                <Badge variant="default" className="text-xs bg-orange-100 text-orange-700">Active Filter</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMoodFilter === "attention" ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20" : ""
          }`}
          onClick={() => {
            console.log("Clicked Need Attention - setting filter to 'attention'");
            setSelectedMoodFilter("attention");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Frown className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Need Attention (1-4)</p>
                <p className="text-xl font-bold">{allEmployeeResponses.filter(r => r.mood < 5).length}</p>
              </div>
            </div>
            {selectedMoodFilter === "attention" && (
              <div className="mt-2">
                <Badge variant="destructive" className="text-xs">Active Filter</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Responses</CardTitle>
              <CardDescription>
                Showing {startIndex + 1}-{Math.min(endIndex, totalResponses)} of {totalResponses} responses
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedDepartment} onValueChange={(value) => {
                setSelectedDepartment(value);
                setCurrentPage(1); // Reset to first page when filtering
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentResponses.map((response) => (
              <Card key={response.id} className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-6 space-y-4">
                  {/* Employee Info Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {response.employeeName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{response.employeeName}</h4>
                        <p className="text-sm text-muted-foreground">{response.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">{response.timeAgo}</span>
                    </div>
                  </div>

                  {/* Mood Score & Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getMoodIcon(response.mood)}
                      <span className="font-bold text-2xl">{response.mood}/10</span>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                        {response.source}
                      </Badge>
                      {response.mood <= 4 && (
                        <Badge variant="destructive">
                          Needs Attention
                        </Badge>
                      )}
                      {response.mood >= 8 && (
                        <Badge variant="default" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                          Great Mood
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm leading-relaxed text-foreground italic">
                      "{response.comment}"
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>📱 {response.phoneNumber}</span>
                    <span>•</span>
                    <span>via {response.source}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    {response.mood <= 4 && (
                      <Button variant="default" size="sm">
                        <Heart className="w-4 h-4 mr-2" />
                        Follow Up
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFeedbackContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Send Feedback
            </h2>
            <p className="text-sm text-muted-foreground">Send feedback and support requests to StaffPulse team</p>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Contact StaffPulse Support</CardTitle>
          <CardDescription>Send feedback, feature requests, or report issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="support">Support Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="Brief description of your feedback" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              className="w-full min-h-[120px] px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Describe your feedback, feature request, or issue in detail..."
            />
          </div>

          <div className="flex space-x-3">
            <Button variant="hero" className="group">
              <Send className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              Send Feedback
            </Button>
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Feedback */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Your Previous Feedback</CardTitle>
          <CardDescription>Track the status of your submitted feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg bg-background/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Feature Request: Advanced Analytics</h4>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Submitted 3 days ago • Response expected within 5 business days
              </p>
              <p className="text-sm">
                Request for more detailed analytics on team mood patterns...
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg bg-background/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Bug Report: WhatsApp Integration</h4>
                <Badge variant="default">Resolved</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Submitted 1 week ago • Resolved 2 days ago
              </p>
              <p className="text-sm">
                Issue with WhatsApp check-ins not being delivered...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCheckinsContent = () => {

    const handleTestConnection = async () => {
      setIsTestingConnection(true);
      setConnectionStatus(null);

      try {
        const { twilioService } = await import('../services/twilioService');
        const result = await twilioService.testConnection();
        setConnectionStatus(result);
      } catch (error) {
        setConnectionStatus({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      } finally {
        setIsTestingConnection(false);
      }
    };

    const handleSendCheckIn = async () => {
      if (!checkInMessage.trim()) {
        alert('Please enter a check-in message');
        return;
      }

      if (sendMode === 'schedule' && (!scheduleDate || !scheduleTime)) {
        alert('Please select both date and time for scheduling');
        return;
      }

      const targetEmployees = getTargetEmployees();
      if (targetEmployees.length === 0) {
        alert('No employees selected for check-in');
        return;
      }

      // Validate phone numbers before sending
      if (sendMode === 'now') {
        const { twilioService } = await import('../services/twilioService');
        const phoneValidation = twilioService.validatePhoneNumbers(
          targetEmployees.map(emp => emp.phone).filter(Boolean)
        );

        const invalidPhones = phoneValidation.filter(p => !p.isValid);
        if (invalidPhones.length > 0) {
          const invalidList = invalidPhones.map(p => `${p.phone}: ${p.error}`).join('\n');
          if (!confirm(`${invalidPhones.length} phone numbers are invalid:\n\n${invalidList}\n\nContinue with valid numbers only?`)) {
            return;
          }
        }
      }

      setIsSending(true);
      setSendResult(null);

      try {
        // Auto-generate campaign name based on organization and timestamp
        const now = new Date();
        const modeText = sendMode === 'now' ? 'Instant' : sendMode === 'schedule' ? 'Scheduled' : 'Automated';
        const targetText = selectedTargetType === 'all' ? 'All Staff' :
                          selectedTargetType === 'department' ? 'Department' : 'Individual';
        const autoGeneratedName = `${modeText} ${targetText} Check-in - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        // Calculate next_run_at for automated campaigns
        let nextRunAt = null;
        if (sendMode === 'automate') {
          const now = new Date();
          const [hours, minutes] = automationTime.split(':').map(Number);

          if (automationFrequency === 'daily') {
            nextRunAt = new Date(now);
            nextRunAt.setHours(hours, minutes, 0, 0);
            if (nextRunAt <= now) {
              nextRunAt.setDate(nextRunAt.getDate() + 1);
            }
          } else if (automationFrequency === 'weekly') {
            // Find the next occurrence of the selected days
            const today = now.getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            let nextDay = null;

            for (let i = 1; i <= 7; i++) {
              const checkDay = (today + i) % 7;
              const dayName = dayNames[checkDay];
              if (automationDays.includes(dayName)) {
                nextDay = checkDay;
                break;
              }
            }

            if (nextDay !== null) {
              nextRunAt = new Date(now);
              const daysToAdd = nextDay === today ? 7 : (nextDay - today + 7) % 7;
              nextRunAt.setDate(nextRunAt.getDate() + daysToAdd);
              nextRunAt.setHours(hours, minutes, 0, 0);
            }
          } else if (automationFrequency === 'monthly') {
            nextRunAt = new Date(now);
            nextRunAt.setMonth(nextRunAt.getMonth() + 1);
            nextRunAt.setDate(1); // First day of next month
            nextRunAt.setHours(hours, minutes, 0, 0);
          }
        }

        const campaignData = {
          organization_id: profile?.organization_id,
          name: autoGeneratedName,
          message: checkInMessage,
          target_type: selectedTargetType,
          target_departments: selectedTargetType === 'department' ? selectedDepartments : null,
          target_employees: selectedTargetType === 'individual' ? selectedEmployees : null,
          total_recipients: getTargetEmployees().length,
          created_by: user?.id,
          status: sendMode === 'now' ? 'draft' : sendMode === 'schedule' ? 'scheduled' : 'automated',
          send_mode: sendMode,
          scheduled_at: sendMode === 'schedule' ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : null,
          automation_frequency: sendMode === 'automate' ? automationFrequency : null,
          automation_days: sendMode === 'automate' ? automationDays : null,
          automation_time: sendMode === 'automate' ? automationTime : null,
          next_run_at: nextRunAt ? nextRunAt.toISOString() : null,
          is_active: sendMode === 'automate' ? true : null
        };

        // Create campaign in database
        const campaignResponse = await fetch(`${supabaseConfig.url}/rest/v1/checkin_campaigns`, {
          method: 'POST',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(campaignData)
        });

        if (!campaignResponse.ok) {
          throw new Error('Failed to create campaign');
        }

        const campaign = await campaignResponse.json();
        const campaignId = campaign[0].id;

        if (sendMode === 'now') {
          // Send immediately via Twilio
          const { twilioService } = await import('../services/twilioService');
          const result = await twilioService.sendCheckInCampaign({
            campaignId,
            employees: getTargetEmployees(),
            message: checkInMessage,
            organizationId: profile?.organization_id || ''
          });
          setSendResult(result);
        } else {
          // For scheduled/automated campaigns, just show success message
          let successMessage = '';
          if (sendMode === 'schedule') {
            const scheduledTime = new Date(`${scheduleDate}T${scheduleTime}`);
            successMessage = `Campaign scheduled for ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()}`;
          } else if (sendMode === 'automate') {
            const frequencyText = automationFrequency === 'daily' ? 'daily' :
                                 automationFrequency === 'weekly' ? `weekly on ${automationDays.join(', ')}` :
                                 'monthly';
            successMessage = `Automated campaign set up to run ${frequencyText} at ${automationTime}`;
            if (nextRunAt) {
              successMessage += `. Next run: ${nextRunAt.toLocaleDateString()} at ${nextRunAt.toLocaleTimeString()}`;
            }
          }

          setSendResult({
            success: true,
            totalSent: 0,
            failed: 0,
            errors: [],
            scheduled: true,
            message: successMessage
          });
        }

        checkInCampaigns.refreshCampaigns();

        // Reset form
        setCheckInMessage('Hi {name}! 👋 How are you feeling today? Please share your mood and any feedback with us. Your wellbeing matters! 💙');
        setSelectedTargetType('all');
        setSelectedDepartments([]);
        setSelectedEmployees([]);
        setScheduleDate('');
        setScheduleTime('');
        setAutomationDays(['monday']);
        setAutomationTime('09:00');
      } catch (error) {
        setSendResult({
          success: false,
          totalSent: 0,
          failed: 1,
          errors: [error instanceof Error ? error.message : 'Unknown error occurred']
        });
      } finally {
        setIsSending(false);
      }
    };

    const toggleAutomatedCampaign = async (campaignId: string, isActive: boolean) => {
      try {
        await fetch(`${supabaseConfig.url}/rest/v1/checkin_campaigns?id=eq.${campaignId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
        });

        // Refresh campaigns list
        checkInCampaigns.refreshCampaigns();
      } catch (error) {
        console.error('Failed to toggle automated campaign:', error);
      }
    };

    const getTargetEmployees = () => {
      if (!checkInTargets.data.employees) return [];

      switch (selectedTargetType) {
        case 'all':
          return checkInTargets.data.employees.filter((emp: any) => emp.has_phone);
        case 'department':
          return checkInTargets.data.employees.filter((emp: any) =>
            emp.has_phone && selectedDepartments.some(deptId =>
              checkInTargets.data.departments.find((d: any) => d.id === deptId)?.name === emp.department
            )
          );
        case 'individual':
          return checkInTargets.data.employees.filter((emp: any) =>
            emp.has_phone && selectedEmployees.includes(emp.id)
          );
        default:
          return [];
      }
    };

    return (
      <div className="space-y-6">
        {/* Check-ins Header */}
        <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Send Check-ins
                </h2>
                <p className="text-sm text-muted-foreground">Send wellness check-ins via WhatsApp to your team</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {checkInTargets.data.stats?.employees_with_phone || 0} employees with WhatsApp
              </p>
              <p className="text-xs text-muted-foreground">
                {checkInTargets.data.stats?.employees_without_phone || 0} without phone numbers
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {connectionStatus && (
          <Card className={`border-2 ${connectionStatus.success ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {connectionStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {connectionStatus.success ? 'Twilio Connection Successful!' : 'Connection Failed'}
                </span>
              </div>
              {connectionStatus.error && (
                <p className="text-sm text-red-600 mt-2">{connectionStatus.error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Send Result */}
        {sendResult && (
          <Card className={`border-2 ${sendResult.success ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {sendResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="font-semibold">
                    {sendResult.scheduled ? 'Campaign Scheduled!' :
                     sendResult.success ? 'Check-ins Sent Successfully!' : 'Send Failed'}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSendResult(null)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-3">
                {sendResult.scheduled ? (
                  <p className="text-green-600">{sendResult.message}</p>
                ) : (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">{sendResult.totalSent}</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Successfully Sent</div>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-red-600">{sendResult.failed}</div>
                        <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                      </div>
                    </div>

                    {/* Detailed Results */}
                    {sendResult.details && sendResult.details.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Detailed Results:</h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {sendResult.details.map((detail: any, index: number) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-2 rounded text-xs ${
                                detail.status === 'sent'
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className={detail.status === 'sent' ? '✅' : '❌'} />
                                <span className="font-medium">{detail.employeeName}</span>
                                <span className="text-muted-foreground">({detail.phone})</span>
                              </div>
                              {detail.status === 'sent' && detail.messageSid && (
                                <span className="text-xs opacity-70">ID: {detail.messageSid.slice(-8)}</span>
                              )}
                              {detail.status === 'failed' && detail.error && (
                                <span className="text-xs opacity-70 max-w-32 truncate" title={detail.error}>
                                  {detail.error}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Summary */}
                    {sendResult.errors && sendResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-red-600">Error Summary:</h4>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <ul className="text-xs space-y-1">
                            {sendResult.errors.slice(0, 10).map((error: string, index: number) => (
                              <li key={index} className="text-red-700 dark:text-red-300">• {error}</li>
                            ))}
                            {sendResult.errors.length > 10 && (
                              <li className="text-red-600 font-medium">... and {sendResult.errors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Check-in Form */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-500" />
                <span>Send Check-in Campaign</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="text-xs"
              >
                {isTestingConnection ? (
                  <>
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Phone className="w-3 h-3 mr-1" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardTitle>
            <CardDescription>Send wellness check-ins via WhatsApp to your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Send Mode Selection */}
            <div className="space-y-3">
              <Label>Send Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={sendMode === 'now' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendMode('now')}
                  className="flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Send Now</span>
                </Button>
                <Button
                  variant={sendMode === 'schedule' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendMode('schedule')}
                  className="flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Schedule</span>
                </Button>
                <Button
                  variant={sendMode === 'automate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendMode('automate')}
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Automate</span>
                </Button>
              </div>
            </div>

            {/* Send Now Content */}
            {sendMode === 'now' && (
              <>
                {/* Target Selection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <Label className="text-base font-semibold">Target Audience</Label>
                  </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* All Employees Option */}
                <div
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedTargetType === 'all'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                  }`}
                  onClick={() => setSelectedTargetType('all')}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="target-all"
                      name="target"
                      value="all"
                      checked={selectedTargetType === 'all'}
                      onChange={(e) => setSelectedTargetType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="target-all" className="font-medium cursor-pointer">
                          All Employees
                        </Label>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {checkInTargets.data.stats?.employees_with_phone || 0} available
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Send to all employees with WhatsApp numbers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Specific Departments Option */}
                <div
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedTargetType === 'department'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                  }`}
                  onClick={() => setSelectedTargetType('department')}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="target-department"
                      name="target"
                      value="department"
                      checked={selectedTargetType === 'department'}
                      onChange={(e) => setSelectedTargetType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="target-department" className="font-medium cursor-pointer">
                          Specific Departments
                        </Label>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {checkInTargets.data.departments?.length || 0} departments
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Target specific departments or teams
                      </p>
                    </div>
                  </div>
                </div>

                {/* Department Selection Dropdown */}
                {selectedTargetType === 'department' && (
                  <div className="mt-3 p-4 bg-background/50 border border-border rounded-lg">
                    <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span>Select Departments:</span>
                    </Label>
                    <div className="grid gap-2 max-h-40 overflow-y-auto">
                      {checkInTargets.data.departments?.map((dept: any) => (
                        <div key={dept.id} className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg border border-transparent hover:border-blue-200 transition-all">
                          <input
                            type="checkbox"
                            id={`dept-${dept.id}`}
                            checked={selectedDepartments.includes(dept.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDepartments([...selectedDepartments, dept.id]);
                              } else {
                                setSelectedDepartments(selectedDepartments.filter(id => id !== dept.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <Label htmlFor={`dept-${dept.id}`} className="flex-1 text-sm cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{dept.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {dept.employee_count || 0} employees
                              </Badge>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedDepartments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-blue-600 font-medium">
                          ✓ {selectedDepartments.length} department(s) selected
                        </p>
                      </div>
                    )}
                  </div>
                )}


              </div>


            </div>

            {/* Message Templates */}
            <div className="space-y-2">
              <Label>Message Templates</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {messageTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setCheckInMessage(template.template)}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your check-in message..."
                value={checkInMessage}
                onChange={(e) => setCheckInMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Use {'{name}'} to personalize with employee names, {'{department}'} for department
                </p>
                <p className="text-xs text-muted-foreground">
                  {checkInMessage.length}/1600 characters
                </p>
              </div>
            </div>
              </>
            )}

            {/* Schedule Mode Content */}
            {sendMode === 'schedule' && (
              <>
                {/* Schedule Settings */}
                <div className="space-y-4 p-4 border border-border rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <Label className="text-base font-semibold">Schedule Settings</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-date">Date</Label>
                      <Input
                        id="schedule-date"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedule-time">Time</Label>
                      <Input
                        id="schedule-time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Target Selection for Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <Label className="text-base font-semibold">Target Audience</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* All Employees Option */}
                    <div
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTargetType === 'all'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                      }`}
                      onClick={() => setSelectedTargetType('all')}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="schedule-target-all"
                          name="schedule-target"
                          value="all"
                          checked={selectedTargetType === 'all'}
                          onChange={(e) => setSelectedTargetType(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="schedule-target-all" className="font-medium cursor-pointer">
                              All Employees
                            </Label>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {checkInTargets.data.stats?.employees_with_phone || 0} available
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Schedule for all employees with WhatsApp numbers
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Specific Departments Option */}
                    <div
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTargetType === 'department'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                      }`}
                      onClick={() => setSelectedTargetType('department')}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="schedule-target-department"
                          name="schedule-target"
                          value="department"
                          checked={selectedTargetType === 'department'}
                          onChange={(e) => setSelectedTargetType(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="schedule-target-department" className="font-medium cursor-pointer">
                              Specific Departments
                            </Label>
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              {checkInTargets.data.departments?.length || 0} departments
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Schedule for specific departments or teams
                          </p>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>

                {/* Message for Schedule */}
                <div className="space-y-2">
                  <Label htmlFor="schedule-message">Message</Label>
                  <Textarea
                    id="schedule-message"
                    placeholder="Enter your check-in message..."
                    value={checkInMessage}
                    onChange={(e) => setCheckInMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{name}'} to personalize with employee names
                  </p>
                </div>


              </>
            )}

            {/* Automate Mode Content */}
            {sendMode === 'automate' && (
              <>
                {/* Automation Settings */}
                <div className="space-y-4 p-4 border border-border rounded-lg bg-purple-50/50 dark:bg-purple-900/20">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-purple-500" />
                    <Label className="text-base font-semibold">Automation Settings</Label>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={automationFrequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setAutomationFrequency(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {automationFrequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Days of Week</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                            <Button
                              key={day}
                              variant={automationDays.includes(day) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                if (automationDays.includes(day)) {
                                  setAutomationDays(automationDays.filter(d => d !== day));
                                } else {
                                  setAutomationDays([...automationDays, day]);
                                }
                              }}
                              className="text-xs"
                            >
                              {day.slice(0, 3)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="automation-time">Time</Label>
                      <Input
                        id="automation-time"
                        type="time"
                        value={automationTime}
                        onChange={(e) => setAutomationTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Target Selection for Automate */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <Label className="text-base font-semibold">Target Audience</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* All Employees Option */}
                    <div
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTargetType === 'all'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-border hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                      }`}
                      onClick={() => setSelectedTargetType('all')}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="automate-target-all"
                          name="automate-target"
                          value="all"
                          checked={selectedTargetType === 'all'}
                          onChange={(e) => setSelectedTargetType(e.target.value)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="automate-target-all" className="font-medium cursor-pointer">
                              All Employees
                            </Label>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {checkInTargets.data.stats?.employees_with_phone || 0} available
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Automate for all employees with WhatsApp numbers
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Specific Departments Option */}
                    <div
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTargetType === 'department'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-border hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                      }`}
                      onClick={() => setSelectedTargetType('department')}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="automate-target-department"
                          name="automate-target"
                          value="department"
                          checked={selectedTargetType === 'department'}
                          onChange={(e) => setSelectedTargetType(e.target.value)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="automate-target-department" className="font-medium cursor-pointer">
                              Specific Departments
                            </Label>
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              {checkInTargets.data.departments?.length || 0} departments
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Automate for specific departments or teams
                          </p>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>

                {/* Message for Automate */}
                <div className="space-y-2">
                  <Label htmlFor="automate-message">Message</Label>
                  <Textarea
                    id="automate-message"
                    placeholder="Enter your check-in message..."
                    value={checkInMessage}
                    onChange={(e) => setCheckInMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{name}'} to personalize with employee names
                  </p>
                </div>


              </>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendCheckIn}
              disabled={isSending || getTargetEmployees().length === 0 ||
                       (sendMode === 'schedule' && (!scheduleDate || !scheduleTime)) ||
                       (sendMode === 'automate' && automationDays.length === 0)}
              className={`w-full group ${
                sendMode === 'now' ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600' :
                sendMode === 'schedule' ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' :
                'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {sendMode === 'now' ? 'Sending...' : 'Setting up...'}
                </>
              ) : (
                <>
                  {sendMode === 'now' && <Zap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
                  {sendMode === 'schedule' && <Clock className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />}
                  {sendMode === 'automate' && <Settings className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />}
                  {sendMode === 'now' && `Send Now to ${getTargetEmployees().length} employees`}
                  {sendMode === 'schedule' && `Schedule for ${getTargetEmployees().length} employees`}
                  {sendMode === 'automate' && `Automate for ${getTargetEmployees().length} employees`}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Recent Check-in Campaigns</CardTitle>
            <CardDescription>View your recent check-in campaigns and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            {checkInCampaigns.loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : checkInCampaigns.campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No campaigns sent yet</p>
                <p className="text-sm text-muted-foreground">Send your first check-in campaign above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checkInCampaigns.campaigns.map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        campaign.status === 'sent' ? 'bg-green-100 dark:bg-green-900/20' :
                        campaign.status === 'sending' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        campaign.status === 'failed' ? 'bg-red-100 dark:bg-red-900/20' :
                        'bg-gray-100 dark:bg-gray-900/20'
                      }`}>
                        {campaign.status === 'sent' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {campaign.status === 'sending' && <Clock className="w-5 h-5 text-blue-600" />}
                        {campaign.status === 'failed' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                        {campaign.status === 'draft' && <Send className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-semibold">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.target_type === 'all' ? 'All Employees' :
                           campaign.target_type === 'department' ? 'Selected Departments' :
                           'Individual Employees'} • {campaign.time_ago}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {campaign.sent_count} sent • {campaign.response_count} responded
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.response_rate}% response rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };



  const renderAIInsightsContent = () => {
    // Check if AI insights are available in current plan
    if (!canUseFeature('aiInsights')) {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  AI Insights
                </h2>
                <p className="text-sm text-muted-foreground">Advanced AI-powered team wellness analysis</p>
              </div>
            </div>
          </div>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Insights Not Available</h3>
              <p className="text-muted-foreground mb-4">
                {getRestrictionMessage('aiInsights')}
              </p>
              <Button
                onClick={() => setActiveSection('billing')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                AI Insights
              </h2>
              <p className="text-sm text-muted-foreground">Powered by OpenRouter DeepSeek V3 - Advanced team wellness analysis</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => aiInsights.generateNewInsights(aiInsights.selectedEmployee || undefined)}
              disabled={aiInsights.generating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {aiInsights.generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate {aiInsights.selectedEmployee ? 'Personal' : 'Team'} Insights
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => aiInsights.refreshInsights()}
              disabled={aiInsights.loading}
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {aiInsights.insights.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  import('../utils/exportUtils').then(({ exportAllInsights }) => {
                    exportAllInsights(aiInsights.insights, 'csv')
                  })
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Insights Filters and Controls */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Scope Filter */}
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium">View:</Label>
              <div className="flex space-x-2">
                <Button
                  variant={aiInsights.scope === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => aiInsights.setScope('all')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  All Insights
                </Button>
                <Button
                  variant={aiInsights.scope === 'organization' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => aiInsights.setScope('organization')}
                >
                  <Building className="w-4 h-4 mr-2" />
                  Organization
                </Button>
                <Button
                  variant={aiInsights.scope === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => aiInsights.setScope('individual')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Individual
                </Button>
              </div>
            </div>

            {/* Employee Selector */}
            {(aiInsights.scope === 'individual' || aiInsights.scope === 'all') && (
              <div className="flex items-center space-x-4">
                <Label className="text-sm font-medium">Employee:</Label>
                {canUseFeature('individualInsights') ? (
                  <select
                    value={aiInsights.selectedEmployee || ''}
                    onChange={(e) => aiInsights.setSelectedEmployee(e.target.value || null)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm min-w-[200px]"
                  >
                    <option value="">All Employees</option>
                    {aiInsights.employees.map((emp: any) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.employee_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground text-sm min-w-[200px] flex items-center">
                    <span>Individual insights require Enterprise plan</span>
                  </div>
                )}
              </div>
            )}

            {/* Insights Stats */}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{aiInsights.insights.length} insights</span>
              {aiInsights.selectedEmployee && (
                <span>• Personal insights for {aiInsights.employees.find((e: any) => e.employee_id === aiInsights.selectedEmployee)?.employee_name}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Status */}
      {aiInsights.error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Error: {aiInsights.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights List */}
      {aiInsights.loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : aiInsights.insights.length === 0 ? (
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-8 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI Insights Available</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first AI insights to get personalized recommendations for your team's wellness.
            </p>
            <Button
              onClick={() => aiInsights.generateNewInsights(aiInsights.selectedEmployee || undefined)}
              disabled={aiInsights.generating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {aiInsights.generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate {aiInsights.selectedEmployee ? 'Personal' : 'Team'} Insights
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Insights Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {aiInsights.insights.filter((i: any) => i.insight_type === 'summary' || i.insight_type === 'personal_insight').length}
                </div>
                <div className="text-xs text-muted-foreground">Assessments</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {aiInsights.insights.filter((i: any) => i.insight_type === 'recommendation').length}
                </div>
                <div className="text-xs text-muted-foreground">Recommendations</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {aiInsights.insights.filter((i: any) => i.insight_type === 'risk_alert').length}
                </div>
                <div className="text-xs text-muted-foreground">Risk Alerts</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {aiInsights.insights.filter((i: any) => i.insight_type === 'trend_analysis').length}
                </div>
                <div className="text-xs text-muted-foreground">Trend Analysis</div>
              </CardContent>
            </Card>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiInsights.insights.map((insight: any) => (
              <Card key={insight.id} className="bg-gradient-card border-0 shadow-soft hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {insight.insight_type === 'summary' && <Brain className="w-5 h-5 text-purple-500" />}
                      {insight.insight_type === 'personal_insight' && <User className="w-5 h-5 text-purple-500" />}
                      {insight.insight_type === 'recommendation' && <Zap className="w-5 h-5 text-yellow-500" />}
                      {insight.insight_type === 'trend_analysis' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                      {insight.insight_type === 'risk_alert' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      <span className="text-sm">{insight.title}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {insight.scope === 'individual' && (
                        <Badge variant="outline" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          Personal
                        </Badge>
                      )}
                      <Badge
                        variant={
                          insight.priority === 'critical' ? 'destructive' :
                          insight.priority === 'high' ? 'default' :
                          insight.priority === 'medium' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="flex items-center space-x-2 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{Math.round(insight.confidence_score * 100)}% confidence</span>
                    {insight.employee_name && (
                      <>
                        <span>•</span>
                        <span>{insight.employee_name} ({insight.department})</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <div className="whitespace-pre-wrap">{insight.content}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        {insight.data_period_start && insight.data_period_end
                          ? `${new Date(insight.data_period_start).toLocaleDateString()} - ${new Date(insight.data_period_end).toLocaleDateString()}`
                          : 'Recent data'
                        }
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        import('../utils/exportUtils').then(({ exportSingleInsight }) => {
                          exportSingleInsight(insight)
                        })
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
    )
  };



  const renderBillingContent = () => (
    <div className="space-y-6">
      {/* Uniform Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                Billing & Plans
              </h2>
              <p className="text-sm text-muted-foreground">Choose the perfect plan for your team</p>
            </div>
          </div>
          {currentPlan && (
            <div className="text-right">
              <div className="text-sm font-medium">Current Plan</div>
              <div className="text-lg font-bold text-green-600">{currentPlan.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Available Plans - Matching Homepage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Startup Plan */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Startup</CardTitle>
                <CardDescription>Perfect for small Kenyan teams</CardDescription>
              </div>
              <Badge variant="outline">Basic</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">KES 2,500</p>
              <p className="text-sm text-muted-foreground">per month</p>
              <p className="text-xs text-muted-foreground">($19 USD)</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Up to 25 employees</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Monthly check-ins</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Basic analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>WhatsApp & SMS integration</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Email support</span>
              </li>
            </ul>
            {currentPlan?.id === 'startup' ? (
              <Button variant="outline" className="w-full" disabled>
                <CreditCard className="w-4 h-4 mr-2" />
                Current Plan
              </Button>
            ) : (
              <button
                className="intaSendPayButton w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                data-amount={PLANS.startup.price.toString()}
                data-currency="KES"
                data-email={user?.email || "hr@company.com"}
                data-api_ref="staffpulse-startup-upgrade"
                data-comment="StaffPulse Startup Plan Upgrade"
                data-first_name={profile?.full_name?.split(' ')[0] || "HR"}
                data-last_name={profile?.full_name?.split(' ')[1] || "Manager"}
                data-country="KE"
                data-card_tarrif="BUSINESS-PAYS"
                data-mobile_tarrif="BUSINESS-PAYS"
                onClick={(e) => {
                  console.log('Startup button clicked!');
                  console.log('Current target (button):', e.currentTarget);
                  console.log('Button classes:', e.currentTarget.className);
                  console.log('Data attributes:', {
                    amount: e.currentTarget.getAttribute('data-amount'),
                    currency: e.currentTarget.getAttribute('data-currency'),
                    email: e.currentTarget.getAttribute('data-email')
                  });
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <CreditCard className="w-4 h-4" style={{ pointerEvents: 'none' }} />
                <span style={{ pointerEvents: 'none' }}>Upgrade to Startup - KES {PLANS.startup.price.toLocaleString()}</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Business Plan */}
        <Card className={`bg-gradient-card border-0 shadow-soft relative ${currentPlan?.id === 'business' ? 'ring-2 ring-blue-500' : ''}`}>
          {currentPlan?.id === 'business' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge variant="default" className="bg-blue-500 text-white">Current Plan</Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Business</CardTitle>
                <CardDescription>For growing Kenyan organizations</CardDescription>
              </div>
              <Badge variant="default" className="bg-blue-100 text-blue-700">Most Popular</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">KES 6,500</p>
              <p className="text-sm text-muted-foreground">per month</p>
              <p className="text-xs text-muted-foreground">($49 USD)</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Up to 100 employees</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Weekly check-ins</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Department insights</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Custom branding</span>
              </li>
            </ul>
            {currentPlan?.id === 'business' ? (
              <Button variant="outline" className="w-full" disabled>
                <CreditCard className="w-4 h-4 mr-2" />
                Current Plan
              </Button>
            ) : (
              <button
                className="intaSendPayButton w-full bg-white border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                data-amount={PLANS.business.price.toString()}
                data-currency="KES"
                data-email={user?.email || "hr@company.com"}
                data-api_ref="staffpulse-business-upgrade"
                data-comment="StaffPulse Business Plan Upgrade"
                data-first_name={profile?.full_name?.split(' ')[0] || "HR"}
                data-last_name={profile?.full_name?.split(' ')[1] || "Manager"}
                data-country="KE"
                data-card_tarrif="BUSINESS-PAYS"
                data-mobile_tarrif="BUSINESS-PAYS"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <CreditCard className="w-4 h-4" style={{ pointerEvents: 'none' }} />
                <span style={{ pointerEvents: 'none' }}>Upgrade to Business - KES {PLANS.business.price.toLocaleString()}</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large Kenyan corporations</CardDescription>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700">Best Value</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">KES 15,000</p>
              <p className="text-sm text-muted-foreground">per month</p>
              <p className="text-xs text-muted-foreground">($115 USD)</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Unlimited employees</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Daily check-ins</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Custom analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>API access</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Dedicated success manager</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>On-site training</span>
              </li>
            </ul>
            {currentPlan?.id === 'enterprise' ? (
              <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                <TrendingUp className="w-4 h-4 mr-2" />
                Current Plan
              </Button>
            ) : (
              <button
                className="intaSendPayButton w-full bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                data-amount={PLANS.enterprise.price.toString()}
                data-currency="KES"
                data-email={user?.email || "hr@company.com"}
                data-api_ref="staffpulse-enterprise-upgrade"
                data-comment="StaffPulse Enterprise Plan Upgrade"
                data-first_name={profile?.full_name?.split(' ')[0] || "HR"}
                data-last_name={profile?.full_name?.split(' ')[1] || "Manager"}
                data-country="KE"
                data-card_tarrif="BUSINESS-PAYS"
                data-mobile_tarrif="BUSINESS-PAYS"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <TrendingUp className="w-4 h-4" style={{ pointerEvents: 'none' }} />
                <span style={{ pointerEvents: 'none' }}>Upgrade to Enterprise - KES {PLANS.enterprise.price.toLocaleString()}</span>
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Security Features */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Secure Payments with IntaSend</CardTitle>
          <CardDescription>Bank-level security for all your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300">M-Pesa Integration</h4>
                <p className="text-sm text-muted-foreground">Direct Safaricom payments</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">Card Payments</h4>
                <p className="text-sm text-muted-foreground">Visa, Mastercard support</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">Bank Transfer</h4>
                <p className="text-sm text-muted-foreground">Direct bank payments</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-700 dark:text-orange-300">Secure & Fast</h4>
                <p className="text-sm text-muted-foreground">256-bit SSL encryption</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Payment History */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Payment History</CardTitle>
              <CardDescription>Your recent transactions and invoices</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : paymentsError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Error loading payment history: {paymentsError}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payment history found</p>
              <p className="text-sm text-muted-foreground">Your payment transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment, index) => {
                const getPaymentIcon = (provider: string) => {
                  if (provider.toLowerCase().includes('mpesa') || provider.toLowerCase().includes('mobile')) {
                    return <CheckCircle className="w-5 h-5 text-white" />
                  }
                  if (provider.toLowerCase().includes('card') || provider.toLowerCase().includes('visa') || provider.toLowerCase().includes('mastercard')) {
                    return <CreditCard className="w-5 h-5 text-white" />
                  }
                  return <Star className="w-5 h-5 text-white" />
                }

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'completed': return 'bg-green-100 text-green-700'
                    case 'pending': return 'bg-yellow-100 text-yellow-700'
                    case 'failed': return 'bg-red-100 text-red-700'
                    default: return 'bg-gray-100 text-gray-700'
                  }
                }

                const getAmountColor = (status: string) => {
                  switch (status) {
                    case 'completed': return 'text-green-600'
                    case 'pending': return 'text-yellow-600'
                    case 'failed': return 'text-red-600'
                    default: return 'text-gray-600'
                  }
                }

                const getBgGradient = (index: number) => {
                  const gradients = [
                    'bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10',
                    'bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10',
                    'bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10'
                  ]
                  return gradients[index % gradients.length]
                }

                return (
                  <div key={payment.id} className={`flex items-center justify-between p-4 border border-border rounded-xl ${getBgGradient(index)}`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        {getPaymentIcon(payment.provider)}
                      </div>
                      <div>
                        <p className="font-semibold">Plan Payment</p>
                        <p className="text-sm text-muted-foreground">
                          Paid via {payment.provider} • {new Date(payment.created_at).toLocaleDateString()} • Ref: {payment.payment_ref}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getAmountColor(payment.status)}`}>
                        {payment.currency} {payment.amount.toLocaleString()}
                      </p>
                      <Badge variant="default" className={getStatusColor(payment.status)}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>







    </div>
  );

  const renderEmployeeManagementContent = () => (
    <div className="space-y-6">
      {/* Employee Management Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Employee Management
            </h2>
            <p className="text-sm text-muted-foreground">Manage employees, departments, and organizational structure</p>
          </div>
        </div>
      </div>

      {/* Employee Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">
                  {employeeStats.loading ? '...' : employeeStats.data?.total_employees || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {employeeStats.loading ? '...' : employeeStats.data?.active_employees || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">
                  {employeeStats.loading ? '...' : employeeStats.data?.total_departments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {employeeStats.loading ? '...' : `${employeeStats.data?.response_rate || 0}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Management */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-500" />
                <span>Department Management</span>
              </CardTitle>
              <CardDescription>Manage departments and their employees</CardDescription>
            </div>
            <Button onClick={() => setShowAddDepartmentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentsList.loading ? (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">Loading departments...</p>
              </div>
            ) : departmentsList.data.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">No departments found. Add your first department to get started.</p>
              </div>
            ) : (
              departmentsList.data.map((department: any, index: number) => {
                // Cycle through colors for visual variety
                const colors = [
                  { bg: "from-blue-50/50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/10", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-100 text-blue-700" },
                  { bg: "from-green-50/50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/10", text: "text-green-700 dark:text-green-300", badge: "bg-green-100 text-green-700" },
                  { bg: "from-purple-50/50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/10", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-100 text-purple-700" },
                  { bg: "from-orange-50/50 to-orange-100/50 dark:from-orange-900/10 dark:to-orange-800/10", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-100 text-orange-700" }
                ];
                const colorScheme = colors[index % colors.length];

                return (
                  <div key={department.id} className={`p-4 border border-border rounded-xl bg-gradient-to-r ${colorScheme.bg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-semibold ${colorScheme.text}`}>{department.name}</h4>
                      <Badge variant="outline" className={colorScheme.badge}>
                        {department.employee_count} employees
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {department.description || 'No description available'}
                    </p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee List Management */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-500" />
                <span>Employee Directory</span>
              </CardTitle>
              <CardDescription>Manage individual employees and their information</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowAddEmployeeModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <Input placeholder="Search employees..." className="flex-1" />
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentsList.data.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {employeesList.loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading employees...</p>
              </div>
            ) : employeesList.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No employees found. Add your first employee to get started.</p>
              </div>
            ) : (
              employeesList.data.map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">{employee.initials}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.email} • {employee.department}
                        {employee.position && ` • ${employee.position}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={employee.is_active ? "default" : "outline"}
                      className={employee.is_active ? "bg-green-100 text-green-700" : ""}
                    >
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">Showing 4 of 78 employees</p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions & Import/Export */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-orange-500" />
            <span>Bulk Operations</span>
          </CardTitle>
          <CardDescription>Import, export, and manage employees in bulk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Import Employees</h4>
              <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Supported format: CSV with columns: Name, Email, Department, Phone</p>
                <a href="#" className="text-blue-600 hover:underline">Download sample template</a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Export Options</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Employees (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export by Department
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Active Users Only
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Employee Report
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Bulk Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Bulk Check-in
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Send Announcement
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Update Departments
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Settings
            </h2>
            <p className="text-sm text-muted-foreground">Configure your organization and application preferences</p>
          </div>
        </div>
      </div>

      {/* Organization Settings */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-500" />
            <span>Organization Settings</span>
          </CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" defaultValue="TechFlow Solutions" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-industry">Industry</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-size">Company Size</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-1000">201-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-location">Location</Label>
              <Input id="org-location" defaultValue="Nairobi, Kenya" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <textarea
              id="org-description"
              className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Brief description of your organization..."
              defaultValue="A leading technology company focused on innovative software solutions for businesses across Kenya."
            />
          </div>
          <Button>
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Organization Settings
          </Button>
        </CardContent>
      </Card>





      {/* Security & Privacy */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span>Security & Privacy</span>
          </CardTitle>
          <CardDescription>Manage security settings and data privacy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Account Security</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View Login History
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Data Privacy</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-retention">Data retention (months)</Label>
                  <Input id="data-retention" type="number" defaultValue="12" className="w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="anonymous-data">Anonymous data collection</Label>
                  <input type="checkbox" id="anonymous-data" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-export">Allow data export</Label>
                  <input type="checkbox" id="data-export" className="rounded" defaultChecked />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">Danger Zone</h4>
            <p className="text-sm text-muted-foreground mb-3">
              These actions are irreversible. Please proceed with caution.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-dashboard">
      {/* Modern Sidebar */}
      <ModernSidebar
        items={hrDashboardItems}
        activeItem={activeSection}
        onItemClick={setActiveSection}
        onSettingsClick={() => setActiveSection("settings")}
        userInfo={{
          name: profile?.full_name || "User",
          email: user?.email || "user@company.com",
          role: profile?.role === 'hr_manager' ? "HR Manager" : "Super Admin"
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>Add New Employee</span>
                  </CardTitle>
                  <CardDescription>Add a new employee to your organization</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emp-name">Full Name</Label>
                  <Input id="emp-name" placeholder="John Mwangi" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-email">Email Address</Label>
                  <Input id="emp-email" type="email" placeholder="john.mwangi@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-phone">Phone Number</Label>
                  <Input id="emp-phone" placeholder="+254712345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-department">Department</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsList.data.map((department: any) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-position">Position</Label>
                  <Input id="emp-position" placeholder="Software Engineer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-manager">Manager</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeesList.data.filter((emp: any) => emp.is_active).map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emp-notes">Notes (Optional)</Label>
                <textarea
                  id="emp-notes"
                  className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Additional notes about the employee..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
                <Button variant="outline" onClick={() => setShowAddEmployeeModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-purple-500" />
                    <span>Add New Department</span>
                  </CardTitle>
                  <CardDescription>Create a new department in your organization</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddDepartmentModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dept-name">Department Name</Label>
                  <Input id="dept-name" placeholder="Customer Success" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept-description">Description</Label>
                  <textarea
                    id="dept-description"
                    className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Brief description of the department's role and responsibilities..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept-manager">Department Head</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department head" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeesList.data.filter((emp: any) => emp.is_active).map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Department
                </Button>
                <Button variant="outline" onClick={() => setShowAddDepartmentModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};

export default HRDashboard;
