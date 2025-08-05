import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CreditCard, Download, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePaymentHistory } from '@/hooks/usePaymentHistory'
import { subscriptionService } from '@/services/subscriptionService'
import { usageService } from '@/services/usageService'
import type { Payment } from '@/lib/supabase'

interface SubscriptionEvent {
  id: string
  event_type: string
  from_plan?: string
  to_plan?: string
  amount?: number
  currency?: string
  details?: any
  created_at: string
}

export const PaymentHistoryDashboard: React.FC = () => {
  const { profile } = useAuth()
  const { payments, loading: paymentsLoading } = usePaymentHistory()
  const [subscriptionEvents, setSubscriptionEvents] = useState<SubscriptionEvent[]>([])
  const [usageSummary, setUsageSummary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.organization_id) return

      try {
        setLoading(true)
        
        // Fetch subscription events
        const events = await subscriptionService.getSubscriptionHistory(profile.organization_id)
        setSubscriptionEvents(events)

        // Fetch usage summary
        const usage = await usageService.getCurrentUsage(profile.organization_id)
        setUsageSummary(usage)
      } catch (error) {
        console.error('Error fetching payment dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [profile?.organization_id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || paymentsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment & Billing</h2>
          <p className="text-muted-foreground">Manage your subscription and view payment history</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="subscription">Subscription Events</TabsTrigger>
          <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                View all your payment transactions and receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No payments found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment: Payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <p className="font-medium">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Ref: {payment.payment_ref}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatDate(payment.created_at)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            via {payment.provider}
                          </p>
                        </div>
                        {getStatusBadge(payment.status)}
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Subscription Events
              </CardTitle>
              <CardDescription>
                Track all changes to your subscription plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No subscription events found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptionEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">
                          {event.event_type.replace('_', ' ')}
                        </p>
                        {event.from_plan && event.to_plan && (
                          <p className="text-sm text-muted-foreground">
                            {event.from_plan} → {event.to_plan}
                          </p>
                        )}
                        {event.amount && (
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(event.amount, event.currency)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDate(event.created_at)}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage & Billing</CardTitle>
              <CardDescription>
                Monitor your feature usage and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageSummary.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No usage data available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {usageSummary.map((usage) => (
                    <Card key={usage.feature_type}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {usage.feature_type.replace('_', ' ')}
                            </p>
                            <p className="text-2xl font-bold">
                              {usage.total_usage.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              This month
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
