import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getToken, clearToken } from './auth'

const MOCK_ENV = {
  VITE_CLIENT_ID: 'test-id',
  VITE_CLIENT_SECRET: 'test-secret',
  VITE_API_BASE_URL: 'http://localhost:8080',
}

function mockSuccessfulTokenFetch(expiresIn = 3600) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'tok_abc123',
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope: 'transits:read',
      }),
    }),
  )
}

beforeEach(() => {
  Object.entries(MOCK_ENV).forEach(([k, v]) => vi.stubEnv(k, v))
  clearToken()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('getToken', () => {
  it('mints a token on first call', async () => {
    mockSuccessfulTokenFetch()
    const token = await getToken()
    expect(token).toBe('tok_abc123')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('returns cached token on second call without hitting the network', async () => {
    mockSuccessfulTokenFetch()
    await getToken()
    await getToken()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('deduplicates concurrent inflight requests', async () => {
    mockSuccessfulTokenFetch()
    const [a, b] = await Promise.all([getToken(), getToken()])
    expect(a).toBe('tok_abc123')
    expect(b).toBe('tok_abc123')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('throws when the token endpoint returns non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    )
    await expect(getToken()).rejects.toThrow('Failed to mint token: 401')
  })
})

describe('clearToken', () => {
  it('forces a fresh mint on the next call', async () => {
    mockSuccessfulTokenFetch()
    await getToken()
    clearToken()
    await getToken()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
