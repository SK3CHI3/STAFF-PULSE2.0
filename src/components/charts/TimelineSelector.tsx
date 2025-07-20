import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock } from 'lucide-react'

export type TimelineOption = '7d' | '1m' | '3m' | '6m' | '1y'

interface TimelineSelectorProps {
  value: TimelineOption
  onChange: (value: TimelineOption) => void
  className?: string
}

export const TimelineSelector: React.FC<TimelineSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const timelineOptions = [
    { value: '7d' as TimelineOption, label: 'Last 7 days', icon: Clock },
    { value: '1m' as TimelineOption, label: 'Last month', icon: Calendar },
    { value: '3m' as TimelineOption, label: 'Last 3 months', icon: Calendar },
    { value: '6m' as TimelineOption, label: 'Last 6 months', icon: Calendar },
    { value: '1y' as TimelineOption, label: 'Last year', icon: Calendar },
  ]

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select timeline" />
        </SelectTrigger>
        <SelectContent>
          {timelineOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center space-x-2">
                <option.icon className="w-4 h-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Helper function to get date range from timeline option
export const getDateRange = (timeline: TimelineOption): { startDate: Date; endDate: Date } => {
  const endDate = new Date()
  const startDate = new Date()

  switch (timeline) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '1m':
      startDate.setMonth(endDate.getMonth() - 1)
      break
    case '3m':
      startDate.setMonth(endDate.getMonth() - 3)
      break
    case '6m':
      startDate.setMonth(endDate.getMonth() - 6)
      break
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
  }

  return { startDate, endDate }
}

// Helper function to format dates for database queries
export const formatDateForQuery = (date: Date): string => {
  return date.toISOString()
}

// Helper function to get appropriate date grouping for timeline
export const getDateGrouping = (timeline: TimelineOption): 'day' | 'week' | 'month' => {
  switch (timeline) {
    case '7d':
      return 'day'
    case '1m':
      return 'day'
    case '3m':
      return 'week'
    case '6m':
      return 'week'
    case '1y':
      return 'month'
    default:
      return 'day'
  }
}
