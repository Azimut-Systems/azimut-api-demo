import { getToken, clearToken } from './auth'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
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
    if (!retry.ok) throw new ApiError(retry.status, await retry.json().catch(() => null))
    return retry.json()
  }

  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null))
  return res.json()
}

export const apiClient = { request }
