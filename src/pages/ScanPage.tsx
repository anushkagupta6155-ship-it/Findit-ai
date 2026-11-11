import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Flashlight, FlashlightOff, Minus, Plus, Volume2, VolumeX } from 'lucide-react'
import { Button } from '../components/Button'
import { MatchSheet } from '../components/MatchSheet'
import { ScanOverlay } from '../components/ScanOverlay'
import { TipChips } from '../components/TipChips'
import { useSearch } from '../context/SearchContext'
import { useCameraZoom } from '../hooks/useCameraZoom'
import { useMatchFeedback } from '../hooks/useMatchFeedback'
import { useTorch } from '../hooks/useTorch'
import { getMockCandidatesAt, guidanceForContext } from '../data/mockScan'
import { STABLE_HIT_FRAMES } from '../lib/matchBands'
import type { CameraErrorKind, MockCandidate } from '../types/search'

type ScanStatus = 'starting' | 'scanning' | 'paused' | 'match' | 'error'

function mapCameraError(err: unknown): CameraErrorKind {
  if (!(err instanceof DOMException)) return 'unknown'
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return 'permission-denied'
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return 'not-found'
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return 'in-use'
  }
  if (err.name === 'NotSupportedError' || err.name === 'TypeError') {
    return 'not-supported'
  }
  return 'unknown'
}

export function ScanPage() {
  const navigate = useNavigate()
  const {
    session,
    primaryReference,
    recordCandidates,
    confirmMatch,
    rejectMatch,
    endScan,
  } = useSearch()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<ScanStatus>('starting')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [candidates, setCandidates] = useState<MockCandidate[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [guidance, setGuidance] = useState('Starting camera…')
  const [rejectedIds, setRejectedIds] = useState<string[]>([])
  const [frameDark, setFrameDark] = useState(false)
  const alertedRef = useRef<string | null>(null)
  const startedAtRef = useRef(Date.now())
  const hasReferences = session.references.length > 0

  const { muted, pulse, toggleMute, notifyStableMatch, markRejected } = useMatchFeedback()
  const { supported: torchSupported, on: torchOn, toggle: toggleTorch, turnOff: turnTorchOff } =
    useTorch(stream)
  const {
    zoom,
    min: zoomMin,
    max: zoomMax,
    digitalScale,
    zoomIn,
    zoomOut,
    setZoomLevel,
    canZoomIn,
    canZoomOut,
    hardware: hardwareZoom,
  } = useCameraZoom(stream)

  useEffect(() => {
    if (!hasReferences) return
    let cancelled = false

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        navigate(`/camera-error?kind=not-supported`)
        return
      }

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = media
        setStream(media)
        if (videoRef.current) {
          videoRef.current.srcObject = media
          await videoRef.current.play()
        }
        startedAtRef.current = Date.now()
        setStatus('scanning')
        setGuidance('Move the camera slowly across the area.')
      } catch (err) {
        navigate(`/camera-error?kind=${mapCameraError(err)}`)
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [navigate, hasReferences])

  // Sample average luminance for low-light tip when torch is unavailable
  useEffect(() => {
    if (status !== 'scanning' && status !== 'paused') return
    if (torchSupported) {
      setFrameDark(false)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const id = window.setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      const w = 48
      const h = 48
      canvas.width = w
      canvas.height = h
      ctx.drawImage(video, 0, 0, w, h)
      try {
        const data = ctx.getImageData(0, 0, w, h).data
        let sum = 0
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        }
        const avg = sum / (w * h)
        setFrameDark(avg < 48)
      } catch {
        // Cross-origin / security — ignore
      }
    }, 1200)

    return () => window.clearInterval(id)
  }, [status, torchSupported])

  useEffect(() => {
    if (!hasReferences || status !== 'scanning') return

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current
      setElapsedMs(elapsed)

      const next = getMockCandidatesAt(elapsed).filter((c) => !rejectedIds.includes(c.id))
      setCandidates(next)

      const possible = next.filter(
        (c) =>
          (c.band === 'strong' || c.band === 'possible') &&
          c.consecutiveHits >= STABLE_HIT_FRAMES,
      )

      recordCandidates(next.length, possible.length > 0 ? possible.length : 0)

      setGuidance(
        guidanceForContext({
          elapsedMs: elapsed,
          hasCandidates: next.length > 0,
          itemName: session.metadata.name || 'item',
        }),
      )

      if (possible.length > 0) {
        const top = possible[0]
        if (alertedRef.current !== top.id) {
          alertedRef.current = top.id
          notifyStableMatch(top)
        }
        setActiveIndex(0)
        setStatus('match')
      }
    }, 700)

    return () => window.clearInterval(tick)
  }, [
    status,
    rejectedIds,
    recordCandidates,
    session.metadata.name,
    hasReferences,
    notifyStableMatch,
  ])

  const alertCandidates = useMemo(
    () =>
      candidates.filter(
        (c) =>
          (c.band === 'strong' || c.band === 'possible') &&
          c.consecutiveHits >= STABLE_HIT_FRAMES,
      ),
    [candidates],
  )

  async function pause() {
    await turnTorchOff()
    setStatus('paused')
    videoRef.current?.pause()
  }

  function resume() {
    startedAtRef.current = Date.now() - elapsedMs
    setStatus('scanning')
    void videoRef.current?.play()
  }

  async function stop() {
    await turnTorchOff()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStream(null)
    endScan()
    navigate('/summary')
  }

  function onConfirm() {
    confirmMatch()
    void stop()
  }

  function onReject() {
    const active = alertCandidates[activeIndex]
    if (active) {
      setRejectedIds((ids) => [...ids, active.id])
      markRejected(active.id)
      rejectMatch()
    }
    alertedRef.current = null
    setStatus('scanning')
  }

  const itemName = session.metadata.name || 'Untitled item'
  const showNoMatchHint =
    status === 'scanning' && elapsedMs > 3500 && alertCandidates.length === 0

  if (!hasReferences) {
    return <Navigate to="/upload" replace />
  }

  return (
    <div
      className={`relative min-h-dvh bg-slate-950 text-slate-50 ${pulse ? 'match-pulse-ring' : ''}`}
    >
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col sm:max-w-2xl">
        <div className="relative flex-1 overflow-hidden bg-slate-900">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full min-h-[70dvh] w-full origin-center object-cover transition-transform duration-150"
            style={{ transform: `scale(${digitalScale})` }}
          />

          {status === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <p className="text-sm text-slate-300">Requesting camera…</p>
            </div>
          )}

          <ScanOverlay
            candidates={candidates}
            activeId={alertCandidates[activeIndex]?.id}
            scanning={status === 'scanning'}
          />

          <div className="absolute left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2">
              <img
                src={primaryReference?.croppedDataUrl ?? primaryReference?.dataUrl}
                alt=""
                className="h-11 w-11 rounded-md object-cover"
              />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Looking for</p>
                <p className="max-w-[10rem] truncate text-sm font-semibold">{itemName}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Status</p>
              <p className="text-sm font-semibold capitalize text-amber-400">
                {status === 'match' ? 'Possible match' : status}
              </p>
            </div>
          </div>

          {status !== 'match' && (
            <>
              <div className="absolute bottom-44 right-3 z-10 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  className="min-h-11 min-w-11 px-3"
                  aria-label="Zoom in"
                  disabled={!canZoomIn || status === 'starting'}
                  onClick={zoomIn}
                >
                  <Plus size={18} aria-hidden />
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-11 min-w-11 px-3"
                  aria-label="Zoom out"
                  disabled={!canZoomOut || status === 'starting'}
                  onClick={zoomOut}
                >
                  <Minus size={18} aria-hidden />
                </Button>
              </div>

              <div className="absolute inset-x-3 bottom-28 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                <div className="mb-2 flex items-center gap-2">
                  <label className="sr-only" htmlFor="scan-zoom">
                    Camera zoom
                  </label>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    Zoom {zoom.toFixed(1)}×
                    {!hardwareZoom ? ' · digital' : ''}
                  </span>
                  <input
                    id="scan-zoom"
                    type="range"
                    min={zoomMin}
                    max={zoomMax}
                    step={0.05}
                    value={zoom}
                    disabled={status === 'starting'}
                    onChange={(e) => void setZoomLevel(Number(e.target.value))}
                    className="min-w-0 flex-1 accent-amber-500"
                    aria-valuemin={zoomMin}
                    aria-valuemax={zoomMax}
                    aria-valuenow={zoom}
                  />
                </div>
                <p>{guidance}</p>
                {!torchSupported && frameDark && (
                  <p className="mt-2 text-xs text-amber-300">
                    Low light? Turn on room lights — flashlight isn’t available on this device.
                  </p>
                )}
                {showNoMatchHint && (
                  <div className="mt-2">
                    <p className="mb-2 text-xs text-slate-400">
                      No strong possible match yet. Try another angle or move closer.
                    </p>
                    <TipChips
                      tips={['Change angle', 'Move closer', 'Improve lighting', 'Replace reference']}
                      onSelect={(tip) => {
                        if (tip === 'Replace reference') navigate('/upload')
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {status === 'match' && (
            <MatchSheet
              candidates={alertCandidates}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              reference={primaryReference}
              onConfirm={onConfirm}
              onReject={onReject}
            />
          )}
        </div>

        {status !== 'match' && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 bg-slate-950 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {status === 'paused' ? (
              <Button variant="secondary" onClick={resume}>
                Resume
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => void pause()} disabled={status !== 'scanning'}>
                Pause
              </Button>
            )}

            {torchSupported && (
              <Button
                variant="secondary"
                className="min-h-11 min-w-11 px-3"
                aria-pressed={torchOn}
                aria-label={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
                onClick={() => void toggleTorch()}
              >
                {torchOn ? <Flashlight size={18} aria-hidden /> : <FlashlightOff size={18} aria-hidden />}
              </Button>
            )}

            <Button
              variant="ghost"
              className="min-h-11 min-w-11 px-3"
              aria-pressed={muted}
              aria-label={muted ? 'Unmute match sounds' : 'Mute match sounds'}
              onClick={toggleMute}
            >
              {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
            </Button>

            <Button variant="ghost" onClick={() => navigate('/still')}>
              Still photo
            </Button>
            <Button variant="danger" className="ml-auto" onClick={() => void stop()}>
              Stop
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
