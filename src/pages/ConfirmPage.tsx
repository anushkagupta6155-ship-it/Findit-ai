import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ReferenceThumbs } from '../components/ReferenceThumbs'
import { ScreenShell } from '../components/ScreenShell'
import { useSearch } from '../context/SearchContext'

export function ConfirmPage() {
  const navigate = useNavigate()
  const { session } = useSearch()

  if (session.references.length === 0) {
    return <Navigate to="/upload" replace />
  }

  const missingCrop = session.references.some((r) => !r.croppedDataUrl)

  return (
    <ScreenShell
      backTo="/crop"
      footer={
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" fullWidth onClick={() => navigate('/upload')}>
            Edit / replace photos
          </Button>
          <Button
            fullWidth
            disabled={missingCrop}
            onClick={() => navigate('/camera-prep')}
          >
            Looks good — continue
          </Button>
        </div>
      }
    >
      <h1 className="font-display text-3xl font-bold text-slate-50">Confirm your item</h1>
      <p className="mt-2 text-sm text-slate-300">
        Double-check the cropped references before we ask for camera access.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
        <img
          src={
            session.references[0]?.croppedDataUrl ?? session.references[0]?.dataUrl
          }
          alt="Primary reference"
          className="max-h-72 w-full object-contain"
        />
      </div>

      <div className="mt-4">
        <ReferenceThumbs references={session.references} />
      </div>

      <dl className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm">
        <Row label="Name" value={session.metadata.name || 'Untitled item'} />
        <Row label="Colour" value={session.metadata.colour || 'Not specified'} />
        <Row label="Brand" value={session.metadata.brand || 'Not specified'} />
        <Row label="Notes" value={session.metadata.notes || '—'} />
      </dl>

      {missingCrop && (
        <p className="mt-4 text-sm text-amber-300">
          Finish cropping each photo before continuing.
        </p>
      )}
    </ScreenShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-100">{value}</dd>
    </div>
  )
}
