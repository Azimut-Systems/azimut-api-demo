import type { FormEvent } from 'react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login, hasCredentials } from '../api/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

interface LocationState {
  from?: {
    pathname?: string
    search?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [clientId, setClientId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (hasCredentials()) return <Navigate to="/" replace />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({
        clientId: clientId.trim(),
        apiKey,
      })
      const state = location.state as LocationState | null
      const from = state?.from?.pathname
        ? `${state.from.pathname}${state.from.search ?? ''}`
        : '/'
      navigate(from, { replace: true })
    } catch {
      setError('Could not sign in with those credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-muted/20 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-muted-foreground">Azimut</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Sign in</h1>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Client ID
            <Input
              autoComplete="username"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            API key
            <Input
              autoComplete="current-password"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              required
            />
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </section>
    </main>
  )
}
