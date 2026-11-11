import type { MatchBand } from '../types/search'
import { bandLabel } from '../lib/matchBands'

const styles: Record<Exclude<MatchBand, 'none'>, string> = {
  strong: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  possible: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  weak: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export function MatchBandBadge({ band }: { band: MatchBand }) {
  if (band === 'none') return null
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles[band]}`}
    >
      {bandLabel(band)}
    </span>
  )
}
