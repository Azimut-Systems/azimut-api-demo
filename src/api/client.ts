import { getToken, clearToken, logout } from './auth'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`API error ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = ''  // requests go to /v1/... and are proxied by Vite (see vite.config.ts)
  const token = await getToken()

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers },
  })

  if (res.status === 401) {
    clearToken()
    const freshToken = await getToken()
    const retry = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${freshToken}`, ...options?.headers },
    })
    if (!retry.ok) {
      if (retry.status === 401) logout()
      throw new ApiError(retry.status, await retry.json().catch(() => null))
    }
    return retry.json()
  }

  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null))
  return res.json()
}

export const apiClient = { request }
