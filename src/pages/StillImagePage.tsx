import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { MatchBandBadge } from '../components/MatchBandBadge'
import { ScreenShell } from '../components/ScreenShell'
import { StatusBanner } from '../components/StatusBanner'
import { useSearch } from '../context/SearchContext'
import { getMockCandidatesAt } from '../data/mockScan'
import {
  assessImageQuality,
  readFileAsDataUrl,
  validateImageFile,
} from '../lib/imageValidation'
import { bandDescription } from '../lib/matchBands'
import type { MockCandidate } from '../types/search'

/**
 * Fallback when camera is unavailable: upload a scene photo and run the same
 * (mocked) candidate matching path once.
 */
export function StillImagePage() {
  const navigate = useNavigate()
  const { session, primaryReference, beginScan, recordCandidates, confirmMatch, endScan } =
    useSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<MockCandidate[] | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (session.references.length === 0) {
    return <Navigate to="/upload" replace />
  }

  async function onPick(file: File) {
    setError(null)
    setResults(null)
    const basic = validateImageFile(file)
    if (!basic.ok) {
      setError(basic.error ?? 'Invalid image')
      return
    }
    setBusy(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const quality = await assessImageQuality(dataUrl)
      if (!quality.ok) {
        setError(quality.error ?? 'Could not use that image')
        return
      }
      setSceneUrl(dataUrl)
      beginScan()
      // Mock: treat as if the late strong-match frame fired.
      const candidates = getMockCandidatesAt(8000).filter(
        (c) => c.band === 'strong' || c.band === 'possible' || c.band === 'weak',
      )
      setResults(candidates)
      recordCandidates(
        candidates.length,
        candidates.filter((c) => c.band === 'strong' || c.band === 'possible').length,
      )
    } finally {
      setBusy(false)
    }
  }

  function finish(confirmed: boolean) {
    if (confirmed) confirmMatch()
    endScan()
    navigate('/summary')
  }

  const top = results?.[0]

  return (
    <ScreenShell
      backTo="/camera-prep"
      footer={
        results && top ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button fullWidth onClick={() => finish(true)}>
              Yes, this looks like my item
            </Button>
            <Button fullWidth variant="secondary" onClick={() => finish(false)}>
              No match — done
            </Button>
          </div>
        ) : (
          <Button fullWidth disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Analysing…' : 'Choose a scene photo'}
          </Button>
        )
      }
    >
      <h1 className="font-display text-3xl font-bold text-slate-50">Still-image search</h1>
      <p className="mt-2 text-sm text-slate-300">
        Camera unavailable? Upload a photo of the area and we’ll look for possible matches.
      </p>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        <img
          src={primaryReference?.croppedDataUrl ?? primaryReference?.dataUrl}
          alt="Reference"
          className="h-14 w-14 rounded-xl object-cover"
        />
        <div>
          <p className="text-xs text-slate-400">Searching for</p>
          <p className="font-medium text-slate-100">
            {session.metadata.name || 'Untitled item'}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onPick(file)
          e.target.value = ''
        }}
      />

      {sceneUrl && (
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-slate-700">
          <img src={sceneUrl} alt="Scene" className="max-h-80 w-full object-cover" />
        </div>
      )}

      {error && (
        <div className="mt-4">
          <StatusBanner tone="error" title="Upload issue">
            {error}
          </StatusBanner>
        </div>
      )}

      {top && (
        <div className="mt-5 space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">{top.label}</h2>
            <MatchBandBadge band={top.band} />
          </div>
          <p className="text-sm text-slate-300">{bandDescription(top.band)}</p>
          <div className="grid grid-cols-2 gap-3">
            <img
              src={primaryReference?.croppedDataUrl ?? primaryReference?.dataUrl}
              alt="Reference"
              className="aspect-square rounded-xl object-cover"
            />
            <img
              src={top.cropDataUrl}
              alt="Candidate"
              className="aspect-square rounded-xl object-cover"
            />
          </div>
          <button
            type="button"
            className="text-xs text-slate-400 underline-offset-2 hover:underline"
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? 'Hide technical details' : 'Show technical details'}
          </button>
          {detailsOpen && (
            <p className="text-xs text-slate-500">
              Raw similarity score: {top.score.toFixed(3)} (debug only)
            </p>
          )}
        </div>
      )}
    </ScreenShell>
  )
}
