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
  timeline?: string
}> = ({ data, loading, error, title = "Team Mood Trend", description = "Wellness patterns over time", timeline = '7d' }) => {
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

  return (
  <EnhancedChart
    title={title}
    description={description}
    data={data}
    loading={loading}
    error={error}
    type="area"
    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
  >
    <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis
        dataKey="date"
        stroke="hsl(var(--muted-foreground))"
        tick={{ fontSize: 11 }}
        interval={Math.max(0, Math.floor(data.length / 6))}
        angle={-45}
        textAnchor="end"
        height={70}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => {
          if (!value) return '';
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        }}
      />
      <YAxis
        domain={[0, 10]}
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        width={50}
        tickFormatter={(value) => value.toString()}
        ticks={[0, 2, 4, 6, 8, 10]}
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
        strokeWidth={2.5}
        dot={false}
        activeDot={{
          r: 6,
          fill: "#10b981",
          stroke: "#ffffff",
          strokeWidth: 2
        }}
      />
    </AreaChart>
  </EnhancedChart>
  );
}

export const DepartmentWellnessChart: React.FC<{
  data: any[]
  loading: boolean
  error: string | null
  title?: string
  description?: string
}> = ({ data, loading, error, title = "Department Wellness", description = "Average wellness scores by department" }) => {
  // Clean and deduplicate data to prevent duplicate keys
  const cleanData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return []

    // Filter out invalid entries and deduplicate by department name
    const validData = data.filter(item =>
      item &&
      typeof item === 'object' &&
      item.department &&
      typeof item.department === 'string' &&
      item.department.trim() !== '' &&
      typeof item.mood === 'number' &&
      !isNaN(item.mood)
    )

    // Deduplicate by department name, keeping the last occurrence
    const departmentMap = new Map()
    validData.forEach(item => {
      departmentMap.set(item.department.trim(), {
        ...item,
        department: item.department.trim()
      })
    })

    return Array.from(departmentMap.values())
  }, [data])

  return (
    <EnhancedChart
      title={title}
      description={description}
      data={cleanData}
      loading={loading}
      error={error}
      type="bar"
      icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
    >
      <BarChart data={cleanData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="department"
          stroke="hsl(var(--muted-foreground))"
          tick={{ fontSize: 12 }}
          interval={0}
          angle={cleanData.length > 4 ? -45 : 0}
          textAnchor={cleanData.length > 4 ? 'end' : 'middle'}
          height={cleanData.length > 4 ? 60 : 40}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 10]}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={(value) => value.toString()}
          ticks={[0, 2, 4, 6, 8, 10]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px"
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value, name) => [`${value}/10`, 'Mood Score']}
        />
        <Bar
          dataKey="mood"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </EnhancedChart>
  )
}

export const EngagementChart: React.FC<{
  data: any[]
  loading: boolean
  error: string | null
  title?: string
  description?: string
  timeline?: string
}> = ({ data, loading, error, title = "Engagement Metrics", description = "Response rates and participation over time", timeline = '7d' }) => {
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

  return (
  <EnhancedChart
    title={title}
    description={description}
    data={data}
    loading={loading}
    error={error}
    type="area"
    icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
  >
    <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis
        dataKey="date"
        stroke="hsl(var(--muted-foreground))"
        tick={{ fontSize: 11 }}
        interval={Math.max(0, Math.floor(data.length / 6))}
        angle={-45}
        textAnchor="end"
        height={70}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => {
          if (!value) return '';
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        }}
      />
      <YAxis
        stroke="hsl(var(--muted-foreground))"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        width={60}
        tickFormatter={(value) => `${value}%`}
        domain={[0, 'dataMax']}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          fontSize: "12px"
        }}
        labelStyle={{ color: "hsl(var(--foreground))" }}
        formatter={(value, name) => {
          if (name === 'Response Rate %') return [`${value}%`, name];
          return [value, name];
        }}
      />
      <defs>
        <linearGradient id="responsesGradientHR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
        </linearGradient>
        <linearGradient id="responseRateGradientHR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="responses"
        stroke="#8b5cf6"
        fill="url(#responsesGradientHR)"
        strokeWidth={2.5}
        dot={false}
        name="Responses"
      />
      <Area
        type="monotone"
        dataKey="responseRate"
        stroke="#06b6d4"
        fill="url(#responseRateGradientHR)"
        strokeWidth={2.5}
        dot={false}
        name="Response Rate %"
      />
    </AreaChart>
  </EnhancedChart>
  );
}
