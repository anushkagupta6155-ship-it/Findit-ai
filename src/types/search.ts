export type MatchBand = 'strong' | 'possible' | 'weak' | 'none'

export type ReferenceSource = 'upload' | 'camera' | 'gallery' | 'sample' | 'product-url'

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ReferencePhoto {
  id: string
  dataUrl: string
  source: ReferenceSource
  crop?: CropRect
  croppedDataUrl?: string
}

export interface ItemMetadata {
  name: string
  colour: string
  brand: string
  notes: string
}

export interface MockCandidate {
  id: string
  label: string
  /** Raw cosine-like score for details view only; never shown as primary UI. */
  score: number
  band: MatchBand
  box: { x: number; y: number; width: number; height: number }
  cropDataUrl: string
  consecutiveHits: number
}

export interface SearchSummary {
  itemName: string
  durationMs: number
  candidatesDetected: number
  possibleMatches: number
  userConfirmed: boolean
  userRejectedCount: number
}

export type CameraErrorKind =
  | 'permission-denied'
  | 'not-found'
  | 'not-supported'
  | 'in-use'
  | 'unknown'

export interface SearchSession {
  references: ReferencePhoto[]
  metadata: ItemMetadata
  startedAt: number | null
  endedAt: number | null
  candidatesSeen: number
  possibleMatches: number
  confirmedMatch: boolean
  rejectedCount: number
}
