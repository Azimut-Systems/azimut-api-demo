import type { TokenResponse } from '../types/api'

const CREDENTIALS_STORAGE_KEY = 'azimut.credentials'

export interface ClientCredentials {
  clientId: string
  apiKey: string
}

interface TokenState {
  token: string
  expiresAt: number // Unix ms
}

let state: TokenState | null = null
let inflightPromise: Promise<string> | null = null

export class AuthRequiredError extends Error {
  constructor() {
    super('Azimut client credentials are required')
    this.name = 'AuthRequiredError'
  }
}

export async function login(credentials: ClientCredentials): Promise<void> {
  clearToken()
  try {
    await mintToken(credentials)
    storeCredentials(credentials)
  } catch (error) {
    logout()
    throw error
  }
}

export function logout(): void {
  clearToken()
  sessionStorage.removeItem(CREDENTIALS_STORAGE_KEY)
}

export function hasCredentials(): boolean {
  return readCredentials() !== null
}

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

function storeCredentials(credentials: ClientCredentials): void {
  sessionStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials))
}

function readCredentials(): ClientCredentials | null {
  const raw = sessionStorage.getItem(CREDENTIALS_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<ClientCredentials>
    if (!parsed.clientId || !parsed.apiKey) return null
    return {
      clientId: parsed.clientId,
      apiKey: parsed.apiKey,
    }
  } catch {
    return null
  }
}

async function mintToken(credentials = readCredentials()): Promise<string> {
  if (!credentials) throw new AuthRequiredError()

  const baseUrl = ''  // requests go to /v1/... and are proxied by Vite (see vite.config.ts)

  const basicCredentials = btoa(`${credentials.clientId}:${credentials.apiKey}`)
  const res = await fetch(`${baseUrl}/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicCredentials}`,
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
