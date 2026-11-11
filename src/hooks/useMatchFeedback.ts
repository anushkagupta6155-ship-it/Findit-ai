import { useCallback, useRef, useState } from 'react'
import type { MatchBand } from '../types/search'

const COOLDOWN_MS = 5000

function playMatchChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.045
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.14)
    window.setTimeout(() => void ctx.close(), 280)
  } catch {
    // Autoplay / AudioContext may be blocked.
  }
}

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

export function useMatchFeedback() {
  const [muted, setMuted] = useState(false)
  const [pulse, setPulse] = useState(false)
  const lastAtRef = useRef<Map<string, number>>(new Map())
  const rejectedRef = useRef<Set<string>>(new Set())

  const markRejected = useCallback((id: string) => {
    rejectedRef.current.add(id)
  }, [])

  const notifyStableMatch = useCallback(
    (candidate: { id: string; band: MatchBand }) => {
      if (candidate.band === 'weak' || candidate.band === 'none') return
      if (rejectedRef.current.has(candidate.id)) return

      const last = lastAtRef.current.get(candidate.id) ?? 0
      if (Date.now() - last < COOLDOWN_MS) return
      lastAtRef.current.set(candidate.id, Date.now())

      const vibrateOk = canVibrate()
      if (vibrateOk) {
        if (candidate.band === 'strong') {
          navigator.vibrate([90, 50, 90, 50, 140])
        } else {
          navigator.vibrate([55])
        }
      }

      // iOS and muted desktop: visual pulse; sound only when not muted and no vibrate
      // or when vibrate unsupported (iOS fallback).
      if (!vibrateOk) {
        setPulse(true)
        window.setTimeout(() => setPulse(false), 450)
        if (!muted) playMatchChime()
      } else if (!muted) {
        // Soft confirmation chime alongside vibrate on Android when unmuted
        playMatchChime()
      }
    },
    [muted],
  )

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  return {
    muted,
    pulse,
    toggleMute,
    notifyStableMatch,
    markRejected,
  }
}
