import { apiClient } from './client'
import type { CollectionEnvelope, ItemEnvelope, Vessel, Transit } from '../types/api'

export interface VesselsParams {
  q?: string
  imo?: string
  mmsi?: string
  flag?: string
  category?: string
  subtype?: string
  cursor?: string
  limit?: number
}

export async function fetchVessels(params: VesselsParams = {}): Promise<CollectionEnvelope<Vessel>> {
  const { limit = 50, ...rest } = params
  const search = new URLSearchParams()
  Object.entries({ ...rest, limit }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v))
  })
  return apiClient.request(`/v1/vessels?${search.toString()}`)
}

export async function fetchVessel(aid: string): Promise<ItemEnvelope<Vessel>> {
  return apiClient.request(`/v1/vessels/${aid}`)
}

export async function fetchVesselTransits(
  aid: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<CollectionEnvelope<Transit>> {
  const { limit = 15, cursor } = params
  const search = new URLSearchParams()
  search.set('limit', String(limit))
  if (cursor) search.set('cursor', cursor)
  return apiClient.request(`/v1/vessels/${aid}/transits?${search.toString()}`)
}
