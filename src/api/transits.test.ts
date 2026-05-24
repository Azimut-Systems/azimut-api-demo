import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTransits, fetchTransit, fetchTransitSightings } from './transits'

vi.mock('./client', () => ({
  apiClient: { request: vi.fn() },
  ApiError: class ApiError extends Error {},
}))

import { apiClient } from './client'

beforeEach(() => vi.mocked(apiClient.request).mockResolvedValue({}))

describe('fetchTransits', () => {
  it('calls /v1/transits with default limit when filters are empty', async () => {
    await fetchTransits()
    expect(apiClient.request).toHaveBeenCalledWith('/v1/transits?limit=50')
  })

  it('appends filter params to the URL', async () => {
    await fetchTransits({ status: 'open', has_anomaly: true, limit: 20 })
    expect(apiClient.request).toHaveBeenCalledWith(
      '/v1/transits?status=open&has_anomaly=true&limit=20',
    )
  })

  it('omits undefined and empty-string params', async () => {
    await fetchTransits({ status: undefined, flag: '' })
    expect(apiClient.request).toHaveBeenCalledWith('/v1/transits?limit=50')
  })
})

describe('fetchTransit', () => {
  it('calls the correct path', async () => {
    await fetchTransit('tr_17')
    expect(apiClient.request).toHaveBeenCalledWith('/v1/transits/tr_17')
  })
})

describe('fetchTransitSightings', () => {
  it('calls the correct path', async () => {
    await fetchTransitSightings('tr_17')
    expect(apiClient.request).toHaveBeenCalledWith('/v1/transits/tr_17/sightings')
  })
})
