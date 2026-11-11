import type { MatchBand } from '../types/search'

/**
 * Maps a calibrated similarity score to user-facing bands.
 * Thresholds are placeholders until the evaluation dataset (Phase 6+)
 * selects real cutoffs for CLIP / DINOv2 image-image scores.
 */
export const BAND_THRESHOLDS = {
  strong: 0.82,
  possible: 0.72,
  weak: 0.62,
} as const

export function scoreToBand(score: number): MatchBand {
  if (score >= BAND_THRESHOLDS.strong) return 'strong'
  if (score >= BAND_THRESHOLDS.possible) return 'possible'
  if (score >= BAND_THRESHOLDS.weak) return 'weak'
  return 'none'
}

export function bandLabel(band: MatchBand): string {
  switch (band) {
    case 'strong':
      return 'Strong possible match'
    case 'possible':
      return 'Possible match'
    case 'weak':
      return 'Weak match'
    default:
      return 'Not a match'
  }
}

export function bandDescription(band: MatchBand): string {
  switch (band) {
    case 'strong':
      return 'Looks closely similar to your reference. Still confirm visually.'
    case 'possible':
      return 'Similar enough to inspect. Not proof of identity.'
    case 'weak':
      return 'Only a mild resemblance. Keep scanning if unsure.'
    default:
      return 'Below the alert threshold.'
  }
}

/** Consecutive processed frames required before alerting (Phase 1 mock uses this). */
export const STABLE_HIT_FRAMES = 3
