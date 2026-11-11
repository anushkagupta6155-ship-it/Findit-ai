import { useCallback, useEffect, useState } from 'react'

type ZoomCaps = { min: number; max: number; step: number }

function readZoomCaps(track: MediaStreamTrack | null): ZoomCaps | null {
  if (!track?.getCapabilities) return null
  try {
    const caps = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: { min: number; max: number; step?: number } | number[]
    }
    const z = caps.zoom
    if (!z) return null
    if (Array.isArray(z)) {
      if (z.length < 2) return null
      return { min: z[0], max: z[z.length - 1], step: 0.1 }
    }
    if (typeof z === 'object' && 'min' in z && 'max' in z && z.max > z.min) {
      return { min: z.min, max: z.max, step: z.step && z.step > 0 ? z.step : 0.1 }
    }
  } catch {
    return null
  }
  return null
}

async function applyHardwareZoom(track: MediaStreamTrack | null, value: number): Promise<boolean> {
  if (!track) return false
  try {
    await track.applyConstraints({
      advanced: [{ zoom: value } as MediaTrackConstraintSet],
    })
    return true
  } catch {
    return false
  }
}

const DIGITAL_MIN = 1
const DIGITAL_MAX = 3
const DIGITAL_STEP = 0.25

/**
 * Camera zoom: uses track zoom when the device exposes it; otherwise CSS digital zoom.
 */
export function useCameraZoom(stream: MediaStream | null) {
  const track = stream?.getVideoTracks()?.[0] ?? null
  const [hardware, setHardware] = useState(false)
  const [min, setMin] = useState(DIGITAL_MIN)
  const [max, setMax] = useState(DIGITAL_MAX)
  const [step, setStep] = useState(DIGITAL_STEP)
  const [zoom, setZoom] = useState(DIGITAL_MIN)

  useEffect(() => {
    const caps = readZoomCaps(track)
    if (caps) {
      setHardware(true)
      setMin(caps.min)
      setMax(caps.max)
      setStep(caps.step)
      setZoom(caps.min)
      void applyHardwareZoom(track, caps.min)
    } else {
      setHardware(false)
      setMin(DIGITAL_MIN)
      setMax(DIGITAL_MAX)
      setStep(DIGITAL_STEP)
      setZoom(DIGITAL_MIN)
    }
  }, [track])

  const setZoomLevel = useCallback(
    async (next: number) => {
      const clamped = Math.min(max, Math.max(min, Number(next.toFixed(2))))
      setZoom(clamped)
      if (hardware) {
        const ok = await applyHardwareZoom(track, clamped)
        if (!ok) {
          // Fall back to digital if hardware rejects mid-session
          setHardware(false)
          setMin(DIGITAL_MIN)
          setMax(DIGITAL_MAX)
          setStep(DIGITAL_STEP)
          setZoom(Math.min(DIGITAL_MAX, Math.max(DIGITAL_MIN, clamped)))
        }
      }
    },
    [hardware, max, min, track],
  )

  const zoomIn = useCallback(() => {
    void setZoomLevel(zoom + step)
  }, [setZoomLevel, step, zoom])

  const zoomOut = useCallback(() => {
    void setZoomLevel(zoom - step)
  }, [setZoomLevel, step, zoom])

  const reset = useCallback(() => {
    void setZoomLevel(min)
  }, [min, setZoomLevel])

  /** CSS scale for digital zoom; 1 when hardware zoom is active. */
  const digitalScale = hardware ? 1 : zoom

  return {
    zoom,
    min,
    max,
    step,
    hardware,
    digitalScale,
    zoomIn,
    zoomOut,
    setZoomLevel,
    reset,
    canZoomIn: zoom < max - 0.001,
    canZoomOut: zoom > min + 0.001,
  }
}
