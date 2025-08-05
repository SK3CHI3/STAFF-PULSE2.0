import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { seedSuperAdmin } from '../../utils/seedSuperAdmin'

interface SeedResult {
  success: boolean
  message: string
  existing?: boolean
  credentials?: { email: string; password: string }
  error?: string
}

export const SuperAdminSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)
  const [formData, setFormData] = useState({
    email: 'admin@staffpulse.com',
    password: 'SuperAdmin123!',
    fullName: 'Super Administrator'
  })

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)

    try {
      const seedResult = await seedSuperAdmin(
        formData.email,
        formData.password,
        formData.fullName
      )
      setResult(seedResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card className="border-2 border-dashed border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-amber-800 dark:text-amber-200">
            Super Admin Seeder
          </CardTitle>
          <CardDescription className="text-amber-600 dark:text-amber-400">
            Create the initial super admin account for the platform
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warning Alert */}
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              This should only be used during initial setup. Only one super admin is allowed.
            </AlertDescription>
          </Alert>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="admin@staffpulse.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Strong password"
              />
            </div>

            <div>
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Super Administrator"
              />
            </div>
          </div>

          {/* Seed Button */}
          <Button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Super Admin...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Create Super Admin
              </>
            )}
          </Button>

          {/* Result Display */}
          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  {result.credentials && (
                    <div className="text-xs bg-white/50 dark:bg-black/20 p-2 rounded border">
                      <p><strong>Email:</strong> {result.credentials.email}</p>
                      <p><strong>Password:</strong> {result.credentials.password}</p>
                      <p className="text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ Please change the password after first login!
                      </p>
                    </div>
                  )}
                  {result.error && (
                    <p className="text-xs">{result.error}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SuperAdminSeeder
