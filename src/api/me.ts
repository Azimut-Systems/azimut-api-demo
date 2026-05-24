import { apiClient } from './client'
import type { MeResponse } from '../types/api'

export async function fetchMe(): Promise<MeResponse> {
  return apiClient.request('/v1/me')
}
