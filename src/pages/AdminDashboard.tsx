import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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
  Globe
} from "lucide-react";

const AdminDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Mock data for platform analytics
  const platformGrowth = [
    { month: "Jan", organizations: 12, employees: 450, revenue: 5400 },
    { month: "Feb", organizations: 18, employees: 680, revenue: 8200 },
    { month: "Mar", organizations: 25, employees: 890, revenue: 11500 },
    { month: "Apr", organizations: 34, employees: 1200, revenue: 15800 },
    { month: "May", organizations: 42, employees: 1450, revenue: 19200 },
    { month: "Jun", organizations: 51, employees: 1680, revenue: 23400 }
  ];

  const usageMetrics = [
    { date: "Week 1", checkIns: 2400, responses: 2100, satisfaction: 87 },
    { date: "Week 2", checkIns: 2800, responses: 2450, satisfaction: 89 },
    { date: "Week 3", checkIns: 3200, responses: 2890, satisfaction: 91 },
    { date: "Week 4", checkIns: 3100, responses: 2750, satisfaction: 88 }
  ];

  const organizations = [
    {
      id: 1,
      name: "TechFlow Solutions",
      employees: 125,
      plan: "Professional",
      status: "active",
      mrr: 789,
      lastActive: "2 hours ago",
      responseRate: 92,
      avgMood: 7.8,
      logo: "",
      industry: "Technology"
    },
    {
      id: 2,
      name: "GrowthCorp Inc",
      employees: 89,
      plan: "Starter",
      status: "active",
      mrr: 289,
      lastActive: "1 day ago",
      responseRate: 85,
      avgMood: 7.2,
      logo: "",
      industry: "Marketing"
    },
    {
      id: 3,
      name: "InnovateLab",
      employees: 234,
      plan: "Enterprise",
      status: "trial",
      mrr: 0,
      lastActive: "3 hours ago",
      responseRate: 78,
      avgMood: 8.1,
      logo: "",
      industry: "Research"
    },
    {
      id: 4,
      name: "BuildRight Co",
      employees: 67,
      plan: "Professional", 
      status: "active",
      mrr: 579,
      lastActive: "5 hours ago",
      responseRate: 88,
      avgMood: 6.9,
      logo: "",
      industry: "Construction"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "new_org",
      message: "New organization 'StartupXYZ' signed up",
      time: "10 minutes ago",
      severity: "info"
    },
    {
      id: 2,
      type: "upgrade",
      message: "TechFlow Solutions upgraded to Enterprise",
      time: "2 hours ago",
      severity: "success"
    },
    {
      id: 3,
      type: "alert",
      message: "Low response rate detected for BuildRight Co",
      time: "4 hours ago",
      severity: "warning"
    },
    {
      id: 4,
      type: "milestone",
      message: "Platform reached 2000+ employees milestone",
      time: "1 day ago",
      severity: "success"
    }
  ];

  const systemHealth = [
    { service: "API Gateway", status: "operational", uptime: 99.9 },
    { service: "WhatsApp Integration", status: "operational", uptime: 99.7 },
    { service: "Database", status: "operational", uptime: 99.8 },
    { service: "Analytics Engine", status: "degraded", uptime: 97.2 },
    { service: "Email Service", status: "operational", uptime: 99.5 }
  ];

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
      "Starter": "bg-muted text-muted-foreground",
      "Professional": "bg-primary text-primary-foreground",
      "Enterprise": "bg-gradient-primary text-white"
    };
    return <Badge className={variants[plan as keyof typeof variants]}>{plan}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and management</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="hero" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Organization
            </Button>
          </div>
        </div>

        {/* Key Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">51</div>
              <p className="text-xs text-success">
                +8 this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,680</div>
              <p className="text-xs text-success">
                +230 this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$23.4K</div>
              <p className="text-xs text-success">
                +22% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.2%</div>
              <p className="text-xs text-success">
                Uptime this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Global Reach</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Countries served
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Growth */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
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
                      <Line yAxisId="right" type="monotone" dataKey="employees" stroke="hsl(var(--secondary))" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Usage Metrics */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Usage Metrics</CardTitle>
                  <CardDescription>Check-ins and response patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={usageMetrics}>
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
                      <Area type="monotone" dataKey="checkIns" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="responses" stackId="2" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Platform events and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 bg-background/50 rounded-lg border border-border">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.severity === 'success' ? 'bg-success' : 
                        activity.severity === 'warning' ? 'bg-warning' : 
                        activity.severity === 'error' ? 'bg-destructive' : 'bg-primary'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            {/* Search and Filters */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Organizations Management</CardTitle>
                <CardDescription>Manage all client organizations</CardDescription>
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
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Organizations Table */}
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
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Analytics */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
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
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--success))" 
                        fill="hsl(var(--success))" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Customer Satisfaction */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                  <CardDescription>Platform-wide satisfaction scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={usageMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[80, 100]} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="satisfaction" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Churn Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">2.1%</div>
                  <p className="text-sm text-muted-foreground">Monthly churn rate</p>
                  <Progress value={21} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Customer LTV</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">$2,850</div>
                  <p className="text-sm text-muted-foreground">Average lifetime value</p>
                  <div className="mt-2 text-xs text-success">+15% vs last quarter</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>NPS Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">72</div>
                  <p className="text-sm text-muted-foreground">Net Promoter Score</p>
                  <div className="mt-2 text-xs text-success">+8 vs last month</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
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

            {/* System Metrics */}
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
                  <CardTitle className="text-sm">Server CPU</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">68%</div>
                  <Progress value={68} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7.2GB</div>
                  <p className="text-xs text-muted-foreground">of 16GB available</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Settings */}
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
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Anonymous Analytics</Label>
                      <p className="text-xs text-muted-foreground">Collect anonymous usage data</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-employees">Max Employees per Organization</Label>
                    <Input id="max-employees" type="number" defaultValue="500" />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
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
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Usage Alerts</Label>
                      <p className="text-xs text-muted-foreground">High usage or quota warnings</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alert-email">Alert Email</Label>
                    <Input id="alert-email" type="email" defaultValue="admin@staffpulse.com" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;