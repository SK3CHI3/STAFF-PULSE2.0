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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ModernSidebar, adminDashboardItems } from "@/components/layout/ModernSidebar";
import { supabase } from "@/lib/supabase";
import { TimelineSelector, TimelineOption } from "@/components/charts/TimelineSelector";
import {
  usePlatformGrowth,
  useUsageMetrics,
  useOrganizationsList,
  useRecentActivities,
  useSystemHealth,
  usePlatformFeedback,
  useOrganizationDistribution,
  useSystemMetrics,
  useAdminProfile,
  useDailyEngagementMetrics
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
  TrendingDown,
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
  MessageSquare,
  LayoutDashboard
} from "lucide-react";

const AdminDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeSection, setActiveSection] = useState("overview");
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set());
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  // Handle section change and mark as viewed
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setViewedSections(prev => new Set([...prev, sectionId]));
  };

  // Handle view organization
  const handleViewOrganization = (org: any) => {
    setSelectedOrg(org);
    setViewModalOpen(true);
  };

  // Handle delete organization
  const handleDeleteOrganization = (org: any) => {
    setSelectedOrg(org);
    setDeleteModalOpen(true);
  };

  // Confirm delete organization
  const confirmDeleteOrganization = async () => {
    if (!selectedOrg) return;

    setIsDeleting(true);
    try {
      // Delete organization from database
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', selectedOrg.id);

      if (error) throw error;

      toast({
        title: "Organization Deleted",
        description: `"${selectedOrg.name}" has been deleted successfully.`,
        variant: "default",
      });

      // Close modal and refresh
      setDeleteModalOpen(false);
      setSelectedOrg(null);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const [timeline, setTimeline] = useState<TimelineOption>('1m');

  // Real data hooks
  const platformGrowthData = usePlatformGrowth(timeline);
  const usageMetricsData = useUsageMetrics(4);
  const organizationsData = useOrganizationsList();
  const recentActivitiesData = useRecentActivities(10);
  const systemHealthData = useSystemHealth();
  const platformFeedbackData = usePlatformFeedback(10);
  const organizationDistributionData = useOrganizationDistribution();
  const systemMetricsData = useSystemMetrics();
  const adminProfileData = useAdminProfile();
  const dailyEngagementData = useDailyEngagementMetrics(timeline);

  // Use real data or fallback to empty arrays
  const platformGrowth = platformGrowthData.data || [];
  const usageMetrics = usageMetricsData.data || [];
  const organizations = organizationsData.data || [];
  const recentActivities = recentActivitiesData.data || [];
  const systemHealth = systemHealthData.data || [];
  const platformFeedback = platformFeedbackData.data || [];
  const organizationDistribution = organizationDistributionData.data || [];
  const systemMetrics = systemMetricsData.data || {};
  const adminProfile = adminProfileData.data || {};
  const dailyEngagement = dailyEngagementData.data || [];

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
    if (!data || data.length < 2) return { trend: 'new', percentage: 0 };

    // Get all data points (including zeros for better trend analysis)
    const allData = data.filter(item => item[key] !== undefined && item[key] !== null);
    if (allData.length < 2) return { trend: 'new', percentage: 0 };

    // Find first and last non-zero values for meaningful comparison
    const nonZeroData = allData.filter(item => item[key] > 0);

    // If we have recent activity but no historical data, show as "new"
    if (nonZeroData.length === 1) {
      const hasRecentActivity = allData.slice(-30).some(item => item[key] > 0); // Last 30 days
      return hasRecentActivity ? { trend: 'new', percentage: 0 } : { trend: 'neutral', percentage: 0 };
    }

    if (nonZeroData.length < 2) return { trend: 'neutral', percentage: 0 };

    const firstValue = nonZeroData[0][key];
    const lastValue = nonZeroData[nonZeroData.length - 1][key];

    if (firstValue === 0) return { trend: 'neutral', percentage: 0 };

    const percentage = ((lastValue - firstValue) / firstValue) * 100;
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral'; // 5% threshold for meaningful change

    return { trend, percentage: Math.abs(percentage) };
  };

  // Helper function to calculate total revenue from timeline data
  const getTotalRevenue = (data: any[]) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((total, item) => total + (item.revenue || 0), 0);
  };

  // Generate dynamic sidebar items
  const getDynamicAdminDashboardItems = () => {
    return [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        active: activeSection === "overview"
      },
      {
        id: "organizations",
        label: "Organizations",
        icon: Building,
        badge: !viewedSections.has("organizations") && systemMetrics.totalOrganizations > 0 ? "New" : undefined,
        active: activeSection === "organizations"
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
        active: activeSection === "analytics"
      },
      {
        id: "feedback",
        label: "Feedback",
        icon: MessageSquare,
        badge: !viewedSections.has("feedback") && platformFeedback.length > 0 ? platformFeedback.length.toString() : undefined,
        active: activeSection === "feedback"
      },
      {
        id: "system",
        label: "System Health",
        icon: Activity,
        active: activeSection === "system"
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        active: activeSection === "settings"
      }
    ];
  };

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
      <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/50 dark:to-indigo-900/50 rounded-2xl border border-border/50 shadow-lg p-6">
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
            <div className="text-2xl font-bold">{systemMetrics.totalOrganizations || 0}</div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const trend = calculateTrend(platformGrowth, 'organizations');
                return (
                  <>
                    {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                    <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {trend.trend === 'neutral' ? 'No change' :
                       trend.trend === 'new' ? 'New activity' :
                       `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
                    </p>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalEmployees || 0}</div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const trend = calculateTrend(platformGrowth, 'employees');
                return (
                  <>
                    {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                    <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {trend.trend === 'neutral' ? 'No change' :
                       trend.trend === 'new' ? 'New activity' :
                       `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
                    </p>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalCheckIns || 0}</div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const trend = calculateTrend(dailyEngagement, 'checkIns');
                return (
                  <>
                    {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                    <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {trend.trend === 'neutral' ? 'No change' :
                       trend.trend === 'new' ? 'New activity' :
                       `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
                    </p>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(systemMetrics.totalRevenue || 0).toLocaleString()}</div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const trend = calculateTrend(platformGrowth, 'revenue');
                return (
                  <>
                    {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                    <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {trend.trend === 'neutral' ? 'No change' :
                       trend.trend === 'new' ? 'First revenue!' :
                       `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
                    </p>
                  </>
                );
              })()}
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Beautiful Analytics Charts */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Platform Analytics</h3>
          <p className="text-sm text-muted-foreground">Growth and engagement trends</p>
        </div>
        <TimelineSelector
          value={timeline}
          onChange={setTimeline}
          className="ml-auto"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Growth Chart */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Platform Growth</span>
            </CardTitle>
            <CardDescription>Organizations and employee growth over the {
              timeline === '7d' ? 'last 7 days' :
              timeline === '1m' ? 'last month' :
              timeline === '3m' ? 'last 3 months' :
              timeline === '6m' ? 'last 6 months' : 'last year'
            }</CardDescription>
          </CardHeader>
          <CardContent>
            {platformGrowthData.loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-muted-foreground">Loading chart data...</div>
              </div>
            ) : platformGrowthData.error ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-destructive">Error loading data: {platformGrowthData.error}</div>
              </div>
            ) : platformGrowth.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-muted-foreground">No data available for the selected period</div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={platformGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  interval={getXAxisInterval(timeline, platformGrowth.length)}
                  angle={timeline === '7d' ? 0 : -45}
                  textAnchor={timeline === '7d' ? 'middle' : 'end'}
                  height={timeline === '7d' ? 40 : 60}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  allowDataOverflow={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <defs>
                  <linearGradient id="organizationsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="employeesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotoneX"
                  dataKey="organizations"
                  stroke="#3b82f6"
                  fill="url(#organizationsGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Organizations"
                  connectNulls={false}
                />
                <Area
                  type="monotoneX"
                  dataKey="employees"
                  stroke="#10b981"
                  fill="url(#employeesGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Employees"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Analytics Chart */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span>Revenue Analytics</span>
            </CardTitle>
            <CardDescription>Revenue trends over the {
              timeline === '7d' ? 'last 7 days' :
              timeline === '1m' ? 'last month' :
              timeline === '3m' ? 'last 3 months' :
              timeline === '6m' ? 'last 6 months' : 'last year'
            }</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={platformGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  interval={getXAxisInterval(timeline, platformGrowth.length)}
                  angle={timeline === '7d' ? 0 : -45}
                  textAnchor={timeline === '7d' ? 'middle' : 'end'}
                  height={timeline === '7d' ? 40 : 60}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  domain={[0, 'dataMax + 100']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value) => [`KES ${value}`, 'Revenue']}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotoneX"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="url(#revenueGradient)"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", strokeWidth: 1, r: 2.5 }}
                  activeDot={{ r: 4, stroke: "#10b981", strokeWidth: 2, fill: "#ffffff" }}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrganization(org)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrganization(org)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="flex items-center justify-between">
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
          <TimelineSelector
            value={timeline}
            onChange={setTimeline}
            className="ml-auto"
          />
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
            <CardDescription>Organizations and employee growth over the {
              timeline === '7d' ? 'last 7 days' :
              timeline === '1m' ? 'last month' :
              timeline === '3m' ? 'last 3 months' :
              timeline === '6m' ? 'last 6 months' : 'last year'
            }</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={platformGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  interval={getXAxisInterval(timeline, platformGrowth.length)}
                  angle={timeline === '7d' ? 0 : -45}
                  textAnchor={timeline === '7d' ? 'middle' : 'end'}
                  height={timeline === '7d' ? 40 : 60}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  allowDataOverflow={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <defs>
                  <linearGradient id="organizationsGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="employeesGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotoneX"
                  dataKey="organizations"
                  stroke="#8b5cf6"
                  fill="url(#organizationsGradientAnalytics)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Organizations"
                  connectNulls={false}
                />
                <Area
                  type="monotoneX"
                  dataKey="employees"
                  stroke="#06b6d4"
                  fill="url(#employeesGradientAnalytics)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Employees"
                  connectNulls={false}
                />
              </AreaChart>
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
            <CardDescription>Revenue trends over the {
              timeline === '7d' ? 'last 7 days' :
              timeline === '1m' ? 'last month' :
              timeline === '3m' ? 'last 3 months' :
              timeline === '6m' ? 'last 6 months' : 'last year'
            }</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={platformGrowth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  interval={getXAxisInterval(timeline, platformGrowth.length)}
                  angle={timeline === '7d' ? 0 : -45}
                  textAnchor={timeline === '7d' ? 'middle' : 'end'}
                  height={timeline === '7d' ? 40 : 60}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  domain={[0, 'dataMax + 100']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value) => [`KES ${value}`, 'Revenue']}
                />
                <defs>
                  <linearGradient id="revenueGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotoneX"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  fill="url(#revenueGradientAnalytics)"
                  strokeWidth={2.5}
                  dot={{ fill: "#f59e0b", strokeWidth: 1, r: 2.5 }}
                  activeDot={{ r: 4, stroke: "#f59e0b", strokeWidth: 2, fill: "#ffffff" }}
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
            <CardDescription>Check-ins, responses, and mood trends over the {
              timeline === '7d' ? 'last 7 days' :
              timeline === '1m' ? 'last month' :
              timeline === '3m' ? 'last 3 months' :
              timeline === '6m' ? 'last 6 months' : 'last year'
            }</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyEngagementData.loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-muted-foreground">Loading engagement data...</div>
              </div>
            ) : dailyEngagementData.error ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-destructive">Error loading data: {dailyEngagementData.error}</div>
              </div>
            ) : dailyEngagement.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-muted-foreground">No engagement data available for the selected period</div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyEngagement} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  interval={getXAxisInterval(timeline, dailyEngagement.length)}
                  angle={timeline === '7d' ? 0 : -45}
                  textAnchor={timeline === '7d' ? 'middle' : 'end'}
                  height={timeline === '7d' ? 40 : 60}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  domain={[0, 'dataMax + 1']}
                  allowDataOverflow={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <defs>
                  <linearGradient id="checkInsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="responsesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="avgMoodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotoneX"
                  dataKey="checkIns"
                  stroke="#8b5cf6"
                  fill="url(#checkInsGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Check-ins"
                  connectNulls={false}
                />
                <Area
                  type="monotoneX"
                  dataKey="responses"
                  stroke="#06b6d4"
                  fill="url(#responsesGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Responses"
                  connectNulls={false}
                />
                <Area
                  type="monotoneX"
                  dataKey="avgMood"
                  stroke="#f59e0b"
                  fill="url(#avgMoodGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Avg Mood"
                  connectNulls={false}
                />
                <Area
                  type="monotoneX"
                  dataKey="activeUsers"
                  stroke="#10b981"
                  fill="url(#activeUsersGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Active Users"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
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
              <BarChart data={organizationDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="plan"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="active" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Active" />
                <Bar dataKey="trial" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Trial" />
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
            <div className="text-2xl font-bold">{systemMetrics.apiResponseTime || 0}ms</div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const responseTime = systemMetrics.apiResponseTime || 0;
                const isGood = responseTime < 200;
                return (
                  <>
                    {isGood ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                    <p className={`text-xs ${isGood ? 'text-green-500' : 'text-red-500'}`}>
                      {isGood ? 'Excellent' : 'Needs attention'}
                    </p>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Database Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(systemMetrics.databaseLoad || 0)}%</div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const load = systemMetrics.databaseLoad || 0;
                const isGood = load < 70;
                return (
                  <>
                    {isGood ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                    <p className={`text-xs ${isGood ? 'text-green-500' : 'text-red-500'}`}>
                      {isGood ? 'Optimal' : 'High load'}
                    </p>
                  </>
                );
              })()}
            </div>
            <Progress value={systemMetrics.databaseLoad || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>



        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.activeUsers || 0}</div>
            <div className="flex items-center space-x-1 mt-1">
              {(() => {
                const trend = calculateTrend(dailyEngagement, 'activeUsers');
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
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Modern Sidebar */}
      <ModernSidebar
        items={getDynamicAdminDashboardItems()}
        activeItem={activeSection}
        onItemClick={handleSectionChange}
        userInfo={{
          name: adminProfile.name || "Admin User",
          email: adminProfile.email || "admin@staffpulse.com",
          role: adminProfile.role || "Platform Administrator"
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-transparent via-blue-50/30 to-indigo-50/50 dark:via-blue-900/20 dark:to-indigo-900/30">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* View Organization Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-500" />
              <span>Organization Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-6">
              {/* Organization Header */}
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-primary text-white text-lg">
                    {selectedOrg.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedOrg.name}</h3>
                  <p className="text-muted-foreground">{selectedOrg.industry}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getPlanBadge(selectedOrg.plan)}
                    {getStatusBadge(selectedOrg.status)}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-background/50 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">{selectedOrg.employees}</div>
                  <div className="text-sm text-muted-foreground">Employees</div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">{selectedOrg.avgMood}/10</div>
                  <div className="text-sm text-muted-foreground">Avg Mood</div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">{selectedOrg.responseRate}%</div>
                  <div className="text-sm text-muted-foreground">Response Rate</div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg border">
                  <div className="text-2xl font-bold text-orange-600">${selectedOrg.mrr}</div>
                  <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Organization ID:</span>
                  <span className="text-muted-foreground font-mono text-sm">{selectedOrg.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Last Active:</span>
                  <span className="text-muted-foreground">{selectedOrg.lastActive}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Created:</span>
                  <span className="text-muted-foreground">
                    {new Date(selectedOrg.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Organization</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the organization and all associated data.
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {selectedOrg.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{selectedOrg.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrg.industry}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>This will delete:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{selectedOrg.employees} employee records</li>
                  <li>All check-in data and mood scores</li>
                  <li>Subscription and billing information</li>
                  <li>All organization settings and preferences</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteOrganization}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
