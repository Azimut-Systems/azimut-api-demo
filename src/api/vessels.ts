import { apiClient } from './client'
import type { CollectionEnvelope, ItemEnvelope, Vessel } from '../types/api'

export interface VesselsParams {
  q?: string
  imo?: string
  mmsi?: string
  flag?: string
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
