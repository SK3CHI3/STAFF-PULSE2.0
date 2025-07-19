import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
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
  Meh
} from "lucide-react";

const HRDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  // Mock data for charts
  const moodTrendData = [
    { date: "Mon", mood: 7.2, responses: 45 },
    { date: "Tue", mood: 6.8, responses: 43 },
    { date: "Wed", mood: 6.5, responses: 41 },
    { date: "Thu", mood: 7.8, responses: 47 },
    { date: "Fri", mood: 8.1, responses: 49 },
    { date: "Sat", mood: 7.5, responses: 42 },
    { date: "Sun", mood: 7.9, responses: 38 }
  ];

  const departmentMoodData = [
    { department: "Engineering", mood: 7.5, count: 25 },
    { department: "Marketing", mood: 8.2, count: 15 },
    { department: "Sales", mood: 6.8, count: 18 },
    { department: "HR", mood: 8.0, count: 8 },
    { department: "Design", mood: 7.9, count: 12 }
  ];

  const moodDistribution = [
    { name: "Very Happy", value: 35, color: "#22c55e" },
    { name: "Happy", value: 28, color: "#84cc16" },
    { name: "Neutral", value: 20, color: "#f59e0b" },
    { name: "Sad", value: 12, color: "#f97316" },
    { name: "Very Sad", value: 5, color: "#ef4444" }
  ];

  const responseRateData = [
    { week: "Week 1", rate: 85 },
    { week: "Week 2", rate: 78 },
    { week: "Week 3", rate: 92 },
    { week: "Week 4", rate: 88 }
  ];

  const recentFeedback = [
    {
      id: 1,
      employee: "Anonymous",
      department: "Engineering",
      mood: 6,
      feedback: "Work-life balance has been challenging lately with the new project deadlines.",
      time: "2 hours ago",
      priority: "medium"
    },
    {
      id: 2,
      employee: "Anonymous",
      department: "Marketing",
      mood: 9,
      feedback: "Really enjoying the new collaboration tools and team dynamic!",
      time: "4 hours ago",
      priority: "low"
    },
    {
      id: 3,
      employee: "Anonymous",
      department: "Sales",
      mood: 4,
      feedback: "Feeling overwhelmed with current workload and need better support.",
      time: "6 hours ago",
      priority: "high"
    }
  ];

  const teamMembers = [
    { name: "Engineering Team", members: 25, lastCheckIn: "Today", avgMood: 7.5, status: "active" },
    { name: "Marketing Team", members: 15, lastCheckIn: "Today", avgMood: 8.2, status: "active" },
    { name: "Sales Team", members: 18, lastCheckIn: "Yesterday", avgMood: 6.8, status: "warning" },
    { name: "HR Team", members: 8, lastCheckIn: "Today", avgMood: 8.0, status: "active" },
    { name: "Design Team", members: 12, lastCheckIn: "Today", avgMood: 7.9, status: "active" }
  ];

  const getMoodIcon = (mood: number) => {
    if (mood >= 8) return <Smile className="w-4 h-4 text-success" />;
    if (mood >= 6) return <Meh className="w-4 h-4 text-warning" />;
    return <Frown className="w-4 h-4 text-destructive" />;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-destructive text-destructive-foreground",
      medium: "bg-warning text-warning-foreground", 
      low: "bg-success text-success-foreground"
    };
    return <Badge className={variants[priority as keyof typeof variants]}>{priority}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">HR Dashboard</h1>
            <p className="text-muted-foreground">Monitor team wellness and engagement</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="hero" size="sm">
              <Send className="w-4 h-4 mr-2" />
              Send Check-in
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7.4</div>
              <p className="text-xs text-success">
                +0.3 from last week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">86%</div>
              <p className="text-xs text-success">
                +4% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-warning">
                Needs attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Trend Chart */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Mood Trend</CardTitle>
                  <CardDescription>Team mood over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={moodTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Mood */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Department Mood</CardTitle>
                  <CardDescription>Average mood by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentMoodData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar dataKey="mood" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mood Distribution */}
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>How your team is feeling</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
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
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Response Rate */}
              <Card className="bg-gradient-card border-0 shadow-soft lg:col-span-2">
                <CardHeader>
                  <CardTitle>Response Rate Trend</CardTitle>
                  <CardDescription>Employee participation over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={responseRateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--secondary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Team Overview</CardTitle>
                <CardDescription>Monitor all teams and their wellness status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((team, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-primary text-white">
                            {team.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{team.name}</h4>
                          <p className="text-sm text-muted-foreground">{team.members} members • Last check-in: {team.lastCheckIn}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getMoodIcon(team.avgMood)}
                          <span className="font-medium">{team.avgMood}</span>
                        </div>
                        <Badge variant={team.status === "active" ? "default" : "secondary"}>
                          {team.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Send Check-in
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>Anonymous employee feedback and mood reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentFeedback.map((item) => (
                    <div key={item.id} className="p-4 border border-border rounded-lg bg-background/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getMoodIcon(item.mood)}
                            <span className="font-medium">Mood: {item.mood}/10</span>
                          </div>
                          <Badge variant="outline">{item.department}</Badge>
                          {getPriorityBadge(item.priority)}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{item.feedback}</p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Mark as Read</Button>
                        <Button variant="outline" size="sm">Follow Up</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Wellness Trends</CardTitle>
                  <CardDescription>Long-term mood and engagement patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Wellness Score</span>
                      <span className="text-2xl font-bold text-success">8.2/10</span>
                    </div>
                    <Progress value={82} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-3 bg-success/10 rounded-lg">
                        <div className="text-lg font-bold text-success">76%</div>
                        <div className="text-xs text-muted-foreground">Happy Employees</div>
                      </div>
                      <div className="text-center p-3 bg-warning/10 rounded-lg">
                        <div className="text-lg font-bold text-warning">15%</div>
                        <div className="text-xs text-muted-foreground">Need Support</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                  <CardDescription>Employee participation and response quality</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Response Rate</span>
                        <span>86%</span>
                      </div>
                      <Progress value={86} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Feedback Quality</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Regular Participants</span>
                        <span>74%</span>
                      </div>
                      <Progress value={74} className="h-2" />
                    </div>
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

export default HRDashboard;