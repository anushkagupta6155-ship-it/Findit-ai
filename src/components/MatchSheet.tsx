import { useState } from 'react'
import type { MockCandidate, ReferencePhoto } from '../types/search'
import { bandDescription } from '../lib/matchBands'
import { Button } from './Button'
import { MatchBandBadge } from './MatchBandBadge'

type MatchSheetProps = {
  candidates: MockCandidate[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  reference: ReferencePhoto | null
  onConfirm: () => void
  onReject: () => void
}

export function MatchSheet({
  candidates,
  activeIndex,
  onActiveIndexChange,
  reference,
  onConfirm,
  onReject,
}: MatchSheetProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const active = candidates[activeIndex]
  if (!active) return null

  return (
    <div className="sheet-up absolute inset-x-0 bottom-0 z-20 rounded-t-xl border border-slate-700 bg-slate-900 p-4">
      <div className="mx-auto mb-3 h-1 w-10 rounded-md bg-slate-600" />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Possible match</p>
          <h2 className="mt-1 font-display text-xl font-bold text-slate-50">{active.label}</h2>
        </div>
        <MatchBandBadge band={active.band} />
      </div>

      <p className="mb-4 text-sm text-slate-300">{bandDescription(active.band)}</p>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <figure className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <img
            src={reference?.croppedDataUrl ?? reference?.dataUrl}
            alt="Your reference"
            className="aspect-square w-full object-cover"
          />
          <figcaption className="px-2 py-1.5 text-center text-[11px] text-slate-400">
            Your reference
          </figcaption>
        </figure>
        <figure className="overflow-hidden rounded-xl border border-amber-500/40 bg-slate-950">
          <img
            src={active.cropDataUrl}
            alt="Detected candidate"
            className="aspect-square w-full object-cover"
          />
          <figcaption className="px-2 py-1.5 text-center text-[11px] text-slate-400">
            Camera candidate
          </figcaption>
        </figure>
      </div>

      {candidates.length > 1 && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            className="px-3 py-2"
            disabled={activeIndex === 0}
            onClick={() => onActiveIndexChange(activeIndex - 1)}
          >
            Previous
          </Button>
          <p className="text-xs text-slate-400">
            {activeIndex + 1} of {candidates.length}
          </p>
          <Button
            variant="ghost"
            className="px-3 py-2"
            disabled={activeIndex >= candidates.length - 1}
            onClick={() => onActiveIndexChange(activeIndex + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <button
        type="button"
        className="mb-4 text-left text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
        onClick={() => setDetailsOpen((v) => !v)}
      >
        {detailsOpen ? 'Hide technical details' : 'Show technical details'}
      </button>

      {detailsOpen && (
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
          <p>Raw similarity score: {active.score.toFixed(3)} (for debugging / evaluation)</p>
          <p className="mt-1">
            Stable for {active.consecutiveHits} consecutive frames before alert.
          </p>
          <p className="mt-1">Bands are calibrated later on a held-out evaluation set.</p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button fullWidth onClick={onConfirm}>
          Yes, this looks like my item
        </Button>
        <Button fullWidth variant="secondary" onClick={onReject}>
          No, continue scanning
        </Button>
      </div>
    </div>
  )
}
