import type { MatchBand, MockCandidate } from '../types/search'
import { scoreToBand } from '../lib/matchBands'

/**
 * Phase 1 mock pipeline. Later replaced by open-vocab detection + CLIP/DINOv2.
 * Deliberately deterministic so demos are not "random fake percentages".
 */
const MOCK_SEQUENCE: Array<{
  afterMs: number
  candidates: Array<{
    id: string
    label: string
    score: number
    box: MockCandidate['box']
  }>
}> = [
  {
    afterMs: 1800,
    candidates: [
      {
        id: 'c-bag',
        label: 'Dark bag',
        score: 0.58,
        box: { x: 0.12, y: 0.28, width: 0.28, height: 0.34 },
      },
    ],
  },
  {
    afterMs: 4200,
    candidates: [
      {
        id: 'c-wallet-weak',
        label: 'Dark rectangle',
        score: 0.68,
        box: { x: 0.55, y: 0.48, width: 0.22, height: 0.16 },
      },
    ],
  },
  {
    afterMs: 7200,
    candidates: [
      {
        id: 'c-wallet-hit',
        label: 'Wallet-like object',
        score: 0.86,
        box: { x: 0.38, y: 0.42, width: 0.26, height: 0.18 },
      },
      {
        id: 'c-phone',
        label: 'Phone',
        score: 0.64,
        box: { x: 0.1, y: 0.55, width: 0.18, height: 0.28 },
      },
    ],
  },
]

function placeholderCrop(label: string, band: MatchBand): string {
  const fill =
    band === 'strong' ? '#34d399' : band === 'possible' ? '#fbbf24' : '#94a3b8'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" rx="16" fill="#1e293b"/>
  <rect x="28" y="36" width="104" height="72" rx="10" fill="${fill}" opacity="0.35"/>
  <text x="80" y="128" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="12">${label}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function getMockCandidatesAt(elapsedMs: number): MockCandidate[] {
  let latest = MOCK_SEQUENCE[0]?.candidates ?? []
  for (const step of MOCK_SEQUENCE) {
    if (elapsedMs >= step.afterMs) latest = step.candidates
  }

  return latest.map((c) => {
    const band = scoreToBand(c.score)
    return {
      id: c.id,
      label: c.label,
      score: c.score,
      band,
      box: c.box,
      cropDataUrl: placeholderCrop(c.label, band),
      // Mock assumes stability once a strong candidate appears.
      consecutiveHits: band === 'strong' || band === 'possible' ? 3 : 1,
    }
  })
}

export function guidanceForContext(opts: {
  elapsedMs: number
  hasCandidates: boolean
  itemName: string
}): string {
  const name = opts.itemName.toLowerCase()
  const smallObject =
    name.includes('key') ||
    name.includes('earbud') ||
    name.includes('ring') ||
    name.includes('card') ||
    name.includes('glass')

  if (opts.elapsedMs < 2000) return 'Move the camera slowly across the area.'
  if (!opts.hasCandidates) {
    return smallObject
      ? 'Small object tip: move closer and keep it in frame.'
      : 'Try another angle or improve lighting.'
  }
  if (smallObject) return 'Candidate spotted — move closer for a clearer look.'
  return 'Hold steady so we can confirm the possible match.'
}
