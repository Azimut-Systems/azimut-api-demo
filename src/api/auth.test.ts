import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AuthRequiredError,
  clearToken,
  getToken,
  hasCredentials,
  login,
  logout,
} from './auth'

const CREDENTIALS = {
  clientId: 'test-id',
  apiKey: 'test-secret',
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
  sessionStorage.clear()
  clearToken()
})

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
  clearToken()
})

describe('login', () => {
  it('mints a token with runtime credentials and stores them after success', async () => {
    mockSuccessfulTokenFetch()

    await login(CREDENTIALS)

    expect(hasCredentials()).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      '/v1/oauth/token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Basic ${btoa('test-id:test-secret')}`,
        }),
      }),
    )
  })

  it('clears credentials when the token endpoint rejects them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    )

    await expect(login(CREDENTIALS)).rejects.toThrow('Failed to mint token: 401')
    expect(hasCredentials()).toBe(false)
  })
})

describe('getToken', () => {
  it('requires stored credentials', async () => {
    await expect(getToken()).rejects.toThrow(AuthRequiredError)
  })

  it('mints a token on first call after login', async () => {
    mockSuccessfulTokenFetch()
    await login(CREDENTIALS)
    clearToken()

    const token = await getToken()

    expect(token).toBe('tok_abc123')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('returns cached token on second call without hitting the network', async () => {
    mockSuccessfulTokenFetch()
    await login(CREDENTIALS)
    await getToken()

    expect(fetch).toHaveBeenCalledOnce()
  })

  it('deduplicates concurrent inflight requests', async () => {
    mockSuccessfulTokenFetch()
    await login(CREDENTIALS)
    clearToken()

    const [a, b] = await Promise.all([getToken(), getToken()])

    expect(a).toBe('tok_abc123')
    expect(b).toBe('tok_abc123')
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe('logout', () => {
  it('clears session credentials and forces login again', async () => {
    mockSuccessfulTokenFetch()
    await login(CREDENTIALS)

    logout()

    expect(hasCredentials()).toBe(false)
    await expect(getToken()).rejects.toThrow(AuthRequiredError)
  })
})
