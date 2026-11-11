import { useCallback, useEffect, useState } from 'react'

type VideoTrack = MediaStreamTrack

function supportsTorch(track: VideoTrack | null): boolean {
  if (!track) return false
  try {
    const caps = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean }
    return Boolean(caps?.torch)
  } catch {
    return false
  }
}

async function setTorch(track: VideoTrack | null, on: boolean): Promise<boolean> {
  if (!track || !supportsTorch(track)) return false
  try {
    await track.applyConstraints({
      advanced: [{ torch: on } as MediaTrackConstraintSet],
    })
    return true
  } catch {
    return false
  }
}

export function useTorch(stream: MediaStream | null) {
  const [supported, setSupported] = useState(false)
  const [on, setOn] = useState(false)

  const track =
    stream?.getVideoTracks()?.[0] ?? null

  useEffect(() => {
    setSupported(supportsTorch(track))
    setOn(false)
  }, [track])

  const turnOff = useCallback(async () => {
    await setTorch(track, false)
    setOn(false)
  }, [track])

  const toggle = useCallback(async () => {
    if (!supportsTorch(track)) return
    const next = !on
    const ok = await setTorch(track, next)
    if (ok) setOn(next)
  }, [track, on])

  useEffect(() => {
    function onVisibility() {
      if (document.hidden) void turnOff()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      void turnOff()
    }
  }, [turnOff])

  return { supported, on, toggle, turnOff }
}
