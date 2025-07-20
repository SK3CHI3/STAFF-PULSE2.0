import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ModernSidebar, adminDashboardItems } from "@/components/layout/ModernSidebar";
import {
  usePlatformGrowth,
  useUsageMetrics,
  useOrganizationsList,
  useRecentActivities,
  useSystemHealth,
  usePlatformFeedback
} from "@/hooks/useAdminData";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";
import {
  Building,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Settings,
  Plus,
  Filter,
  Download,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Shield,
  BarChart3,
  MessageSquare
} from "lucide-react";

const AdminDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeSection, setActiveSection] = useState("overview");

  // Real data hooks
  const platformGrowthData = usePlatformGrowth(6);
  const usageMetricsData = useUsageMetrics(4);
  const organizationsData = useOrganizationsList();
  const recentActivitiesData = useRecentActivities(10);
  const systemHealthData = useSystemHealth();
  const platformFeedbackData = usePlatformFeedback(10);

  // Use real data or fallback to empty arrays
  const platformGrowth = platformGrowthData.data || [];

  const usageMetrics = usageMetricsData.data || [];

  const organizations = organizationsData.data || [];

  const recentActivities = recentActivitiesData.data || [];

  const systemHealth = systemHealthData.data || [];

  const platformFeedback = platformFeedbackData.data || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-success text-success-foreground",
      trial: "bg-warning text-warning-foreground",
      suspended: "bg-destructive text-destructive-foreground",
      operational: "bg-success text-success-foreground",
      degraded: "bg-warning text-warning-foreground",
      down: "bg-destructive text-destructive-foreground"
    };
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const variants = {
      "Starter": "bg-secondary text-secondary-foreground",
      "Professional": "bg-primary text-primary-foreground",
      "Enterprise": "bg-gradient-primary text-white"
    };
    return <Badge className={variants[plan as keyof typeof variants]}>{plan}</Badge>;
  };

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverviewContent();
      case "organizations":
        return renderOrganizationsContent();
      case "analytics":
        return renderAnalyticsContent();
      case "hr-alerts":
        return renderHRAlerts();
      case "feedback":
        return renderFeedbackContent();
      case "system":
        return renderSystemContent();
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
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Platform management and analytics</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="group">
              <Settings className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="group">
              <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Export
            </Button>
            <Button variant="hero" size="sm" className="group">
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
              Add Organization
            </Button>
          </div>
        </div>
      </div>

      {/* Key Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">51</div>
            <p className="text-xs text-success">+8 this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-success">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,580</div>
            <p className="text-xs text-success">+18% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">99.9%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Beautiful Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Growth Chart */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Platform Growth</span>
            </CardTitle>
            <CardDescription>Organizations and employee growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar yAxisId="left" dataKey="organizations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="employees" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Analytics Chart */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span>Revenue Analytics</span>
            </CardTitle>
            <CardDescription>Monthly recurring revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOrganizationsContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-glass rounded-2xl p-8 border-0 shadow-soft">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Organizations Management</h2>
        <p className="text-muted-foreground mt-2">Manage all client organizations and their subscriptions.</p>
      </div>

      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>All registered organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search organizations..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {org.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{org.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{org.employees} employees</span>
                      <span>•</span>
                      <span>{org.industry}</span>
                      <span>•</span>
                      <span>Last active: {org.lastActive}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-semibold">${org.mrr}/month</div>
                    <div className="text-sm text-muted-foreground">MRR</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{org.responseRate}%</div>
                    <div className="text-sm text-muted-foreground">Response Rate</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{org.avgMood}/10</div>
                    <div className="text-sm text-muted-foreground">Avg Mood</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPlanBadge(org.plan)}
                    {getStatusBadge(org.status)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsContent = () => (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Platform Analytics
            </h2>
            <p className="text-sm text-muted-foreground">Comprehensive insights across all organizations</p>
          </div>
        </div>
      </div>

      {/* Four Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Platform Growth Chart */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Platform Growth</span>
            </CardTitle>
            <CardDescription>Organizations and employee growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar yAxisId="left" dataKey="organizations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="employees" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Revenue Analytics Chart */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span>Revenue Analytics</span>
            </CardTitle>
            <CardDescription>Monthly recurring revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. User Engagement Chart */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <span>User Engagement</span>
            </CardTitle>
            <CardDescription>Check-ins, responses, and satisfaction rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Line type="monotone" dataKey="checkIns" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }} name="Check-ins" />
                <Line type="monotone" dataKey="responses" stroke="#06b6d4" strokeWidth={3} dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }} name="Responses" />
                <Line type="monotone" dataKey="satisfaction" stroke="#f59e0b" strokeWidth={3} dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }} name="Satisfaction %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Organization Distribution Chart */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-orange-500" />
              <span>Organization Distribution</span>
            </CardTitle>
            <CardDescription>Organizations by plan type and status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { plan: "Starter", active: 18, trial: 5, suspended: 2 },
                { plan: "Professional", active: 22, trial: 3, suspended: 1 },
                { plan: "Enterprise", active: 8, trial: 1, suspended: 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="plan" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="active" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Active" />
                <Bar dataKey="trial" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Trial" />
                <Bar dataKey="suspended" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Suspended" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderFeedbackContent = () => (
    <div className="space-y-6">
      {/* Feedback Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              Platform Feedback
            </h2>
            <p className="text-sm text-muted-foreground">Feedback and support requests from organizations</p>
          </div>
        </div>
      </div>

      {/* Feedback Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-xl font-bold">13</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Feedback</CardTitle>
            <div className="flex gap-2">
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
            {platformFeedback.map((feedback) => (
              <div key={feedback.id} className="p-4 border border-border rounded-lg bg-background/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold">{feedback.subject}</h4>
                      <Badge variant={
                        feedback.priority === 'high' ? 'destructive' :
                        feedback.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {feedback.priority}
                      </Badge>
                      <Badge variant={
                        feedback.status === 'resolved' ? 'default' :
                        feedback.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {feedback.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From: {feedback.sender} at {feedback.organization}
                    </p>
                    <p className="text-sm">{feedback.message}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{feedback.timestamp}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                  {feedback.status === 'open' && (
                    <Button variant="default" size="sm">
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-glass rounded-2xl p-8 border-0 shadow-soft">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">System Health</h2>
        <p className="text-muted-foreground mt-2">Monitor system performance and health metrics.</p>
      </div>

      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>System Health Monitor</CardTitle>
          <CardDescription>Real-time status of all platform services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === 'operational' ? 'bg-success' :
                    service.status === 'degraded' ? 'bg-warning' : 'bg-destructive'
                  }`} />
                  <h4 className="font-semibold">{service.service}</h4>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-semibold">{service.uptime}%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  {getStatusBadge(service.status)}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">API Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">145ms</div>
            <p className="text-xs text-success">Average response time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Database Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42%</div>
            <Progress value={42} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Server Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-success">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-glass rounded-2xl p-8 border-0 shadow-soft">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Platform Settings</h2>
        <p className="text-muted-foreground mt-2">Configure platform-wide settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>Configure global platform options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">Enable platform-wide maintenance</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">New Registrations</Label>
                <p className="text-xs text-muted-foreground">Allow new organization signups</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-employees">Max Employees per Organization</Label>
              <Input id="max-employees" type="number" defaultValue="500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure admin notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">System Alerts</Label>
                <p className="text-xs text-muted-foreground">Critical system notifications</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">New Signups</Label>
                <p className="text-xs text-muted-foreground">Notify about new organizations</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-email">Alert Email</Label>
              <Input id="alert-email" type="email" defaultValue="admin@staffpulse.com" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-dashboard">
      {/* Modern Sidebar */}
      <ModernSidebar
        items={adminDashboardItems}
        activeItem={activeSection}
        onItemClick={setActiveSection}
        userInfo={{
          name: "Admin User",
          email: "admin@staffpulse.com",
          role: "Platform Administrator"
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
    </div>
  );
};

export default AdminDashboard;
