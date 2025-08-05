import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2, Database, CheckCircle, AlertTriangle, Wrench } from 'lucide-react'
import { initializeDatabase, createMissingProfiles } from '../../utils/setupDatabase'
import { seedSuperAdmin } from '../../utils/seedSuperAdmin'

interface SetupResult {
  success: boolean
  message: string
  profilesCreated?: number
  error?: string
}

export const DatabaseSetup: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SetupResult | null>(null)

  const handleDatabaseSetup = async () => {
    setLoading(true)
    setResult(null)

    try {
      const setupResult = await initializeDatabase()
      
      if (setupResult.success) {
        setResult({
          success: true,
          message: `Database setup completed successfully! Created ${setupResult.profilesCreated || 0} missing profiles.`,
          profilesCreated: setupResult.profilesCreated
        })
      } else {
        setResult({
          success: false,
          message: 'Database setup failed',
          error: setupResult.error?.message || 'Unknown error'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Database setup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRepairProfiles = async () => {
    setLoading(true)
    setResult(null)

    try {
      const repairResult = await createMissingProfiles()
      
      if (repairResult.success) {
        setResult({
          success: true,
          message: `Profile repair completed! Created ${repairResult.created || 0} missing profiles.`,
          profilesCreated: repairResult.created
        })
      } else {
        setResult({
          success: false,
          message: 'Profile repair failed',
          error: repairResult.error?.message || 'Unknown error'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Profile repair failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSuperAdmin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const seedResult = await seedSuperAdmin()
      
      if (seedResult.success) {
        setResult({
          success: true,
          message: seedResult.existing 
            ? 'Super admin already exists' 
            : 'Super admin created successfully! Check console for credentials.'
        })
      } else {
        setResult({
          success: false,
          message: 'Super admin creation failed',
          error: seedResult.error || 'Unknown error'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Super admin creation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            Database Setup & Repair
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Fix signup issues and setup database triggers
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warning Alert */}
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Use these tools to fix database issues and setup automatic profile creation.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleDatabaseSetup}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up database...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Complete Database Setup
                </>
              )}
            </Button>

            <Button
              onClick={handleRepairProfiles}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Repairing profiles...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Repair Missing Profiles
                </>
              )}
            </Button>

            <Button
              onClick={handleCreateSuperAdmin}
              disabled={loading}
              variant="outline"
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating super admin...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Super Admin
                </>
              )}
            </Button>
          </div>

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
                  {result.profilesCreated !== undefined && (
                    <p className="text-xs">Profiles created: {result.profilesCreated}</p>
                  )}
                  {result.error && (
                    <p className="text-xs font-mono bg-black/10 dark:bg-white/10 p-2 rounded">
                      {result.error}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Complete Database Setup:</strong> Sets up triggers and repairs all issues</p>
            <p><strong>Repair Missing Profiles:</strong> Creates profiles for users who signed up before triggers</p>
            <p><strong>Create Super Admin:</strong> Creates the initial super admin account</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DatabaseSetup
