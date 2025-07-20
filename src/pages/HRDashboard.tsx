import { useState } from "react";
import { TimelineSelector, TimelineOption } from '@/components/charts/TimelineSelector';
import { MoodTrendChart, DepartmentWellnessChart, EngagementChart } from '@/components/charts/EnhancedChart';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { useMoodTrendData, useDepartmentWellnessData, useEngagementData, useDashboardStats, useRecentResponses, useMoodDistribution, useEmployeeStats, useEmployeesList, useDepartmentsList, useAIInsights, useCheckInCampaigns, useCheckInTargets } from '@/hooks/useChartData';
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
  TrendingDown,
  Play,
  Pause
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

  // Check-in hooks
  const checkInCampaigns = useCheckInCampaigns();
  const checkInTargets = useCheckInTargets();

  const [selectedMoodFilter, setSelectedMoodFilter] = useState("all");
  const responsesPerPage = 5;

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="bg-gradient-modern-card border-0 shadow-soft hover:shadow-strong transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Total Employees</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-medium">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {dashboardStats.loading ? '...' : dashboardStats.data?.total_employees || 0}
            </div>
            <p className="text-sm text-success flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Active employees
            </p>
            <p className="text-xs text-muted-foreground">
              Across {dashboardStats.loading ? '...' : dashboardStats.data?.total_departments || 0} departments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-modern-card border-0 shadow-soft hover:shadow-strong transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Average Mood</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-medium">
              <Heart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {dashboardStats.loading ? '...' : `${dashboardStats.data?.average_mood || 0}/10`}
            </div>
            <p className="text-sm text-success flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Last 30 days
            </p>
            <p className="text-xs text-muted-foreground">Team wellness score</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-modern-card border-0 shadow-soft hover:shadow-strong transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Response Rate</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-medium">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {dashboardStats.loading ? '...' : `${dashboardStats.data?.response_rate || 0}%`}
            </div>
            <p className="text-sm text-success flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Last 30 days
            </p>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.loading ? '...' : `${dashboardStats.data?.recent_checkins || 0} responses`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-modern-card border-0 shadow-soft hover:shadow-strong transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">Recent Check-ins</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-medium">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {dashboardStats.loading ? '...' : dashboardStats.data?.recent_checkins || 0}
            </div>
            <p className="text-sm text-success flex items-center">
              <Activity className="w-4 h-4 mr-1" />
              Last 30 days
            </p>
            <p className="text-xs text-muted-foreground">Employee responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Trend Chart */}
        <MoodTrendChart
          data={moodTrendChartData.data}
          loading={moodTrendChartData.loading}
          error={moodTrendChartData.error}
          title="Team Mood Trend"
          description="Wellness patterns over the last 7 days"
        />

        {/* Department Mood */}
        <DepartmentWellnessChart
          data={departmentWellnessChartData.data}
          loading={departmentWellnessChartData.loading}
          error={departmentWellnessChartData.error}
          title="Department Wellness"
          description="Average mood scores by department"
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
            <CardTitle className="text-sm">Weekly Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">7.4/10</div>
            <p className="text-xs text-muted-foreground">+0.3 from last week</p>
            <Progress value={74} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Participation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">86%</div>
            <p className="text-xs text-muted-foreground">67 of 78 employees</p>
            <Progress value={86} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Trend Direction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">Improving</span>
            </div>
            <p className="text-xs text-muted-foreground">Positive trend this month</p>
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
              <div className="flex items-center space-x-2 mb-2">
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
              <div className="text-sm space-y-1">
                {sendResult.scheduled ? (
                  <p className="text-green-600">{sendResult.message}</p>
                ) : (
                  <>
                    <p>✅ Sent: {sendResult.totalSent}</p>
                    <p>❌ Failed: {sendResult.failed}</p>
                  </>
                )}
                {sendResult.errors && sendResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      {sendResult.errors.slice(0, 5).map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                      {sendResult.errors.length > 5 && (
                        <li>... and {sendResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
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

              <div className="grid gap-3">
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

                {/* Individual Employees Option */}
                <div
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedTargetType === 'individual'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                  }`}
                  onClick={() => setSelectedTargetType('individual')}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="target-individual"
                      name="target"
                      value="individual"
                      checked={selectedTargetType === 'individual'}
                      onChange={(e) => setSelectedTargetType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="target-individual" className="font-medium cursor-pointer">
                          Individual Employees
                        </Label>
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          Custom selection
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Hand-pick specific employees for targeted check-ins
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individual Employee Selection */}
                {selectedTargetType === 'individual' && (
                  <div className="mt-3 p-4 bg-background/50 border border-border rounded-lg">
                    <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Select Individual Employees:</span>
                    </Label>

                    {/* Search/Filter for employees */}
                    <div className="mb-3">
                      <Input
                        placeholder="Search employees by name or department..."
                        className="text-sm"
                      />
                    </div>

                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {checkInTargets.data.employees?.filter((emp: any) => emp.has_phone).map((emp: any) => (
                        <div key={emp.id} className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg border border-transparent hover:border-purple-200 transition-all">
                          <input
                            type="checkbox"
                            id={`emp-${emp.id}`}
                            checked={selectedEmployees.includes(emp.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployees([...selectedEmployees, emp.id]);
                              } else {
                                setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <div className="flex-1">
                            <Label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{emp.name}</span>
                                  <span className="text-muted-foreground ml-2">• {emp.department}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  WhatsApp Ready
                                </Badge>
                              </div>
                            </Label>
                          </div>
                        </div>
                      ))}

                      {(!checkInTargets.data.employees || checkInTargets.data.employees.filter((emp: any) => emp.has_phone).length === 0) && (
                        <div className="text-center py-6 text-muted-foreground">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No employees with WhatsApp available</p>
                        </div>
                      )}
                    </div>

                    {selectedEmployees.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-purple-600 font-medium">
                            ✓ {selectedEmployees.length} employee(s) selected
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmployees([])}
                            className="text-xs h-6 px-2"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recipients Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      {getTargetEmployees().length} Recipients Selected
                    </span>
                  </div>
                  {getTargetEmployees().length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Ready to Send
                    </Badge>
                  )}
                </div>
                {getTargetEmployees().length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select employees above to see who will receive the check-in
                  </p>
                )}
                {getTargetEmployees().length > 0 && (
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    {selectedTargetType === 'all' && 'All employees with phone numbers'}
                    {selectedTargetType === 'department' && `${selectedDepartments.length} department(s) selected`}
                    {selectedTargetType === 'individual' && `${selectedEmployees.length} individual(s) selected`}
                  </div>
                )}
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
              <p className="text-xs text-muted-foreground">
                Use {'{name}'} to personalize with employee names
              </p>
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

                  <div className="grid gap-3">
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

                    {/* Individual Employees Option */}
                    <div
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTargetType === 'individual'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                      }`}
                      onClick={() => setSelectedTargetType('individual')}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="schedule-target-individual"
                          name="schedule-target"
                          value="individual"
                          checked={selectedTargetType === 'individual'}
                          onChange={(e) => setSelectedTargetType(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="schedule-target-individual" className="font-medium cursor-pointer">
                              Individual Employees
                            </Label>
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              Custom selection
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Schedule for specific employees
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

                {/* Recipients Summary for Schedule */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        {getTargetEmployees().length} Recipients Selected
                      </span>
                    </div>
                    {getTargetEmployees().length > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Ready to Schedule
                      </Badge>
                    )}
                  </div>
                  {getTargetEmployees().length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Select employees above to see who will receive the scheduled check-in
                    </p>
                  )}
                  {getTargetEmployees().length > 0 && (
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      {selectedTargetType === 'all' && 'All employees with phone numbers'}
                      {selectedTargetType === 'department' && `${selectedDepartments.length} department(s) selected`}
                      {selectedTargetType === 'individual' && `${selectedEmployees.length} individual(s) selected`}
                    </div>
                  )}
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

                  <div className="grid gap-3">
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

                    {/* Individual Employees Option */}
                    <div
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTargetType === 'individual'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-border hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                      }`}
                      onClick={() => setSelectedTargetType('individual')}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="automate-target-individual"
                          name="automate-target"
                          value="individual"
                          checked={selectedTargetType === 'individual'}
                          onChange={(e) => setSelectedTargetType(e.target.value)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="automate-target-individual" className="font-medium cursor-pointer">
                              Individual Employees
                            </Label>
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              Custom selection
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Automate for specific employees
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

                {/* Recipients Summary for Automate */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-900 dark:text-purple-100">
                        {getTargetEmployees().length} Recipients Selected
                      </span>
                    </div>
                    {getTargetEmployees().length > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Ready to Automate
                      </Badge>
                    )}
                  </div>
                  {getTargetEmployees().length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Select employees above to see who will receive the automated check-ins
                    </p>
                  )}
                  {getTargetEmployees().length > 0 && (
                    <div className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                      {selectedTargetType === 'all' && 'All employees with phone numbers'}
                      {selectedTargetType === 'department' && `${selectedDepartments.length} department(s) selected`}
                      {selectedTargetType === 'individual' && `${selectedEmployees.length} individual(s) selected`}
                    </div>
                  )}
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



  const renderAIInsightsContent = () => (
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
              onClick={aiInsights.generateNewInsights}
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
                  Generate Insights
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={aiInsights.refreshInsights}
              disabled={aiInsights.loading}
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

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
              onClick={aiInsights.generateNewInsights}
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
                  Generate First Insights
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiInsights.insights.map((insight: any) => (
            <Card key={insight.id} className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {insight.insight_type === 'summary' && <Brain className="w-5 h-5 text-purple-500" />}
                    {insight.insight_type === 'recommendation' && <Zap className="w-5 h-5 text-yellow-500" />}
                    {insight.insight_type === 'trend_analysis' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                    {insight.insight_type === 'risk_alert' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    <span>{insight.title}</span>
                  </CardTitle>
                  <Badge
                    variant={
                      insight.priority === 'critical' ? 'destructive' :
                      insight.priority === 'high' ? 'destructive' :
                      insight.priority === 'medium' ? 'default' : 'secondary'
                    }
                  >
                    {insight.priority}
                  </Badge>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <span>{insight.time_ago}</span>
                  {insight.confidence_score && (
                    <>
                      <span>•</span>
                      <span>{Math.round(insight.confidence_score * 100)}% confidence</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none text-sm">
                  <div className="whitespace-pre-wrap">{insight.content}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );



  const renderBillingContent = () => (
    <div className="space-y-6">
      {/* Uniform Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
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
            <Button variant="outline" className="w-full upgrade-btn" data-plan="Startup" data-amount="2500">
              <CreditCard className="w-4 h-4 mr-2" />
              Activate Plan
            </Button>
          </CardContent>
        </Card>

        {/* Business Plan - Current */}
        <Card className="bg-gradient-card border-0 shadow-soft ring-2 ring-blue-500 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge variant="default" className="bg-blue-500 text-white">Current Plan</Badge>
          </div>
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
            <div className="space-y-2">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">78 / 100 employees used</p>
                <p className="text-xs text-muted-foreground">Next billing: Feb 20, 2024</p>
              </div>
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Manage Plan
              </Button>
            </div>
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
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 upgrade-btn" data-plan="Enterprise" data-amount="15000">
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade to Enterprise
            </Button>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Professional Plan - January 2024</p>
                  <p className="text-sm text-muted-foreground">Paid via M-Pesa • Jan 20, 2024 • Ref: MP240120001</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">KSh 2,500</p>
                <Badge variant="default" className="bg-green-100 text-green-700">Completed</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Professional Plan - December 2023</p>
                  <p className="text-sm text-muted-foreground">Paid via Visa Card • Dec 20, 2023 • Ref: CD231220001</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">KSh 2,500</p>
                <Badge variant="default" className="bg-blue-100 text-blue-700">Completed</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Setup Fee & First Month</p>
                  <p className="text-sm text-muted-foreground">Paid via M-Pesa • Nov 15, 2023 • Ref: MP231115001</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-purple-600">KSh 3,500</p>
                <Badge variant="default" className="bg-purple-100 text-purple-700">Completed</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IntaSend Payment Modal - Hidden by default, shown when upgrade clicked */}
      <div id="payment-modal" className="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Complete Payment</span>
              <button
                onClick={() => document.getElementById('payment-modal').classList.add('hidden')}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </CardTitle>
            <CardDescription>Secure payment powered by IntaSend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold" id="payment-amount">KES 15,000</p>
              <p className="text-sm text-muted-foreground" id="payment-plan">Enterprise Plan - Monthly</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="payment-email">Email Address</Label>
                <Input id="payment-email" type="email" defaultValue="hr@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-phone">M-Pesa Phone (Optional)</Label>
                <Input id="payment-phone" placeholder="+254712345678" />
              </div>
            </div>

            <button
              className="intaSendPayButton w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              data-amount="15000"
              data-currency="KES"
              data-email="hr@company.com"
              data-api_ref="staffpulse-enterprise-upgrade"
              data-comment="StaffPulse Enterprise Plan Upgrade"
              data-first_name="HR"
              data-last_name="Manager"
              data-country="KE"
              data-card_tarrif="BUSINESS-PAYS"
              data-mobile_tarrif="BUSINESS-PAYS"
            >
              <div className="flex items-center justify-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Pay with IntaSend</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <span className="text-sm font-medium">M-Pesa</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                <CreditCard className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium">Cards</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Secure payment with 256-bit SSL encryption
            </p>
          </CardContent>
        </Card>
      </div>

      {/* IntaSend Script Integration */}
      <script
        src="https://unpkg.com/intasend-inlinejs-sdk@3/build/intasend-inline.js"
        async
      ></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('DOMContentLoaded', function() {
              // Initialize IntaSend
              new window.IntaSend({
                publicAPIKey: "ISPubKey_test_39c6a0b0-629e-4ac0-94d9-9b9c6e2f8c5a",
                live: false
              })
              .on("COMPLETE", (results) => {
                console.log("Payment completed:", results);
                document.getElementById('payment-modal').classList.add('hidden');
                alert("Payment successful! Your plan has been upgraded.");
              })
              .on("FAILED", (results) => {
                console.log("Payment failed:", results);
                alert("Payment failed. Please try again or contact support.");
              })
              .on("IN-PROGRESS", (results) => {
                console.log("Payment in progress:", results);
              });

              // Handle upgrade button clicks
              document.addEventListener('click', function(e) {
                if (e.target.closest('.upgrade-btn')) {
                  const plan = e.target.closest('.upgrade-btn').dataset.plan;
                  const amount = e.target.closest('.upgrade-btn').dataset.amount;

                  document.getElementById('payment-amount').textContent = 'KES ' + amount;
                  document.getElementById('payment-plan').textContent = plan + ' Plan - Monthly';
                  document.querySelector('.intaSendPayButton').setAttribute('data-amount', amount);
                  document.querySelector('.intaSendPayButton').setAttribute('data-api_ref', 'staffpulse-' + plan.toLowerCase() + '-upgrade');

                  document.getElementById('payment-modal').classList.remove('hidden');
                }
              });
            });
          `
        }}
      />
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
