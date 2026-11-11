import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { Navigate, useNavigate } from 'react-router-dom'
import { Minus, Plus, RotateCcw } from 'lucide-react'

type HandleKind = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const RESIZE_HANDLES: Array<{
  id: HandleKind
  label: string
  cursor: string
  left: string
  top: string
  transform: string
}> = [
  { id: 'nw', label: 'Resize crop from top-left corner', cursor: 'nwse-resize', left: '50%', top: '50%', transform: 'translate(calc(-50% - var(--cw) / 2), calc(-50% - var(--ch) / 2))' },
  { id: 'n', label: 'Resize crop from top edge', cursor: 'ns-resize', left: '50%', top: '50%', transform: 'translate(-50%, calc(-50% - var(--ch) / 2))' },
  { id: 'ne', label: 'Resize crop from top-right corner', cursor: 'nesw-resize', left: '50%', top: '50%', transform: 'translate(calc(-50% + var(--cw) / 2), calc(-50% - var(--ch) / 2))' },
  { id: 'e', label: 'Resize crop from right edge', cursor: 'ew-resize', left: '50%', top: '50%', transform: 'translate(calc(-50% + var(--cw) / 2), -50%)' },
  { id: 'se', label: 'Resize crop from bottom-right corner', cursor: 'nwse-resize', left: '50%', top: '50%', transform: 'translate(calc(-50% + var(--cw) / 2), calc(-50% + var(--ch) / 2))' },
  { id: 's', label: 'Resize crop from bottom edge', cursor: 'ns-resize', left: '50%', top: '50%', transform: 'translate(-50%, calc(-50% + var(--ch) / 2))' },
  { id: 'sw', label: 'Resize crop from bottom-left corner', cursor: 'nesw-resize', left: '50%', top: '50%', transform: 'translate(calc(-50% - var(--cw) / 2), calc(-50% + var(--ch) / 2))' },
  { id: 'w', label: 'Resize crop from left edge', cursor: 'ew-resize', left: '50%', top: '50%', transform: 'translate(calc(-50% - var(--cw) / 2), -50%)' },
]
import { Button } from '../components/Button'
import { ScreenShell } from '../components/ScreenShell'
import { StatusBanner } from '../components/StatusBanner'
import { useSearch } from '../context/SearchContext'
import {
  MIN_CROP_PX,
  getCroppedDataUrl,
  getPreviewThumb,
  loadOrientedImage,
  orientedCanvasToDataUrl,
} from '../lib/cropImage'

/**
 * Crop UI via react-easy-crop: 8 handles, pinch/scroll zoom, dimmed exterior,
 * grid while interacting, full-resolution output, EXIF orientation baked in.
 */
export function CropPage() {
  const navigate = useNavigate()
  const { session, updateReference } = useSearch()
  const [index, setIndex] = useState(0)
  const active = session.references[index]

  const [orientedSrc, setOrientedSrc] = useState<string | null>(null)
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(1)
  const [cropSize, setCropSize] = useState({ width: 220, height: 220 })
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [previewThumb, setPreviewThumb] = useState<string>('')
  const [interacting, setInteracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const cropWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    setError(null)
    setPreviewThumb('')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)

    void (async () => {
      try {
        const canvas = await loadOrientedImage(active.dataUrl)
        if (cancelled) return
        sourceCanvasRef.current = canvas
        const url = orientedCanvasToDataUrl(canvas)
        setOrientedSrc(url)
        // Allow zooming out enough to see small objects; library clamps via media size.
        setMinZoom(1)
        setZoom(1)
      } catch {
        if (!cancelled) {
          sourceCanvasRef.current = null
          setOrientedSrc(active.dataUrl)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [active])

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  useEffect(() => {
    if (!orientedSrc || !croppedAreaPixels) return
    let cancelled = false
    const t = window.setTimeout(() => {
      void getPreviewThumb(
        orientedSrc,
        croppedAreaPixels,
        sourceCanvasRef.current ?? undefined,
      ).then((thumb) => {
        if (!cancelled) setPreviewThumb(thumb)
      })
    }, 120)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [orientedSrc, croppedAreaPixels])

  if (session.references.length === 0) {
    return <Navigate to="/upload" replace />
  }

  function resetCrop() {
    setCrop({ x: 0, y: 0 })
    setZoom(minZoom)
    setCropSize({ width: 220, height: 220 })
    setError(null)
  }

  function nudgeCrop(dx: number, dy: number) {
    setCrop((c) => ({ x: c.x + dx, y: c.y + dy }))
  }

  function resizeCrop(dw: number, dh: number) {
    setCropSize((s) => ({
      width: Math.max(64, s.width + dw),
      height: Math.max(64, s.height + dh),
    }))
  }

  function onHandlePointerDown(e: ReactPointerEvent<HTMLButtonElement>, kind: HandleKind) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const start = { ...cropSize }
    setInteracting(true)
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let width = start.width
      let height = start.height
      if (kind.includes('e')) width = start.width + dx * 2
      if (kind.includes('w')) width = start.width - dx * 2
      if (kind.includes('s')) height = start.height + dy * 2
      if (kind.includes('n')) height = start.height - dy * 2
      // Edge-only: change one axis
      if (kind === 'e' || kind === 'w') height = start.height
      if (kind === 'n' || kind === 's') width = start.width
      setCropSize({
        width: Math.max(64, Math.round(width)),
        height: Math.max(64, Math.round(height)),
      })
    }

    function onUp(ev: PointerEvent) {
      target.releasePointerCapture(ev.pointerId)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
      setInteracting(false)
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const move = 8
    const grow = 12
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (e.shiftKey) resizeCrop(-grow, 0)
      else nudgeCrop(-move, 0)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (e.shiftKey) resizeCrop(grow, 0)
      else nudgeCrop(move, 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (e.shiftKey) resizeCrop(0, -grow)
      else nudgeCrop(0, -move)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (e.shiftKey) resizeCrop(0, grow)
      else nudgeCrop(0, move)
    }
  }

  async function applyCropAndContinue() {
    if (!active || !orientedSrc || !croppedAreaPixels) return
    if (
      croppedAreaPixels.width < MIN_CROP_PX ||
      croppedAreaPixels.height < MIN_CROP_PX
    ) {
      setError(`Make the selection at least ${MIN_CROP_PX}×${MIN_CROP_PX} pixels so small items stay clear.`)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const croppedDataUrl = await getCroppedDataUrl(
        orientedSrc,
        croppedAreaPixels,
        sourceCanvasRef.current ?? undefined,
      )
      const naturalW = sourceCanvasRef.current?.width ?? croppedAreaPixels.width
      const naturalH = sourceCanvasRef.current?.height ?? croppedAreaPixels.height
      updateReference(active.id, {
        crop: {
          x: croppedAreaPixels.x / naturalW,
          y: croppedAreaPixels.y / naturalH,
          width: croppedAreaPixels.width / naturalW,
          height: croppedAreaPixels.height / naturalH,
        },
        croppedDataUrl,
        dataUrl: orientedSrc,
      })

      if (index < session.references.length - 1) {
        setIndex((i) => i + 1)
      } else {
        navigate('/confirm')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop that image.')
    } finally {
      setBusy(false)
    }
  }

  function skipCrop() {
    if (!active) return
    const src = orientedSrc ?? active.dataUrl
    updateReference(active.id, {
      crop: { x: 0, y: 0, width: 1, height: 1 },
      croppedDataUrl: src,
      dataUrl: src,
    })
    if (index < session.references.length - 1) {
      setIndex((i) => i + 1)
      return
    }
    navigate('/confirm')
  }

  return (
    <ScreenShell
      backTo="/upload"
      footer={
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" fullWidth onClick={skipCrop} disabled={busy}>
            Use full image
          </Button>
          <Button fullWidth onClick={() => void applyCropAndContinue()} disabled={busy || !croppedAreaPixels}>
            {index < session.references.length - 1 ? 'Crop & next photo' : 'Save crop & continue'}
          </Button>
        </div>
      }
    >
      <h1 className="font-display text-3xl font-bold text-slate-50">Select the object</h1>
      <p className="mt-2 text-sm text-slate-300">
        Drag the frame onto your item. Pinch or scroll to zoom. A tighter crop helps matching later.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Photo {index + 1} of {session.references.length}
      </p>

      <div className="mt-4 flex items-start gap-3">
        <div
          ref={cropWrapRef}
          className="relative h-[min(55vh,420px)] min-h-[260px] flex-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          tabIndex={0}
          role="group"
          aria-label="Crop area. Arrow keys move. Shift plus arrows resize."
          onKeyDown={onKeyDown}
          style={
            {
              '--cw': `${cropSize.width}px`,
              '--ch': `${cropSize.height}px`,
            } as CSSProperties
          }
        >
          {orientedSrc ? (
            <>
              <Cropper
                image={orientedSrc}
                crop={crop}
                zoom={zoom}
                minZoom={minZoom}
                maxZoom={3}
                cropSize={cropSize}
                aspect={undefined}
                showGrid={interacting}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropSizeChange={setCropSize}
                onCropComplete={onCropComplete}
                onInteractionStart={() => setInteracting(true)}
                onInteractionEnd={() => setInteracting(false)}
                objectFit="contain"
                classes={{ containerClassName: 'findit-crop', cropAreaClassName: 'findit-crop-area' }}
                style={{
                  containerStyle: { background: '#0f172a' },
                  cropAreaStyle: {
                    color: 'rgba(11, 15, 20, 0.58)',
                  },
                }}
              />
              {RESIZE_HANDLES.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="findit-crop-handle"
                  aria-label={h.label}
                  style={{
                    left: h.left,
                    top: h.top,
                    transform: h.transform,
                    cursor: h.cursor,
                  }}
                  onPointerDown={(e) => onHandlePointerDown(e, h.id)}
                >
                  <span />
                </button>
              ))}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Preparing photo…
            </div>
          )}
        </div>

        <div className="hidden w-24 shrink-0 flex-col gap-2 sm:flex">
          <p className="text-[11px] font-medium text-slate-400">Preview</p>
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
            {previewThumb ? (
              <img src={previewThumb} alt="Cropped preview" className="h-full w-full object-cover" />
            ) : (
              <span className="px-1 text-center text-[10px] text-slate-500">Adjust crop</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex sm:hidden">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-medium text-slate-400">Preview</p>
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
            {previewThumb ? (
              <img src={previewThumb} alt="Cropped preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-slate-500">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          className="min-h-11 min-w-11 px-3"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(minZoom, Number((z - 0.1).toFixed(2))))}
        >
          <Minus size={18} aria-hidden />
        </Button>
        <input
          type="range"
          min={minZoom}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="min-w-[8rem] flex-1 accent-amber-500"
        />
        <Button
          variant="secondary"
          className="min-h-11 min-w-11 px-3"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
        >
          <Plus size={18} aria-hidden />
        </Button>
        <Button variant="ghost" className="min-h-11" onClick={resetCrop} aria-label="Reset crop">
          <RotateCcw size={16} aria-hidden />
          Reset
        </Button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Keyboard: arrows move · Shift+arrows resize · pinch or scroll to zoom.
      </p>

      <div className="mt-4">
        <StatusBanner tone="info" title="Tip">
          Frame just the lost item. Phone photos are rotated upright automatically when the browser
          provides orientation data.
        </StatusBanner>
      </div>

      {error && (
        <div className="mt-3">
          <StatusBanner tone="error" title="Crop issue">
            {error}
          </StatusBanner>
        </div>
      )}
    </ScreenShell>
  )
}
