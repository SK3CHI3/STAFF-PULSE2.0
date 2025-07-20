import React from 'react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  BarChart, 
  LineChart, 
  PieChart,
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area, 
  Bar, 
  Line, 
  Pie, 
  Cell 
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, TrendingUp } from 'lucide-react'

interface ChartProps {
  title: string
  description: string
  data: any[]
  loading: boolean
  error: string | null
  type: 'area' | 'bar' | 'line' | 'pie' | 'composed'
  height?: number
  className?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const EnhancedChart: React.FC<ChartProps> = ({
  title,
  description,
  data,
  loading,
  error,
  type,
  height = 300,
  className = '',
  icon,
  children
}) => {
  const renderChart = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className={`h-[${height}px] w-full`} />
        </div>
      )
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No data available for the selected period</p>
          </div>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    )
  }

  return (
    <Card className={`bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  )
}

// Specialized chart components
export const MoodTrendChart: React.FC<{
  data: any[]
  loading: boolean
  error: string | null
  title?: string
  description?: string
}> = ({ data, loading, error, title = "Team Mood Trend", description = "Wellness patterns over time" }) => (
  <EnhancedChart
    title={title}
    description={description}
    data={data}
    loading={loading}
    error={error}
    type="area"
    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
  >
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis 
        dataKey="date" 
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        domain={[0, 10]} 
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          fontSize: "12px"
        }}
        labelStyle={{ color: "hsl(var(--foreground))" }}
      />
      <defs>
        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="mood"
        stroke="#10b981"
        fill="url(#moodGradient)"
        strokeWidth={3}
        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
      />
    </AreaChart>
  </EnhancedChart>
)

export const DepartmentWellnessChart: React.FC<{
  data: any[]
  loading: boolean
  error: string | null
  title?: string
  description?: string
}> = ({ data, loading, error, title = "Department Wellness", description = "Average wellness scores by department" }) => (
  <EnhancedChart
    title={title}
    description={description}
    data={data}
    loading={loading}
    error={error}
    type="bar"
    icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
  >
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis 
        dataKey="department" 
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        domain={[0, 10]} 
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          fontSize: "12px"
        }}
      />
      <Bar
        dataKey="mood"
        fill="#3b82f6"
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </EnhancedChart>
)

export const EngagementChart: React.FC<{
  data: any[]
  loading: boolean
  error: string | null
  title?: string
  description?: string
}> = ({ data, loading, error, title = "Engagement Metrics", description = "Response rates and participation over time" }) => (
  <EnhancedChart
    title={title}
    description={description}
    data={data}
    loading={loading}
    error={error}
    type="line"
    icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
  >
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis 
        dataKey="date" 
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          fontSize: "12px"
        }}
      />
      <Line
        type="monotone"
        dataKey="responses"
        stroke="#8b5cf6"
        strokeWidth={3}
        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
        name="Responses"
      />
      <Line
        type="monotone"
        dataKey="responseRate"
        stroke="#06b6d4"
        strokeWidth={3}
        dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }}
        name="Response Rate %"
      />
    </LineChart>
  </EnhancedChart>
)
