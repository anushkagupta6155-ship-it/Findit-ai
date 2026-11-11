import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { ScreenShell } from '../components/ScreenShell'
import { StatusBanner } from '../components/StatusBanner'
import { useSearch } from '../context/SearchContext'

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

export function SummaryPage() {
  const { session, resetSession, primaryReference } = useSearch()
  const duration =
    session.startedAt && session.endedAt
      ? session.endedAt - session.startedAt
      : session.startedAt
        ? Date.now() - session.startedAt
        : 0

  return (
    <ScreenShell showHeader>
      <h1 className="font-display text-3xl font-bold text-slate-50">Search summary</h1>
      <p className="mt-2 text-sm text-slate-300">
        A record of this session — not a claim that the item was recovered.
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        {primaryReference && (
          <img
            src={primaryReference.croppedDataUrl ?? primaryReference.dataUrl}
            alt=""
            className="h-16 w-16 rounded-xl object-cover"
          />
        )}
        <div>
          <p className="text-xs text-slate-400">Item searched</p>
          <p className="font-display text-xl font-bold text-slate-50">
            {session.metadata.name || 'Untitled item'}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm">
        <Row label="Scan duration" value={formatDuration(duration)} />
        <Row label="Candidate objects detected" value={String(session.candidatesSeen)} />
        <Row label="Possible matches surfaced" value={String(session.possibleMatches)} />
        <Row label="Rejected candidates" value={String(session.rejectedCount)} />
        <Row
          label="You confirmed a possible match"
          value={session.confirmedMatch ? 'Yes' : 'No'}
        />
      </dl>

      {session.confirmedMatch ? (
        <div className="mt-4">
          <StatusBanner tone="success" title="You marked a possible match">
            Please verify in person. Similarity is not proof of identity.
          </StatusBanner>
        </div>
      ) : (
        <div className="mt-4">
          <StatusBanner tone="info" title="No confirmed match this time">
            You can search again with another angle, better lighting, or a clearer reference.
          </StatusBanner>
        </div>
      )}

      <div className="mt-8 grid gap-3">
        <Link to="/upload" className="no-underline" onClick={() => resetSession()}>
          <Button fullWidth>Search again</Button>
        </Link>
        <Link to="/" className="no-underline" onClick={() => resetSession()}>
          <Button fullWidth variant="secondary">
            Return home
          </Button>
        </Link>
      </div>
    </ScreenShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-100">{value}</dd>
    </div>
  )
}
