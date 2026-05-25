import type { TokenResponse } from '../types/api'

interface TokenState {
  token: string
  expiresAt: number // Unix ms
}

let state: TokenState | null = null
let inflightPromise: Promise<string> | null = null

export async function getToken(): Promise<string> {
  if (state && Date.now() < state.expiresAt) return state.token
  if (inflightPromise) return inflightPromise
  inflightPromise = mintToken().finally(() => {
    inflightPromise = null
  })
  return inflightPromise
}

export function clearToken(): void {
  state = null
  inflightPromise = null
}

async function mintToken(): Promise<string> {
  const clientId = import.meta.env.VITE_CLIENT_ID
  const clientSecret = import.meta.env.VITE_CLIENT_SECRET
  const baseUrl = ''  // requests go to /v1/... and are proxied by Vite (see vite.config.ts)

  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(`${baseUrl}/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`Failed to mint token: ${res.status}`)

  const data: TokenResponse = await res.json()
  // Refresh 60 s before actual expiry so requests never race the deadline
  state = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return state.token
}
