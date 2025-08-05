import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, HRProtectedRoute, AdminProtectedRoute } from "./components/auth/ProtectedRoute";
import { ToastContainer } from "./components/Toast";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import HRDashboard from "./pages/HRDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { schedulingService } from "./services/schedulingService";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Database-level scheduling is now handled by pg_cron
  // Client-side scheduling service is disabled in favor of server-side processing
  useEffect(() => {
    console.log('📋 Using database-level scheduling with pg_cron - client-side scheduler disabled');
  }, []);

  return (
  <ThemeProvider defaultTheme="light" storageKey="staffpulse-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/hr-dashboard"
                element={
                  <HRProtectedRoute>
                    <HRDashboard />
                  </HRProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              {/* Redirect old routes */}
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/register" element={<Navigate to="/auth" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <ToastContainer />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  );
};

export default App;
