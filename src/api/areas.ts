import { apiClient } from './client'
import type { CollectionEnvelope, Area } from '../types/api'

export async function fetchAreas(): Promise<CollectionEnvelope<Area>> {
  return apiClient.request('/v1/areas?limit=500')
}
