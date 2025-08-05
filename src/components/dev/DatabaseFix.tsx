import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2, Wrench, CheckCircle, AlertTriangle } from 'lucide-react'
import { completeDatabaseFix } from '../../utils/fixDatabase'

interface FixResult {
  success: boolean
  message: string
  error?: string
}

export const DatabaseFix: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FixResult | null>(null)

  const handleFix = async () => {
    setLoading(true)
    setResult(null)

    try {
      const fixResult = await completeDatabaseFix()
      setResult(fixResult)
    } catch (error) {
      setResult({
        success: false,
        message: 'Fix failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Card className="border-2 border-dashed border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-2">
            <Wrench className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-800 dark:text-red-200">
            Fix Signup Database Error
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Remove problematic database triggers causing signup failures
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warning Alert */}
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              This will remove database triggers and handle profile creation in the app code.
            </AlertDescription>
          </Alert>

          {/* Fix Button */}
          <Button
            onClick={handleFix}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fixing database...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4 mr-2" />
                Fix Database Signup Error
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
                  {result.error && (
                    <p className="text-xs font-mono bg-black/10 dark:bg-white/10 p-2 rounded">
                      {result.error}
                    </p>
                  )}
                  {result.success && (
                    <p className="text-xs">
                      ✅ You can now try signing up again. Profile creation will be handled automatically.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Removes problematic database triggers</li>
              <li>Tests if signup works without triggers</li>
              <li>Enables app-based profile creation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DatabaseFix
