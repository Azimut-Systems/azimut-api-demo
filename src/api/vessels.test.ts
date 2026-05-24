import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchVesselTransits } from './vessels'

vi.mock('./client', () => ({
  apiClient: { request: vi.fn() },
  ApiError: class ApiError extends Error {},
}))

import { apiClient } from './client'

beforeEach(() => vi.mocked(apiClient.request).mockResolvedValue({}))

describe('fetchVesselTransits', () => {
  it('calls the correct path with default limit', async () => {
    await fetchVesselTransits('aid_v_001')
    expect(apiClient.request).toHaveBeenCalledWith(
      '/v1/vessels/aid_v_001/transits?limit=15',
    )
  })

  it('includes cursor when provided', async () => {
    await fetchVesselTransits('aid_v_001', { cursor: 'tok_abc' })
    expect(apiClient.request).toHaveBeenCalledWith(
      '/v1/vessels/aid_v_001/transits?limit=15&cursor=tok_abc',
    )
  })

  it('respects a custom limit', async () => {
    await fetchVesselTransits('aid_v_001', { limit: 5 })
    expect(apiClient.request).toHaveBeenCalledWith(
      '/v1/vessels/aid_v_001/transits?limit=5',
    )
  })
})
