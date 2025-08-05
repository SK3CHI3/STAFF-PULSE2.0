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
import { useUnreadReports } from '@/hooks/useUnreadReports';
import { usePlan } from '@/hooks/usePlan';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { useTrialStatus, TrialStatusBanner } from '@/components/TrialStatusBanner';
import { TrialExpiredScreen } from '@/components/TrialExpiredScreen';
import { trialService } from '@/services/trialService';
import { EnhancedPlanCards } from '@/components/EnhancedPlanCards';
import { UpgradeNotice, useUpgradeNotice } from '@/components/UpgradeNotice';
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
  LayoutDashboard,
  UserPlus,
  LineChart,
  Play,
  Pause,
  User,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const HRDashboard = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [currentInsightPage, setCurrentInsightPage] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Handle section changes and mark reports as viewed
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);

    // Mark reports as viewed when reports section is opened
    if (sectionId === "reports") {
      markReportsAsViewed();
    }

    // Mark AI insights as viewed when AI insights section is opened
    if (sectionId === "ai-insights") {
      markInsightsAsViewed();
    }

    // Reinitialize IntaSend when switching to billing section
    if (sectionId === 'billing') {
      setTimeout(() => {
        reinitializeIntaSend();
      }, 100);
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedEmployeeDepartment, setSelectedEmployeeDepartment] = useState("all");
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [employeePage, setEmployeePage] = useState(1);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showViewEmployeeModal, setShowViewEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showViewDepartmentModal, setShowViewDepartmentModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDepartmentData, setSelectedDepartmentData] = useState<any>(null);
  const [showDeleteEmployeeModal, setShowDeleteEmployeeModal] = useState(false);
  const [showDeleteDepartmentModal, setShowDeleteDepartmentModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineOption>('7d');

  // Check-ins state
  const [selectedMessageType, setSelectedMessageType] = useState('professional_psychological');
  const [selectedTargetType, setSelectedTargetType] = useState('all');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [checkInMessage, setCheckInMessage] = useState('Hi {employee_name}, hope you\'re having a good day! 😊 We genuinely care about your wellbeing at {company_name}. Taking a moment to check in with yourself is so important. How are you feeling today? Please reply with:\n\n1️⃣ Your mood (1-10 scale)\n2️⃣ Any comments or thoughts (optional)\n\nExample: "8 - Having a great week, thanks for checking in!"\n\nYour wellbeing matters to us! 💙');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Form state for adding/editing
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced check-ins state
  const [sendMode, setSendMode] = useState<'now' | 'schedule' | 'automate'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [automationFrequency, setAutomationFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [automationDays, setAutomationDays] = useState<string[]>(['monday']);
  const [automationTime, setAutomationTime] = useState('09:00');

  // Message types - only 2 types as requested
  const messageTypes = [
    {
      id: 'professional_psychological',
      name: 'Professional & Human',
      description: 'Thoughtfully crafted message that balances professionalism with genuine care',
      preview: 'Hi [Employee Name], hope you\'re having a good day! 😊 We genuinely care about your wellbeing at [Company Name]. Taking a moment to check in with yourself is so important. How are you feeling today? Please reply with:\n\n1️⃣ Your mood (1-10 scale)\n2️⃣ Any comments or thoughts (optional)\n\nExample: "8 - Having a great week, thanks for checking in!"\n\nYour wellbeing matters to us! 💙',
      editable: false
    },
    {
      id: 'custom',
      name: 'Custom Message',
      description: 'Create your own personalized message with editable placeholders',
      preview: 'Hi {employee_name}, how are you feeling today? Please reply with your mood (1-10) and any comments. Example: "7 - Busy but good day!"',
      editable: true,
      placeholders: ['{employee_name}', '{company_name}', '{organization_name}']
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

  // Unread reports hook
  const { unreadCount, markReportsAsViewed, refreshUnreadCount } = useUnreadReports();

  // Track unread AI insights
  const [unreadInsightsCount, setUnreadInsightsCount] = useState(0);
  const [lastViewedInsights, setLastViewedInsights] = useState<string | null>(null);

  // Get last viewed AI insights timestamp
  const getLastViewedInsightsTimestamp = (): string | null => {
    if (!profile?.organization_id) return null;
    return localStorage.getItem(`ai_insights_last_viewed_${profile.organization_id}`);
  };

  // Mark AI insights as viewed
  const markInsightsAsViewed = (): void => {
    if (!profile?.organization_id) return;
    const timestamp = new Date().toISOString();
    localStorage.setItem(`ai_insights_last_viewed_${profile.organization_id}`, timestamp);
    setUnreadInsightsCount(0);
    setLastViewedInsights(timestamp);
  };

  // Calculate unread insights count
  useEffect(() => {
    if (!aiInsights.insights || aiInsights.insights.length === 0) {
      setUnreadInsightsCount(0);
      return;
    }

    const lastViewed = getLastViewedInsightsTimestamp();
    if (!lastViewed) {
      // If never viewed, all insights are new
      setUnreadInsightsCount(aiInsights.insights.length);
      return;
    }

    // Count insights created after last viewed timestamp
    const lastViewedDate = new Date(lastViewed);
    const newInsights = aiInsights.insights.filter((insight: any) => {
      const insightDate = new Date(insight.created_at);
      return insightDate > lastViewedDate;
    });

    setUnreadInsightsCount(newInsights.length);
  }, [aiInsights.insights, profile?.organization_id]);

  // Refresh unread count when recent responses change
  useEffect(() => {
    if (recentResponses.data && recentResponses.data.length > 0) {
      refreshUnreadCount();
    }
  }, [recentResponses.data?.length]);

  // Plan restrictions hook
  const { currentPlan, canUseFeature, getRestrictionMessage } = usePlan();

  // Payment history hook
  const { payments, loading: paymentsLoading, error: paymentsError } = usePaymentHistory();

  // Trial status hook
  const { trialStatus, isOnTrial, isExpired, isExpiringSoon } = useTrialStatus();

  // Upgrade notice hook
  const { showNotice, noticeProps, showUpgradeNotice, hideUpgradeNotice } = useUpgradeNotice();

  // Function to reinitialize IntaSend when switching to billing section
  const reinitializeIntaSend = () => {
    console.log('🔄 Reinitializing IntaSend for billing section...');

    if (!window.IntaSend) {
      console.log('❌ IntaSend not available, skipping reinitialization');
      return;
    }

    try {
      // Find all payment buttons
      const buttons = document.querySelectorAll('.intaSendPayButton');
      console.log('🔍 Found payment buttons:', buttons.length);

      if (buttons.length === 0) {
        console.log('⚠️ No payment buttons found');
        return;
      }

      // Create a fresh IntaSend instance
      const apiKey = import.meta.env.VITE_INTASEND_PUBLIC_API_KEY || "ISPubKey_test_39c6a0b0-629e-4ac0-94d9-9b9c6e2f8c5a";

      const freshInstance = new window.IntaSend({
        publicAPIKey: apiKey,
        live: false,
        test: true
      });

      // Set up event handlers for the fresh instance
      freshInstance.on("COMPLETE", (results) => {
        console.log("💰 Payment completed (fresh instance):", results);
        // Handle payment completion
        window.location.reload(); // Simple reload for now
      });

      freshInstance.on("FAILED", (results) => {
        console.log("❌ Payment failed (fresh instance):", results);
        alert("Payment failed. Please try again.");
      });

      freshInstance.on("IN-PROGRESS", (results) => {
        console.log("⏳ Payment in progress (fresh instance):", results);
      });

      // Force IntaSend to scan for buttons
      setTimeout(() => {
        if (typeof window.IntaSend.init === 'function') {
          window.IntaSend.init();
        }
        if (typeof window.IntaSend.scan === 'function') {
          window.IntaSend.scan();
        }
      }, 200);

      console.log('✅ IntaSend reinitialized successfully');
    } catch (error) {
      console.error('💥 Error reinitializing IntaSend:', error);
    }
  };

  // IntaSend integration - Fixed implementation
  useEffect(() => {
    console.log('🔄 IntaSend useEffect triggered');

    // Function to initialize IntaSend
    const initializeIntaSend = () => {
      try {
        const apiKey = import.meta.env.VITE_INTASEND_PUBLIC_API_KEY || "ISPubKey_test_39c6a0b0-629e-4ac0-94d9-9b9c6e2f8c5a";
        console.log('🚀 Initializing IntaSend with API key:', apiKey.substring(0, 20) + '...');

        // Initialize IntaSend with proper configuration
        const intaSend = new window.IntaSend({
          publicAPIKey: apiKey,
          live: false, // Set to true for production
          test: true   // Enable test mode
        });

        console.log('✅ IntaSend instance created successfully');

        // Set up event handlers
        intaSend.on("COMPLETE", async (results) => {
          console.log("💰 Payment completed:", results);
          console.log("📊 Payment details:", {
            tracking_id: results.tracking_id,
            api_ref: results.api_ref,
            value: results.value,
            invoice_id: results.invoice_id,
            state: results.state,
            provider: results.provider,
            net_amount: results.net_amount
          });

          // Show immediate success feedback
          const planName = results.api_ref?.split('-')[1] || 'business';
          const amount = results.value || results.net_amount;

          try {
            const requestBody = {
              org_id: profile?.organization_id,
              plan_name: planName,
              payment_ref: results.tracking_id,
              amount: parseFloat(amount)
            };
            console.log('📤 Sending activation request:', requestBody);

            // Show loading state
            const loadingMessage = `Processing payment of KES ${parseFloat(amount).toLocaleString()} for ${planName.charAt(0).toUpperCase() + planName.slice(1)} plan...`;
            console.log('⏳', loadingMessage);

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/activate_plan`, {
              method: 'POST',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            });

            console.log('📥 Activation response status:', response.status);

            if (response.ok) {
              const result = await response.json();
              console.log('✅ Plan activation result:', result);

              // Show detailed success message
              const successTitle = "🎉 Payment Successful!";
              const successMessage = `Plan: ${planName.charAt(0).toUpperCase() + planName.slice(1)}\n` +
                `Amount: KES ${parseFloat(amount).toLocaleString()}\n` +
                `Reference: ${results.tracking_id}\n` +
                `Provider: ${results.provider || 'IntaSend'}\n\n` +
                `Your subscription has been activated. The page will refresh to show your new plan features.`;

              // Use toast notification if available, fallback to alert
              if ((window as any).toast) {
                (window as any).toast.showSuccess(successTitle, successMessage);
              } else {
                alert(`${successTitle}\n\n${successMessage}`);
              }

              // Refresh the page after a short delay
              setTimeout(() => {
                window.location.reload();
              }, 2000);

            } else {
              const errorText = await response.text();
              console.error('❌ Plan activation failed:', errorText);

              let errorDetails;
              try {
                errorDetails = JSON.parse(errorText);
              } catch {
                errorDetails = { message: errorText };
              }

              const errorTitle = "Plan Activation Failed";
              const errorMessage = `Payment received successfully, but there was an issue activating your plan.\n\n` +
                `Payment Reference: ${results.tracking_id}\n` +
                `Error: ${errorDetails.message || 'Unknown error'}\n\n` +
                `Please contact our support team with this reference number.`;

              // Use toast notification if available, fallback to alert
              if ((window as any).toast) {
                (window as any).toast.showError(errorTitle, errorMessage);
              } else {
                alert(errorMessage);
              }
            }
          } catch (error) {
            console.error('💥 Plan activation error:', error);

            const errorTitle = "Technical Issue";
            const errorMessage = `Payment completed successfully, but there was a technical issue.\n\n` +
              `Payment Reference: ${results.tracking_id}\n` +
              `Amount: KES ${parseFloat(amount).toLocaleString()}\n\n` +
              `Please contact our support team with this reference number to activate your plan.`;

            // Use toast notification if available, fallback to alert
            if ((window as any).toast) {
              (window as any).toast.showError(errorTitle, errorMessage);
            } else {
              alert(errorMessage);
            }
          }
        });

        intaSend.on("FAILED", async (results) => {
          console.log("❌ Payment failed:", results);
          console.log("❌ Failure details:", {
            tracking_id: results.tracking_id,
            state: results.state,
            provider: results.provider,
            value: results.value,
            error: results.error,
            message: results.message,
            status: results.status,
            response: results.response
          });

          // Log failed payment to database for tracking
          try {
            if (results.tracking_id && profile?.organization_id) {
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/payments`, {
                method: 'POST',
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  organization_id: profile.organization_id,
                  amount: parseFloat(results.value || '0'),
                  currency: 'KES',
                  payment_ref: results.tracking_id,
                  provider: 'intasend',
                  status: 'failed'
                })
              });

              if (response.ok) {
                console.log('✅ Failed payment logged to database');
              } else {
                console.warn('⚠️ Could not log failed payment to database');
              }
            }
          } catch (error) {
            console.error('💥 Error logging failed payment:', error);
          }

          // Show user-friendly error message
          const errorTitle = "Payment Failed";
          const errorMessage = getPaymentErrorMessage(results);

          // Use toast notification if available, fallback to alert
          if ((window as any).toast) {
            (window as any).toast.showError(errorTitle, errorMessage);
          } else {
            alert(errorMessage);
          }
        });

        intaSend.on("IN-PROGRESS", (results) => {
          console.log("⏳ Payment in progress:", results);
          console.log("📊 Progress details:", {
            tracking_id: results.tracking_id,
            state: results.state,
            provider: results.provider,
            value: results.value
          });

          // Show progress feedback to user
          if (results.provider === 'M-PESA') {
            console.log('📱 M-Pesa STK push sent to user phone');

            // Show progress notification
            if ((window as any).toast) {
              (window as any).toast.showInfo(
                "Payment in Progress",
                "Please check your phone for the M-Pesa payment request and enter your PIN to complete the transaction."
              );
            }
          } else {
            // Generic progress message for other providers
            if ((window as any).toast) {
              (window as any).toast.showInfo(
                "Payment in Progress",
                "Please complete the payment process in the payment window."
              );
            }
          }
        });

        console.log('✅ IntaSend event handlers registered');

        // Validate API key format (client-side only)
        const validateApiKeyFormat = (key: string) => {
          const isValidFormat = /^ISPubKey_(test|live)_[a-f0-9-]{36}$/.test(key);

          if (!isValidFormat) {
            console.warn('IntaSend API Key format appears invalid');
          }

          return isValidFormat;
        };

        // Validate the current API key
        validateApiKeyFormat(apiKey);

        // Network monitoring for IntaSend requests (production-ready)
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const [url, options] = args;

          // Monitor IntaSend API requests for errors only
          if (typeof url === 'string' && url.includes('intasend.com')) {
            console.log('IntaSend API Request:', url);
          }

          const response = await originalFetch(...args);

          // Log IntaSend errors for debugging
          if (typeof url === 'string' && url.includes('intasend.com') && !response.ok) {
            console.error('IntaSend API Error:', {
              url,
              status: response.status,
              statusText: response.statusText
            });

            try {
              const errorText = await response.clone().text();
              console.error('IntaSend Error Details:', errorText);
            } catch (readError) {
              console.error('Could not read IntaSend error response');
            }
          }

          return response;
        };



        // Force IntaSend to rescan for buttons
        const rescanButtons = () => {
          const buttons = document.querySelectorAll('.intaSendPayButton');
          console.log('IntaSend buttons found:', buttons.length);

          // Force IntaSend to re-detect buttons
          if (window.IntaSend && buttons.length > 0) {
            // Try multiple methods to ensure button detection
            if (typeof window.IntaSend.init === 'function') {
              window.IntaSend.init();
            }

            if (typeof window.IntaSend.refresh === 'function') {
              window.IntaSend.refresh();
            }

            if (typeof window.IntaSend.scan === 'function') {
              window.IntaSend.scan();
            }
          }

          return buttons.length;
        };

        // Initial scan
        setTimeout(() => {
          rescanButtons();

          // Get buttons for validation
          const buttons = document.querySelectorAll('.intaSendPayButton');

          // Log button details with validation
          buttons.forEach((btn, index) => {
            const buttonData = {
              className: btn.className,
              amount: btn.getAttribute('data-amount'),
              currency: btn.getAttribute('data-currency'),
              email: btn.getAttribute('data-email'),
              api_ref: btn.getAttribute('data-api_ref'),
              comment: btn.getAttribute('data-comment'),
              first_name: btn.getAttribute('data-first_name'),
              last_name: btn.getAttribute('data-last_name'),
              country: btn.getAttribute('data-country'),
              card_tarrif: btn.getAttribute('data-card_tarrif'),
              mobile_tarrif: btn.getAttribute('data-mobile_tarrif')
            };

            console.log(`🔘 Button ${index + 1}:`, buttonData);

            // Validate required fields
            const requiredFields = ['amount', 'currency', 'email', 'api_ref'];
            const missingFields = requiredFields.filter(field => !buttonData[field as keyof typeof buttonData]);

            if (missingFields.length > 0) {
              console.warn(`⚠️ Button ${index + 1} missing required fields:`, missingFields);
            } else {
              console.log(`✅ Button ${index + 1} has all required fields`);
            }

            // Validate email format
            const email = buttonData.email;
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              console.warn(`⚠️ Button ${index + 1} has invalid email format:`, email);
            }

            // Validate amount is numeric
            const amount = buttonData.amount;
            if (amount && (isNaN(Number(amount)) || Number(amount) <= 0)) {
              console.warn(`⚠️ Button ${index + 1} has invalid amount:`, amount);
            }
          });

          // Try multiple approaches to force IntaSend to detect buttons
          if (window.IntaSend) {
            // Method 1: Try init method
            if (typeof window.IntaSend.init === 'function') {
              console.log('🔄 Method 1: Re-initializing IntaSend buttons...');
              window.IntaSend.init();
            }

            // Method 2: Try refresh method
            if (typeof window.IntaSend.refresh === 'function') {
              console.log('🔄 Method 2: Refreshing IntaSend buttons...');
              window.IntaSend.refresh();
            }

            // Method 3: Try scan method
            if (typeof window.IntaSend.scan === 'function') {
              console.log('🔄 Method 3: Scanning for IntaSend buttons...');
              window.IntaSend.scan();
            }

            // Method 4: Create new instance to force re-scan
            try {
              console.log('🔄 Method 4: Creating new IntaSend instance...');
              const newInstance = new window.IntaSend({
                publicAPIKey: import.meta.env.VITE_INTASEND_PUBLIC_API_KEY || "ISPubKey_test_39c6a0b0-629e-4ac0-94d9-9b9c6e2f8c5a",
                live: false
              });

              // Set up events on new instance
              newInstance.on("COMPLETE", async (results) => {
                console.log("💰 Payment completed (new instance):", results);
                // Same payment completion logic as before
                try {
                  const requestBody = {
                    org_id: profile?.organization_id,
                    plan_name: results.api_ref?.split('-')[1] || 'business',
                    payment_ref: results.tracking_id,
                    amount: results.value
                  };
                  console.log('📤 Sending activation request:', requestBody);

                  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/activate_plan`, {
                    method: 'POST',
                    headers: {
                      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                  });

                  if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Plan activation result:', result);
                    alert("Payment successful! Your plan has been upgraded. Please refresh the page.");
                    window.location.reload();
                  } else {
                    const error = await response.text();
                    console.error('❌ Plan activation failed:', error);
                    alert("Payment received but plan activation failed. Please contact support.");
                  }
                } catch (error) {
                  console.error('💥 Plan activation error:', error);
                  alert("Payment received but plan activation failed. Please contact support.");
                }
              });

              newInstance.on("FAILED", (results) => {
                console.log("❌ Payment failed (new instance):", results);
                alert("Payment failed. Please try again or contact support.");
              });

              newInstance.on("IN-PROGRESS", (results) => {
                console.log("⏳ Payment in progress (new instance):", results);
              });

              console.log('✅ New IntaSend instance created with events');
            } catch (err) {
              console.error('💥 Error creating new IntaSend instance:', err);
            }
          }

          // Note: Manual click handlers removed since CSP issue is fixed
          // IntaSend should now automatically detect and handle button clicks
        }, 1500);

        // Additional scans to ensure buttons are detected
        setTimeout(() => {
          rescanButtons();
        }, 3000);

        setTimeout(() => {
          rescanButtons();
        }, 5000);

        // Set up a periodic check to ensure buttons remain active
        const buttonCheckInterval = setInterval(() => {
          const buttons = document.querySelectorAll('.intaSendPayButton');
          if (buttons.length > 0 && window.IntaSend) {
            // Silently re-initialize to keep buttons active
            if (typeof window.IntaSend.init === 'function') {
              window.IntaSend.init();
            }
          }
        }, 10000); // Check every 10 seconds

        // Store interval ID for cleanup
        (window as any).intaSendButtonCheckInterval = buttonCheckInterval;

        // Set up mutation observer to detect new payment buttons
        const observer = new MutationObserver((mutations) => {
          let shouldRescan = false;

          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  // Check if the added element or its children contain payment buttons
                  if (element.classList?.contains('intaSendPayButton') ||
                      element.querySelector?.('.intaSendPayButton')) {
                    shouldRescan = true;
                  }
                }
              });
            }
          });

          if (shouldRescan) {
            console.log('🔄 New payment buttons detected, rescanning...');
            setTimeout(() => {
              rescanButtons();
            }, 100);
          }
        });

        // Start observing
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Store observer for cleanup
        (window as any).intaSendMutationObserver = observer;

      } catch (error) {
        console.error('💥 Error initializing IntaSend:', error);
        console.log('🔍 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    };

    // Check if script is already loaded
    if (window.IntaSend) {
      console.log('✅ IntaSend already loaded, initializing...');
      initializeIntaSend();
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="intasend-inline"]');
    if (existingScript) {
      console.log('📜 IntaSend script already exists in DOM');
      // Wait for it to load if not already loaded
      if (window.IntaSend) {
        initializeIntaSend();
      } else {
        existingScript.addEventListener('load', () => {
          console.log('📜 Existing script loaded');
          setTimeout(initializeIntaSend, 300);
        });
      }
      return;
    }

    // Load IntaSend script
    console.log('📥 Loading IntaSend script...');
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/intasend-inlinejs-sdk@4.0.7/build/intasend-inline.js';
    script.async = true;
    script.id = 'intasend-script';

    script.addEventListener('load', () => {
      console.log('✅ IntaSend script loaded successfully');
      console.log('🔍 Window.IntaSend after load:', !!window.IntaSend);
      console.log('🔍 Window.IntaSend type:', typeof window.IntaSend);

      // Wait for DOM to be ready and script to fully initialize
      setTimeout(() => {
        if (window.IntaSend) {
          console.log('🚀 Proceeding to initialize IntaSend');
          initializeIntaSend();
        } else {
          console.error('❌ IntaSend not available after script load');
          console.log('🔍 Window object keys:', Object.keys(window).filter(k => k.toLowerCase().includes('inta')));
        }
      }, 500);
    });

    script.addEventListener('error', (error) => {
      console.error('❌ Failed to load IntaSend script:', error);
    });

    document.head.appendChild(script);
    console.log('📜 IntaSend script added to DOM');

    // Cleanup function
    return () => {
      // Clear the button check interval
      if ((window as any).intaSendButtonCheckInterval) {
        clearInterval((window as any).intaSendButtonCheckInterval);
      }

      // Remove the script
      const scriptToRemove = document.getElementById('intasend-script');
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }

      // Restore original fetch if it was modified
      if ((window as any).originalFetch) {
        window.fetch = (window as any).originalFetch;
      }
    };
  }, [profile?.organization_id]);

  // Additional useEffect to handle IntaSend when billing section becomes active
  useEffect(() => {
    if (activeSection === 'billing') {
      console.log('📋 Billing section activated, checking IntaSend...');

      // Wait a bit for the DOM to render the billing section
      const timer = setTimeout(() => {
        if (window.IntaSend) {
          reinitializeIntaSend();
        } else {
          console.log('⚠️ IntaSend not loaded yet, will be handled by main useEffect');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [activeSection]);

  // Check subscription status to determine if user can access dashboard
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!profile?.organization_id) return

      try {
        setCheckingSubscription(true)
        const hasAccess = await trialService.hasActiveSubscription(profile.organization_id)
        setHasActiveSubscription(hasAccess)
      } catch (error) {
        console.error('Error checking subscription status:', error)
        setHasActiveSubscription(false)
      } finally {
        setCheckingSubscription(false)
      }
    }

    checkSubscriptionStatus()

    // Check every 5 minutes for subscription changes
    const interval = setInterval(checkSubscriptionStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [profile?.organization_id])

  // Helper function to get user-friendly payment error messages
  const getPaymentErrorMessage = (results: any): string => {
    const provider = results.provider || 'Payment';
    const trackingId = results.tracking_id || 'Unknown';

    // Common M-Pesa error scenarios
    if (provider === 'M-PESA') {
      if (results.state === 'FAILED') {
        return `M-Pesa payment failed (Ref: ${trackingId}). This could be due to:\n\n• Insufficient funds in your M-Pesa account\n• Cancelled by user\n• Network timeout\n• Invalid phone number\n\nPlease try again or contact support if the issue persists.`;
      }
    }

    // Card payment errors
    if (provider === 'CARD' || results.provider?.includes('CARD')) {
      return `Card payment failed (Ref: ${trackingId}). This could be due to:\n\n• Insufficient funds\n• Card declined by bank\n• Expired card\n• Network issues\n\nPlease check your card details and try again.`;
    }

    // Generic error message
    return `Payment failed (Ref: ${trackingId}). Please try again or contact our support team if the issue persists.\n\nProvider: ${provider}`;
  };

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
    if (!data || data.length < 2) return { trend: 'new', percentage: 0 };

    // Get all data points (including zeros for better trend analysis)
    const allData = data.filter(item => item[key] !== undefined && item[key] !== null);
    if (allData.length < 2) return { trend: 'new', percentage: 0 };

    // Find first and last non-zero values for meaningful comparison
    const nonZeroData = allData.filter(item => item[key] > 0);

    // If we have recent activity but no historical data, show as "new"
    if (nonZeroData.length === 1) {
      const hasRecentActivity = allData.slice(-7).some(item => item[key] > 0); // Last 7 days
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

  // Employee list filtering and pagination
  const employeesPerPage = 5;

  // Filter employees based on search and department
  const filteredEmployees = employeesList.data.filter((employee: any) => {
    const matchesSearch = employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(employeeSearchTerm.toLowerCase());
    const matchesDepartment = selectedEmployeeDepartment === "all" || employee.department === selectedEmployeeDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Calculate pagination for employees
  const totalEmployees = filteredEmployees.length;
  const totalEmployeePages = Math.ceil(totalEmployees / employeesPerPage);
  const employeeStartIndex = (employeePage - 1) * employeesPerPage;
  const employeeEndIndex = employeeStartIndex + employeesPerPage;
  const currentEmployees = filteredEmployees.slice(employeeStartIndex, employeeEndIndex);

  // Handler for adding new employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const employeeData = {
        organization_id: profile.organization_id,
        name: formData.get('emp-name') as string,
        email: formData.get('emp-email') as string,
        phone: formData.get('emp-phone') as string || null,
        department: formData.get('emp-department') as string,
        position: formData.get('emp-position') as string || null,
        manager_id: formData.get('emp-manager') as string || null,
        is_active: true
      };

      const response = await fetch(`${supabaseConfig.url}/rest/v1/employees`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(employeeData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create employee: ${response.status}`);
      }

      setShowAddEmployeeModal(false);
      // Refresh the employees list
      window.location.reload();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for adding new department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const departmentData = {
        organization_id: profile.organization_id,
        name: formData.get('dept-name') as string,
        description: formData.get('dept-description') as string,
        manager_id: formData.get('dept-manager') as string || null
      };

      const response = await fetch(`${supabaseConfig.url}/rest/v1/departments`, {
        method: 'POST',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(departmentData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create department: ${response.status}`);
      }

      setShowAddDepartmentModal(false);
      // Refresh the departments list
      window.location.reload();
    } catch (error) {
      console.error('Error adding department:', error);
      alert('Failed to add department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for updating employee
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee?.id) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const employeeData = {
        name: formData.get('edit-emp-name') as string,
        email: formData.get('edit-emp-email') as string,
        phone: formData.get('edit-emp-phone') as string || null,
        department: formData.get('edit-emp-department') as string,
        position: formData.get('edit-emp-position') as string || null,
        is_active: formData.get('edit-emp-status') === 'active',
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${supabaseConfig.url}/rest/v1/employees?id=eq.${selectedEmployee.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(employeeData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update employee: ${response.status}`);
      }

      setShowEditEmployeeModal(false);
      setSelectedEmployee(null);
      // Refresh the employees list
      window.location.reload();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for updating department
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartmentData?.id) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const departmentData = {
        name: formData.get('edit-dept-name') as string,
        description: formData.get('edit-dept-description') as string,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${supabaseConfig.url}/rest/v1/departments?id=eq.${selectedDepartmentData.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(departmentData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update department: ${response.status}`);
      }

      setShowEditDepartmentModal(false);
      setSelectedDepartmentData(null);
      // Refresh the departments list
      window.location.reload();
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Failed to update department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for showing delete employee confirmation
  const handleDeleteEmployee = (employee: any) => {
    setEmployeeToDelete(employee);
    setShowDeleteEmployeeModal(true);
  };

  // Handler for confirming employee deletion
  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/employees?id=eq.${employeeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Prefer': 'return=minimal'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete employee: ${response.status}`);
      }

      setShowDeleteEmployeeModal(false);
      setEmployeeToDelete(null);
      // Refresh the employees list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for showing delete department confirmation
  const handleDeleteDepartment = (department: any) => {
    setDepartmentToDelete(department);
    setShowDeleteDepartmentModal(true);
  };

  // Handler for confirming department deletion
  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    setIsSubmitting(true);
    try {
      // First delete all employees in the department
      if (departmentToDelete.employee_count > 0) {
        const deleteEmployeesResponse = await fetch(`${supabaseConfig.url}/rest/v1/employees?department=eq.${departmentToDelete.name}&organization_id=eq.${profile?.organization_id}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseConfig.anonKey,
            'Authorization': `Bearer ${supabaseConfig.anonKey}`,
            'Prefer': 'return=minimal'
          }
        });

        if (!deleteEmployeesResponse.ok) {
          throw new Error(`Failed to delete employees: ${deleteEmployeesResponse.status}`);
        }
      }

      // Then delete the department
      const response = await fetch(`${supabaseConfig.url}/rest/v1/departments?id=eq.${departmentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Prefer': 'return=minimal'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete department: ${response.status}`);
      }

      setShowDeleteDepartmentModal(false);
      setDepartmentToDelete(null);
      // Refresh the page to update both departments and employees lists
      window.location.reload();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            <Button
              variant="hero"
              size="sm"
              className="group"
              onClick={() => handleSectionChange('checkins')}
            >
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
                        {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                        <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                          {trend.trend === 'neutral' ? 'Stable' :
                           trend.trend === 'new' ? 'New activity' :
                           `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
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
                        {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                        <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                          {trend.trend === 'neutral' ? 'Stable' :
                           trend.trend === 'new' ? 'New data' :
                           `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'improvement' : 'decline'}`}
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
                        {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                        <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                          {trend.trend === 'neutral' ? 'Stable' :
                           trend.trend === 'new' ? 'New activity' :
                           `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
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
                        {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                        <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                          {trend.trend === 'neutral' ? 'Stable' :
                           trend.trend === 'new' ? 'New activity' :
                           `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
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
                    {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                    <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {trend.trend === 'neutral' ? 'Stable' :
                       trend.trend === 'new' ? 'New data' :
                       `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'improvement' : 'decline'}`}
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
                    {trend.trend === 'up' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                    {trend.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {trend.trend === 'new' && <TrendingUp className="h-3 w-3 text-blue-500" />}
                    <p className={`text-xs ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : trend.trend === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {trend.trend === 'neutral' ? 'Stable' :
                       trend.trend === 'new' ? 'New activity' :
                       `${trend.percentage.toFixed(1)}% ${trend.trend === 'up' ? 'increase' : 'decrease'}`}
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
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">Employee Responses</CardTitle>
              <CardDescription className="text-base">
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



    const handleSendCheckIn = async () => {
      if (selectedMessageType === 'custom' && !checkInMessage.trim()) {
        alert('Please enter a custom check-in message');
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
          message: selectedMessageType === 'custom' ? checkInMessage : '', // Only store custom messages
          message_type: selectedMessageType,
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
        setSelectedMessageType('professional_psychological');
        setCheckInMessage('Hi {employee_name}, hope you\'re having a good day! 😊 We genuinely care about your wellbeing at {company_name}. Taking a moment to check in with yourself is so important. How are you feeling today? Please reply with:\n\n1️⃣ Your mood (1-10 scale)\n2️⃣ Any comments or thoughts (optional)\n\nExample: "8 - Having a great week, thanks for checking in!"\n\nYour wellbeing matters to us! 💙');
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
              <div className="text-xs text-muted-foreground">
                📱 Platform WhatsApp service enabled - just add employee numbers!
              </div>
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

            {/* Message Type Selection */}
            <div className="space-y-3">
              <Label>Message Type</Label>
              <div className="grid grid-cols-1 gap-3">
                {messageTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedMessageType === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    }`}
                    onClick={() => {
                      setSelectedMessageType(type.id);
                      if (type.id === 'custom') {
                        setCheckInMessage('Hi {employee_name}, how are you feeling today? Please reply with your mood (1-10) and any comments. Example: "7 - Busy but good day!"');
                      } else if (type.id === 'professional_psychological') {
                        setCheckInMessage('Hi {employee_name}, hope you\'re having a good day! 😊 We genuinely care about your wellbeing at {company_name}. Taking a moment to check in with yourself is so important. How are you feeling today? Please reply with:\n\n1️⃣ Your mood (1-10 scale)\n2️⃣ Any comments or thoughts (optional)\n\nExample: "8 - Having a great week, thanks for checking in!"\n\nYour wellbeing matters to us! 💙');
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={`message-type-${type.id}`}
                        name="message-type"
                        value={type.id}
                        checked={selectedMessageType === type.id}
                        onChange={(e) => setSelectedMessageType(e.target.value)}
                        className="w-4 h-4 text-blue-600 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{type.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{type.description}</div>
                        <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded border italic">
                          {type.preview}
                        </div>
                        {type.placeholders && (
                          <div className="mt-2 text-xs text-blue-600">
                            Available placeholders: {type.placeholders.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Message Input - Only show for custom message type */}
            {selectedMessageType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="message">Custom Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your custom check-in message..."
                  value={checkInMessage}
                  onChange={(e) => setCheckInMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Use {'{employee_name}'} and {'{company_name}'} placeholders for personalization
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {checkInMessage.length}/1600 characters
                  </p>
                </div>
              </div>
            )}
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

                {/* Message Type Selection for Schedule */}
                <div className="space-y-3">
                  <Label>Message Type</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {messageTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedMessageType === type.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-border hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                        }`}
                        onClick={() => {
                          setSelectedMessageType(type.id);
                          if (type.id === 'custom') {
                            setCheckInMessage('Hi {employee_name}, how are you feeling today? Please reply with your mood (1-10) and any comments. Example: "7 - Busy but good day!"');
                          } else if (type.id === 'professional_psychological') {
                            setCheckInMessage('Hi {employee_name}, hope you\'re having a good day! 😊 We genuinely care about your wellbeing at {company_name}. Taking a moment to check in with yourself is so important. How are you feeling today? Please reply with:\n\n1️⃣ Your mood (1-10 scale)\n2️⃣ Any comments or thoughts (optional)\n\nExample: "8 - Having a great week, thanks for checking in!"\n\nYour wellbeing matters to us! 💙');
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            id={`schedule-message-type-${type.id}`}
                            name="schedule-message-type"
                            value={type.id}
                            checked={selectedMessageType === type.id}
                            onChange={(e) => setSelectedMessageType(e.target.value)}
                            className="w-4 h-4 text-blue-600 mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">{type.name}</div>
                            <div className="text-xs text-muted-foreground mb-2">{type.description}</div>
                            <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded border italic">
                              {type.preview}
                            </div>
                            {type.placeholders && (
                              <div className="mt-2 text-xs text-blue-600">
                                Available placeholders: {type.placeholders.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Message Input for Schedule - Only show for custom message type */}
                {selectedMessageType === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="schedule-message">Custom Message</Label>
                    <Textarea
                      id="schedule-message"
                      placeholder="Enter your custom check-in message..."
                      value={checkInMessage}
                      onChange={(e) => setCheckInMessage(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Use {'{employee_name}'} and {'{company_name}'} placeholders for personalization
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {checkInMessage.length}/1600 characters
                      </p>
                    </div>
                  </div>
                )}


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

                {/* Message Type Selection for Automate */}
                <div className="space-y-3">
                  <Label>Message Type</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {messageTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedMessageType === type.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-border hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                        }`}
                        onClick={() => {
                          setSelectedMessageType(type.id);
                          if (type.id === 'custom') {
                            setCheckInMessage('Hi {employee_name}, how are you feeling today? Please reply with your mood (1-10) and any comments. Example: "7 - Busy but good day!"');
                          } else if (type.id === 'professional_psychological') {
                            setCheckInMessage('Hi {employee_name}, hope you\'re having a good day! 😊 We genuinely care about your wellbeing at {company_name}. Taking a moment to check in with yourself is so important. How are you feeling today? Please reply with:\n\n1️⃣ Your mood (1-10 scale)\n2️⃣ Any comments or thoughts (optional)\n\nExample: "8 - Having a great week, thanks for checking in!"\n\nYour wellbeing matters to us! 💙');
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="radio"
                            id={`automate-message-type-${type.id}`}
                            name="automate-message-type"
                            value={type.id}
                            checked={selectedMessageType === type.id}
                            onChange={(e) => setSelectedMessageType(e.target.value)}
                            className="w-4 h-4 text-purple-600 mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">{type.name}</div>
                            <div className="text-xs text-muted-foreground mb-2">{type.description}</div>
                            <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded border italic">
                              {type.preview}
                            </div>
                            {type.placeholders && (
                              <div className="mt-2 text-xs text-purple-600">
                                Available placeholders: {type.placeholders.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Message Input for Automate - Only show for custom message type */}
                {selectedMessageType === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="automate-message">Custom Message</Label>
                    <Textarea
                      id="automate-message"
                      placeholder="Enter your custom check-in message..."
                      value={checkInMessage}
                      onChange={(e) => setCheckInMessage(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Use {'{employee_name}'} and {'{company_name}'} placeholders for personalization
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {checkInMessage.length}/1600 characters
                      </p>
                    </div>
                  </div>
                )}


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
      {/* AI Insights Header - Consistent with other sections */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
            <p className="text-sm text-muted-foreground">AI-powered team wellness analysis</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              // Check if trying to generate team insights without permission
              if (!canUseFeature('aiInsights')) {
                showUpgradeNotice({
                  featureName: 'Team AI Insights',
                  currentPlan: currentPlan?.name || 'Current',
                  requiredPlan: 'Business',
                  description: 'Get AI-powered insights about your team\'s wellness, mood trends, and actionable recommendations to improve employee satisfaction.'
                })
                return
              }

              // If we're here, user has at least Business plan for team insights
              // Employee insights scope is already locked at the button level
              aiInsights.generateNewInsights(aiInsights.selectedEmployee || undefined)
            }}
            disabled={aiInsights.generating}
            className="bg-purple-600 hover:bg-purple-700 text-white"
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
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Insights Filters and Controls - Improved */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Top Row - Scope Selection */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3">
                <Label className="text-sm font-medium text-gray-700">Analysis Scope:</Label>
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => aiInsights.setScope('organization')}
                    className={`${
                      aiInsights.scope === 'organization'
                        ? 'bg-white shadow-sm text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <Building className="w-4 h-4 mr-1" />
                    Team Insights
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!canUseFeature('employeeInsights')) {
                        showUpgradeNotice({
                          featureName: 'Employee AI Insights',
                          currentPlan: currentPlan?.name || 'Current',
                          requiredPlan: 'Enterprise',
                          description: 'Get personalized AI insights for individual employees including wellness trends, performance indicators, and personalized recommendations.'
                        })
                        return
                      }
                      aiInsights.setScope('individual')
                    }}
                    className={`${
                      aiInsights.scope === 'individual'
                        ? 'bg-white shadow-sm text-gray-900 font-medium'
                        : canUseFeature('employeeInsights')
                        ? 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                        : 'text-gray-400 hover:bg-gray-200 cursor-pointer'
                    } relative`}
                  >
                    <User className="w-4 h-4 mr-1" />
                    Employee Insights
                    {!canUseFeature('employeeInsights') && (
                      <Lock className="w-3 h-3 ml-1 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Employee Selector - Only show for Employee Insights with Enterprise access */}
              {aiInsights.scope === 'individual' && canUseFeature('employeeInsights') && (
                <div className="flex items-center space-x-3">
                  <Label className="text-sm font-medium text-gray-700">Employee:</Label>
                  <select
                    value={aiInsights.selectedEmployee || ''}
                    onChange={(e) => aiInsights.setSelectedEmployee(e.target.value || null)}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm min-w-[200px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">All Employees</option>
                    {aiInsights.employees.map((emp: any) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.employee_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bottom Row - Stats and Info */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  {aiInsights.insights.length} insights generated
                </span>
                {aiInsights.scope === 'individual' && aiInsights.selectedEmployee && (
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {aiInsights.employees.find((e: any) => e.employee_id === aiInsights.selectedEmployee)?.employee_name}
                  </span>
                )}
                {aiInsights.scope === 'organization' && (
                  <span className="flex items-center">
                    <Building className="w-3 h-3 mr-1" />
                    Team-level insights
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
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
          {/* Insights Summary - Professional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {aiInsights.insights.filter((i: any) => i.insight_type === 'summary' || i.insight_type === 'personal_insight').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Assessments</div>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {aiInsights.insights.filter((i: any) => i.insight_type === 'recommendation').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Recommendations</div>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {aiInsights.insights.filter((i: any) => i.insight_type === 'risk_alert').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Risk Alerts</div>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {aiInsights.insights.filter((i: any) => i.insight_type === 'trend_analysis').length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Trend Analysis</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights - Professional Paginated View */}
          {(() => {
            const currentInsight = aiInsights.insights[currentInsightPage];
            const totalInsights = aiInsights.insights.length;

            if (totalInsights === 0) return null;

            return (
              <div className="space-y-6">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          AI Wellness Report
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(currentInsight.created_at).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(currentInsight.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{Math.round(currentInsight.confidence_score * 100)}% Confidence</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Report {currentInsightPage + 1} of {totalInsights}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentInsightPage(Math.max(0, currentInsightPage - 1))}
                          disabled={currentInsightPage === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentInsightPage(Math.min(totalInsights - 1, currentInsightPage + 1))}
                          disabled={currentInsightPage === totalInsights - 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                <Card className="bg-white dark:bg-gray-900 border-0 shadow-lg">
                  <CardContent className="p-8">
                    {/* Report Type Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <Badge
                        variant={
                          currentInsight.priority === 'critical' ? 'destructive' :
                          currentInsight.priority === 'high' ? 'default' :
                          currentInsight.priority === 'medium' ? 'secondary' : 'outline'
                        }
                        className="text-sm px-3 py-1"
                      >
                        {currentInsight.priority} Priority
                      </Badge>

                      {currentInsight.scope === 'individual' && (
                        <Badge variant="outline" className="text-sm">
                          <User className="w-3 h-3 mr-1" />
                          Individual Analysis
                        </Badge>
                      )}
                    </div>

                    {/* Report Content */}
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="text-base leading-relaxed space-y-6">
                        {currentInsight.content
                          // Remove all markdown headers and numbers
                          .replace(/### \d+\. /g, '')
                          .replace(/### /g, '')
                          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** bold formatting
                          .replace(/---[\s\S]*$/g, '') // Remove everything after ---

                          // Split into sections and clean up
                          .split('\n')
                          .filter(line => line.trim() !== '' && !line.includes('---'))
                          .map((line, index) => {
                            const trimmedLine = line.trim();

                            // Skip empty lines
                            if (!trimmedLine) return null;

                            // Section headers (like "Overall Wellness Assessment")
                            if (trimmedLine.match(/^[A-Z][a-zA-Z\s]+:?$/) && !trimmedLine.includes('-')) {
                              return (
                                <div key={index} className="font-bold text-lg text-gray-800 dark:text-gray-200 mt-8 mb-4 pb-3 border-b-2 border-blue-200 dark:border-blue-700">
                                  {trimmedLine.replace(':', '')}
                                </div>
                              );
                            }

                            // Bullet points
                            if (trimmedLine.startsWith('-')) {
                              return (
                                <div key={index} className="flex items-start space-x-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <span className="text-blue-500 font-bold mt-1 text-lg">•</span>
                                  <span className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {trimmedLine.substring(1).trim()}
                                  </span>
                                </div>
                              );
                            }

                            // Regular paragraphs
                            return (
                              <p key={index} className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-base">
                                {trimmedLine}
                              </p>
                            );
                          })
                          .filter(Boolean)
                        }
                      </div>
                    </div>

                    {/* Report Footer */}
                    <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {currentInsight.data_period_start && currentInsight.data_period_end
                                ? `Data Period: ${new Date(currentInsight.data_period_start).toLocaleDateString()} - ${new Date(currentInsight.data_period_end).toLocaleDateString()}`
                                : 'Recent data analysis'
                              }
                            </span>
                          </div>
                          {currentInsight.employee_name && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{currentInsight.employee_name} ({currentInsight.department})</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => {
                            import('../utils/exportUtils').then(({ exportSingleInsight }) => {
                              exportSingleInsight(currentInsight)
                            })
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
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

      {/* Enhanced Plan Cards */}
      <EnhancedPlanCards />





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
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Building className="w-5 h-5 text-blue-500" />
                <span>Department Management</span>
              </CardTitle>
              <CardDescription className="text-base">Manage departments and their employees</CardDescription>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDepartmentData(department);
                          setShowViewDepartmentModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDepartmentData(department);
                          setShowEditDepartmentModal(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDepartment(department)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
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
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Users className="w-5 h-5 text-green-500" />
                <span>Employee Directory</span>
              </CardTitle>
              <CardDescription className="text-base">Manage individual employees and their information</CardDescription>
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
            <Input
              placeholder="Search employees..."
              className="flex-1"
              value={employeeSearchTerm}
              onChange={(e) => {
                setEmployeeSearchTerm(e.target.value);
                setEmployeePage(1); // Reset to first page when searching
              }}
            />
            <Select value={selectedEmployeeDepartment} onValueChange={(value) => {
              setSelectedEmployeeDepartment(value);
              setEmployeePage(1); // Reset to first page when filtering
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentsList.data.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.name}>
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
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {employeesList.data.length === 0
                    ? "No employees found. Add your first employee to get started."
                    : "No employees match your search criteria."
                  }
                </p>
              </div>
            ) : (
              currentEmployees.map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">{employee.initials}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.email} • {employee.department || 'No Department'}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowViewEmployeeModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowEditEmployeeModal(true);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              {totalEmployees === 0 ? (
                "No employees to display"
              ) : (
                `Showing ${employeeStartIndex + 1}-${Math.min(employeeEndIndex, totalEmployees)} of ${totalEmployees} employees`
              )}
            </p>
            {totalEmployeePages > 1 && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEmployeePage(Math.max(1, employeePage - 1))}
                  disabled={employeePage === 1}
                >
                  Previous
                </Button>

                {/* Page numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalEmployeePages) }, (_, i) => {
                    let pageNum;
                    if (totalEmployeePages <= 5) {
                      pageNum = i + 1;
                    } else if (employeePage <= 3) {
                      pageNum = i + 1;
                    } else if (employeePage >= totalEmployeePages - 2) {
                      pageNum = totalEmployeePages - 4 + i;
                    } else {
                      pageNum = employeePage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={employeePage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEmployeePage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEmployeePage(Math.min(totalEmployeePages, employeePage + 1))}
                  disabled={employeePage === totalEmployeePages}
                >
                  Next
                </Button>
              </div>
            )}
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

  // Generate dynamic sidebar items with real counts
  const getDynamicHRDashboardItems = () => {
    return [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        active: activeSection === "overview"
      },
      {
        id: "employee-management",
        label: "Employee Management",
        icon: Users,
        active: activeSection === "employee-management"
      },
      {
        id: "checkins",
        label: "Send Check-ins",
        icon: MessageSquare,
        active: activeSection === "checkins"
      },
      {
        id: "reports",
        label: "Team Reports",
        icon: FileText,
        badge: unreadCount > 0 ? unreadCount.toString() : undefined,
        active: activeSection === "reports"
      },
      {
        id: "analytics",
        label: "Team Analytics",
        icon: BarChart3,
        active: activeSection === "analytics"
      },
      {
        id: "ai-insights",
        label: "AI Insights",
        icon: Brain,
        badge: unreadInsightsCount > 0 ? unreadInsightsCount.toString() : (aiInsights.insights.length > 0 ? undefined : "New"),
        active: activeSection === "ai-insights"
      },
      {
        id: "billing",
        label: "Billing",
        icon: CreditCard,
        active: activeSection === "billing"
      },
      {
        id: "feedback",
        label: "Send Feedback",
        icon: Shield,
        active: activeSection === "feedback"
      }
    ];
  };

  // Show loading while checking subscription
  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show trial expired screen if no active subscription
  if (!hasActiveSubscription) {
    return (
      <TrialExpiredScreen
        onUpgradeClick={() => {
          // For now, just redirect to billing section
          // In a real app, this would open a payment modal or redirect to Stripe
          setHasActiveSubscription(true) // Temporary for demo
          setActiveSection('billing')
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gradient-dashboard">
      {/* Modern Sidebar */}
      <ModernSidebar
        items={getDynamicHRDashboardItems()}
        activeItem={activeSection}
        onItemClick={handleSectionChange}
        onSettingsClick={() => handleSectionChange("settings")}
        userInfo={{
          name: profile?.full_name || "User",
          email: user?.email || "user@company.com",
          role: profile?.role === 'hr_manager' ? "HR Manager" : "Super Admin"
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Trial Status Banner */}
            <TrialStatusBanner
              onUpgradeClick={() => setActiveSection('billing')}
              showDismiss={true}
            />

            {renderContent()}
          </div>
        </div>
      </div>

      {/* View Employee Modal */}
      {showViewEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>Employee Details</span>
                  </CardTitle>
                  <CardDescription>View employee information</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewEmployeeModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="p-3 bg-muted rounded-md">{selectedEmployee.name}</div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="p-3 bg-muted rounded-md">{selectedEmployee.email}</div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="p-3 bg-muted rounded-md">{selectedEmployee.phone || 'Not provided'}</div>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <div className="p-3 bg-muted rounded-md">{selectedEmployee.department}</div>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <div className="p-3 bg-muted rounded-md">{selectedEmployee.position || 'Not specified'}</div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <Badge variant={selectedEmployee.is_active ? "default" : "outline"}>
                      {selectedEmployee.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewEmployeeModal(false);
                    setShowEditEmployeeModal(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Employee
                </Button>
                <Button variant="outline" onClick={() => setShowViewEmployeeModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              <form onSubmit={handleAddEmployee}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="emp-name">Full Name</Label>
                    <Input id="emp-name" name="emp-name" placeholder="John Mwangi" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-email">Email Address</Label>
                    <Input id="emp-email" name="emp-email" type="email" placeholder="john.mwangi@company.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-phone">Phone Number</Label>
                    <Input id="emp-phone" name="emp-phone" placeholder="+254712345678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-department">Department</Label>
                    <select
                      id="emp-department"
                      name="emp-department"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="">Select department</option>
                      {departmentsList.data.map((department: any) => (
                        <option key={department.id} value={department.name}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-position">Position</Label>
                    <Input id="emp-position" name="emp-position" placeholder="Software Engineer" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-manager">Manager</Label>
                    <select
                      id="emp-manager"
                      name="emp-manager"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="">Select manager (optional)</option>
                      {employeesList.data.filter((emp: any) => emp.is_active).map((employee: any) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <Label htmlFor="emp-notes">Notes (Optional)</Label>
                  <textarea
                    id="emp-notes"
                    name="emp-notes"
                    className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Additional notes about the employee..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Adding...' : 'Add Employee'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddEmployeeModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>Edit Employee</span>
                  </CardTitle>
                  <CardDescription>Update employee information</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditEmployeeModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleUpdateEmployee}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-emp-name">Full Name</Label>
                    <Input id="edit-emp-name" name="edit-emp-name" defaultValue={selectedEmployee.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-emp-email">Email Address</Label>
                    <Input id="edit-emp-email" name="edit-emp-email" type="email" defaultValue={selectedEmployee.email} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-emp-phone">Phone Number</Label>
                    <Input id="edit-emp-phone" name="edit-emp-phone" defaultValue={selectedEmployee.phone || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-emp-department">Department</Label>
                    <select
                      id="edit-emp-department"
                      name="edit-emp-department"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      defaultValue={selectedEmployee.department}
                      required
                    >
                      <option value="">Select department</option>
                      {departmentsList.data.map((department: any) => (
                        <option key={department.id} value={department.name}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-emp-position">Position</Label>
                    <Input id="edit-emp-position" name="edit-emp-position" defaultValue={selectedEmployee.position || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-emp-status">Status</Label>
                    <select
                      id="edit-emp-status"
                      name="edit-emp-status"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      defaultValue={selectedEmployee.is_active ? 'active' : 'inactive'}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    <Settings className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Updating...' : 'Update Employee'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowEditEmployeeModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
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
              <form onSubmit={handleAddDepartment}>
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name">Department Name</Label>
                    <Input id="dept-name" name="dept-name" placeholder="Customer Success" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-description">Description</Label>
                    <textarea
                      id="dept-description"
                      name="dept-description"
                      className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Brief description of the department's role and responsibilities..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-manager">Department Head</Label>
                    <select
                      id="dept-manager"
                      name="dept-manager"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="">Select department head (optional)</option>
                      {employeesList.data.filter((emp: any) => emp.is_active).map((employee: any) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Department'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddDepartmentModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Department Modal */}
      {showViewDepartmentModal && selectedDepartmentData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-blue-500" />
                    <span>Department Details</span>
                  </CardTitle>
                  <CardDescription>View department information</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewDepartmentModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department Name</Label>
                  <div className="p-3 bg-muted rounded-md">{selectedDepartmentData.name}</div>
                </div>
                <div className="space-y-2">
                  <Label>Employee Count</Label>
                  <div className="p-3 bg-muted rounded-md">{selectedDepartmentData.employee_count} employees</div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <div className="p-3 bg-muted rounded-md">{selectedDepartmentData.description || 'No description available'}</div>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDepartmentModal(false);
                    setShowEditDepartmentModal(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Department
                </Button>
                <Button variant="outline" onClick={() => setShowViewDepartmentModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDepartmentModal && selectedDepartmentData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-purple-500" />
                    <span>Edit Department</span>
                  </CardTitle>
                  <CardDescription>Update department information</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDepartmentModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleUpdateDepartment}>
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dept-name">Department Name</Label>
                    <Input id="edit-dept-name" name="edit-dept-name" defaultValue={selectedDepartmentData.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dept-description">Description</Label>
                    <textarea
                      id="edit-dept-description"
                      name="edit-dept-description"
                      className="w-full min-h-[80px] px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      defaultValue={selectedDepartmentData.description || ''}
                      placeholder="Brief description of the department's role and responsibilities..."
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    <Settings className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Updating...' : 'Update Department'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowEditDepartmentModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {showDeleteEmployeeModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Employee</span>
                  </CardTitle>
                  <CardDescription>This action cannot be undone</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteEmployeeModal(false);
                    setEmployeeToDelete(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Delete {employeeToDelete.name}?
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    This will permanently remove this employee from your organization. All associated data will be lost.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Employee:</strong> {employeeToDelete.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {employeeToDelete.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Department:</strong> {employeeToDelete.department}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmDeleteEmployee}
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Deleting...' : 'Delete Employee'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteEmployeeModal(false);
                    setEmployeeToDelete(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Department Confirmation Modal */}
      {showDeleteDepartmentModal && departmentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-card border-0 shadow-soft w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Department</span>
                  </CardTitle>
                  <CardDescription>This action cannot be undone</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteDepartmentModal(false);
                    setDepartmentToDelete(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Delete {departmentToDelete.name}?
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {departmentToDelete.employee_count > 0 ? (
                      <>This will permanently delete the department AND all {departmentToDelete.employee_count} employees in it. This action cannot be undone.</>
                    ) : (
                      <>This will permanently remove this department from your organization.</>
                    )}
                  </p>
                </div>
              </div>

              {departmentToDelete.employee_count > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <h5 className="font-semibold text-orange-800 dark:text-orange-200">
                      Employees that will be deleted:
                    </h5>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    All {departmentToDelete.employee_count} employees in this department will be permanently removed from the system, including their profiles, data, and history.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Department:</strong> {departmentToDelete.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Employees:</strong> {departmentToDelete.employee_count}
                </p>
                {departmentToDelete.description && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Description:</strong> {departmentToDelete.description}
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmDeleteDepartment}
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Deleting...' : (
                    departmentToDelete.employee_count > 0
                      ? `Delete Department & ${departmentToDelete.employee_count} Employees`
                      : 'Delete Department'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDepartmentModal(false);
                    setDepartmentToDelete(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Notice Modal */}
      {showNotice && (
        <UpgradeNotice
          {...noticeProps as any}
          onUpgrade={() => {
            hideUpgradeNotice()
            setActiveSection('billing')
          }}
          onClose={hideUpgradeNotice}
        />
      )}

    </div>
  );
};

export default HRDashboard;
