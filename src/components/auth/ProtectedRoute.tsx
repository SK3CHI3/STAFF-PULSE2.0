import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../lib/supabase'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/auth'
}) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  console.log('🛡️ [PROTECTED ROUTE] Checking access:', {
    loading,
    user: user ? 'Present' : 'None',
    profile: profile ? `${profile.role} - ${profile.full_name}` : 'None',
    requiredRole,
    currentPath: location.pathname
  })

  // Show loading spinner while checking auth state
  if (loading) {
    console.log('⏳ [PROTECTED ROUTE] Still loading auth state...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to auth if not logged in
  if (!user) {
    console.log('❌ [PROTECTED ROUTE] No user, redirecting to auth')
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // If user is logged in but profile is not loaded yet, show loading
  if (!profile) {
    console.log('⏳ [PROTECTED ROUTE] User exists but no profile, waiting...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    )
  }

  // Check role-based access
  if (requiredRole && profile.role !== requiredRole) {
    console.log('🚫 [PROTECTED ROUTE] Role mismatch:', {
      required: requiredRole,
      actual: profile.role
    })
    // Redirect based on user's actual role
    const redirectPath = profile.role === 'super_admin' ? '/admin-dashboard' : '/hr-dashboard'
    console.log('↩️ [PROTECTED ROUTE] Redirecting to:', redirectPath)
    return <Navigate to={redirectPath} replace />
  }

  console.log('✅ [PROTECTED ROUTE] Access granted, rendering children')
  return <>{children}</>
}

// Convenience components for specific roles
export const HRProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="hr_manager">
    {children}
  </ProtectedRoute>
)

export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="super_admin">
    {children}
  </ProtectedRoute>
)
