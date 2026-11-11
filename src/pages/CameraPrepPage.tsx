import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ScreenShell } from '../components/ScreenShell'
import { StatusBanner } from '../components/StatusBanner'
import { useSearch } from '../context/SearchContext'

const TIPS = [
  'Camera permission is required for live scanning.',
  'Move the camera slowly — sudden motion blurs candidates.',
  'Good lighting improves detection.',
  'Keep the search area visible in frame.',
  'Camera frames are used for scanning only during this session.',
]

export function CameraPrepPage() {
  const navigate = useNavigate()
  const { session, beginScan } = useSearch()

  if (session.references.length === 0) {
    return <Navigate to="/upload" replace />
  }

  function startCamera() {
    beginScan()
    navigate('/scan')
  }

  return (
    <ScreenShell
      backTo="/confirm"
      footer={
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" fullWidth onClick={() => navigate('/still')}>
            Use still photo instead
          </Button>
          <Button fullWidth onClick={startCamera}>
            Enable Camera
          </Button>
        </div>
      }
    >
      <h1 className="font-display text-3xl font-bold text-slate-50">Prepare to scan</h1>
      <p className="mt-2 text-sm text-slate-300">
        We only request camera access after you tap Enable Camera.
      </p>

      <ul className="mt-6 space-y-3">
        {TIPS.map((tip) => (
          <li
            key={tip}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200"
          >
            {tip}
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <StatusBanner tone="info" title="Privacy">
          Camera access is used only while you scan. Frames stay in this browser session and are not
          uploaded in the current build.
        </StatusBanner>
      </div>
    </ScreenShell>
  )
}
