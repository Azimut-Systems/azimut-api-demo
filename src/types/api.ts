// Mirrors the OpenAPI 3.1 schema in openapi.json

export type AidScope = 'global' | 'site' | 'session'
export type AreaType = 'chokepoint' | 'port' | 'anchorage' | 'eez' | 'custom' | 'berth' | 'site'
export type TransitStatus = 'open' | 'closed'
export type TransitKind = 'crossing' | 'entry' | 'exit' | 'internal'
export type Course = 'northbound' | 'southbound' | 'eastbound' | 'westbound'
export type CargoState = 'laden' | 'ballast' | 'partial' | 'unknown'
export type ImageQuality = 'poor' | 'fair' | 'good' | 'excellent'
export type SightingIdentificationMethod = 'visual' | 'ais' | 'human'

export interface LatLon {
  lat: number
  lon: number
}

export interface Dimensions {
  length_m: number | null
  beam_m: number | null
}

export interface Vessel {
  aid: string
  aid_scope: AidScope
  name: string | null
  imo: string | null
  mmsi: string | null
  callsign: string | null
  category: string | null
  subtype: string | null
  flag: string | null
  dimensions: Dimensions | null
  previous_aids: string[]
}

export interface AreaRef {
  id: string
  name: string
  type: string
  centroid: LatLon | null
}

export interface Area {
  area_id: string
  name: string
  type: AreaType
  country: string | null
  timezone: string | null
  lat: number | null
  lon: number | null
}

export interface Anomaly {
  type: string
  detected_at: string | null
}

export interface TransitIdentification {
  confidence: number
  ais_matched: boolean
}

export interface ImageRef {
  href: string | null
  expires_at: string | null
}

export interface SightingImages {
  primary: ImageRef | null
  crops: ImageRef[]
}

export interface TransitSightingsEvidence {
  count: number
  ids: string[]
}

export interface TransitEvidence {
  primary_image: ImageRef | null
  sightings: TransitSightingsEvidence
}

export interface OcrNamePlateSignal {
  text: string | null
  matches_ais_name: boolean | null
  confidence: number | null
}

export interface OcrImoPlateSignal {
  text: string | null
  matches_ais_imo: boolean | null
  confidence: number | null
}

export interface OcrSignals {
  name_plate: OcrNamePlateSignal
  imo_plate: OcrImoPlateSignal
}

export interface LiverySignals {
  hull_main_color: string | null
  hull_accent_color: string | null
  funnel_color: string | null
}

export interface ImageSignals {
  quality: ImageQuality | null
  occluded: boolean | null
}

export interface VisualSignals {
  cargo_state: CargoState
  cargo_state_confidence: number | null
  livery: LiverySignals
  ocr: OcrSignals
  image: ImageSignals
  appearance_flags: string[]
}

export interface Link {
  href: string
}

export interface Transit {
  schema_version: string
  id: string
  status: TransitStatus
  transit_kind: TransitKind
  course: Course | null
  entered_at: string
  exited_at: string | null
  area: AreaRef
  vessel: Vessel
  identification: TransitIdentification
  visual_signals: VisualSignals | null
  anomalies: Anomaly[]
  evidence: TransitEvidence
  created_at: string
  updated_at: string
  links: Record<string, Link>
}

export interface SightingVessel {
  aid: string | null
  aid_scope: AidScope
  name: string | null
  imo: string | null
}

export interface SightingSource {
  camera_id: string | null
  area_id: string | null
}

export interface SightingIdentification {
  confidence: number | null
  ais_matched: boolean
  method: SightingIdentificationMethod
}

export interface Sighting {
  schema_version: string
  id: string
  transit_id: string | null
  vessel: SightingVessel
  sighted_at: string
  source: SightingSource
  identification: SightingIdentification
  position: LatLon | null
  images: SightingImages
  visual_signals: VisualSignals | null
  created_at: string
  updated_at: string
  links: Record<string, Link>
}

export interface PageInfo {
  cursor: string | null
  has_more: boolean
}

export interface Meta {
  request_id: string
  generated_at: string
}

export interface CollectionEnvelope<T> {
  data: T[]
  page: PageInfo
  meta: Meta
}

export interface ItemEnvelope<T> {
  data: T
  meta: Meta
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface MeResponse {
  user_id: string | null
  integration_id: string | null
  email: string | null
  org_id: string
  scopes: string[]
  features: string[]
  plan: string
}

export interface TransitFilters {
  area_id?: string
  vessel_aid?: string
  status?: TransitStatus
  has_anomaly?: boolean
  entered_after?: string
  entered_before?: string
  flag?: string
  course?: Course
  min_confidence?: number
  ais_matched?: boolean
}
