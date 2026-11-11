import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ScreenShell } from '../components/ScreenShell'
import { StatusBanner } from '../components/StatusBanner'
import type { CameraErrorKind } from '../types/search'

const COPY: Record<
  CameraErrorKind,
  { title: string; body: string; tip: string }
> = {
  'permission-denied': {
    title: 'Camera permission blocked',
    body: 'FindIt AI needs camera access to scan live. You can re-enable it in your browser site settings, then retry.',
    tip: 'On Android Chrome: tap the lock icon in the address bar → Permissions → Camera → Allow.',
  },
  'not-found': {
    title: 'No camera found',
    body: 'We couldn’t find a usable camera on this device.',
    tip: 'Connect a webcam, or search with a still photo of the scene instead.',
  },
  'not-supported': {
    title: 'Camera not supported here',
    body: 'This browser doesn’t expose camera access (getUserMedia).',
    tip: 'Try Android Chrome or a recent desktop Chrome/Edge. iOS Safari support comes later.',
  },
  'in-use': {
    title: 'Camera is busy',
    body: 'Another app or browser tab may be using the camera.',
    tip: 'Close other video apps/tabs, then retry.',
  },
  unknown: {
    title: 'Couldn’t start the camera',
    body: 'Something unexpected blocked camera access.',
    tip: 'Retry once. If it keeps failing, use the still-image fallback.',
  },
}

export function CameraErrorPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const kind = (params.get('kind') as CameraErrorKind) || 'unknown'
  const copy = COPY[kind] ?? COPY.unknown

  return (
    <ScreenShell backTo="/camera-prep" backLabel="Back">
      <h1 className="font-display text-3xl font-bold text-slate-50">{copy.title}</h1>
      <p className="mt-2 text-sm text-slate-300">{copy.body}</p>

      <div className="mt-6">
        <StatusBanner tone="warning" title="What to try">
          {copy.tip}
        </StatusBanner>
      </div>

      <div className="mt-6 grid gap-3">
        <Button fullWidth onClick={() => navigate('/scan')}>
          Retry camera
        </Button>
        <Button fullWidth variant="secondary" onClick={() => navigate('/still')}>
          Search with a still photo
        </Button>
        <Link to="/" className="no-underline">
          <Button fullWidth variant="ghost">
            Return home
          </Button>
        </Link>
      </div>
    </ScreenShell>
  )
}
