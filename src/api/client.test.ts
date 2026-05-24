import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, ApiError } from './client'

vi.mock('./auth', () => ({
  getToken: vi.fn().mockResolvedValue('tok_good'),
  clearToken: vi.fn(),
}))

import { getToken, clearToken } from './auth'

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('apiClient.request', () => {
  it('injects Bearer token and returns parsed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      }),
    )

    const result = await apiClient.request('/v1/transits')
    expect(result).toEqual({ data: [] })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/v1/transits',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok_good' }),
      }),
    )
  })

  it('clears token and retries once on 401', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ retried: true }) })
    vi.stubGlobal('fetch', mockFetch)

    const result = await apiClient.request('/v1/transits')
    expect(clearToken).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ retried: true })
  })

  it('throws ApiError on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'not found' }),
      }),
    )

    await expect(apiClient.request('/v1/transits/bad')).rejects.toThrow(ApiError)
    await expect(apiClient.request('/v1/transits/bad')).rejects.toMatchObject({ status: 404 })
  })
})
