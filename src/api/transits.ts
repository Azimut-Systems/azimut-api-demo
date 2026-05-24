import { apiClient } from './client'
import type { CollectionEnvelope, ItemEnvelope, Transit, Sighting, TransitFilters } from '../types/api'

export interface TransitsParams extends TransitFilters {
  limit?: number
  cursor?: string
}

export async function fetchTransits(params: TransitsParams = {}): Promise<CollectionEnvelope<Transit>> {
  const { limit = 50, ...rest } = params
  const search = new URLSearchParams()
  Object.entries({ ...rest, limit }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v))
  })
  return apiClient.request(`/v1/transits?${search.toString()}`)
}

export async function fetchTransit(id: string): Promise<ItemEnvelope<Transit>> {
  return apiClient.request(`/v1/transits/${id}`)
}

export async function fetchTransitSightings(id: string): Promise<CollectionEnvelope<Sighting>> {
  return apiClient.request(`/v1/transits/${id}/sightings`)
}

export async function fetchSighting(id: string): Promise<ItemEnvelope<Sighting>> {
  return apiClient.request(`/v1/sightings/${id}`)
}
