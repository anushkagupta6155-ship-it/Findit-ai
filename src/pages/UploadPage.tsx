import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { ReferenceThumbs } from '../components/ReferenceThumbs'
import { ScreenShell } from '../components/ScreenShell'
import { StatusBanner } from '../components/StatusBanner'
import { MAX_REFERENCES, useSearch } from '../context/SearchContext'
import { SAMPLE_ITEMS } from '../data/samples'
import {
  assessImageQuality,
  createId,
  readFileAsDataUrl,
  validateImageFile,
} from '../lib/imageValidation'
import type { ReferenceSource } from '../types/search'

export function UploadPage() {
  const navigate = useNavigate()
  const { session, setMetadata, addReference, removeReference, setReferences } = useSearch()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [productUrl, setProductUrl] = useState('')
  const [busy, setBusy] = useState(false)

  async function ingestFile(file: File, source: ReferenceSource) {
    setError(null)
    setWarning(null)
    const basic = validateImageFile(file)
    if (!basic.ok) {
      setError(basic.error ?? 'Invalid image')
      return
    }
    if (session.references.length >= MAX_REFERENCES) {
      setError(`You can add up to ${MAX_REFERENCES} reference photos.`)
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
      if (quality.warning) setWarning(quality.warning)
      addReference({
        id: createId(),
        dataUrl,
        source,
      })
    } catch {
      setError('Could not read that image. Try another file.')
    } finally {
      setBusy(false)
    }
  }

  function loadSample(sampleId: string) {
    const sample = SAMPLE_ITEMS.find((s) => s.id === sampleId)
    if (!sample) return
    setReferences([sample.photo])
    setMetadata({
      name: sample.name,
      colour: sample.colour,
      brand: '',
      notes: sample.description,
    })
    setError(null)
    setWarning('Demo sample loaded — for walkthroughs only.')
  }

  async function addProductUrl() {
    setError(null)
    if (!productUrl.trim()) {
      setError('Paste an image URL from a product page.')
      return
    }
    if (session.references.length >= MAX_REFERENCES) {
      setError(`You can add up to ${MAX_REFERENCES} reference photos.`)
      return
    }

    setBusy(true)
    try {
      // Phase 1: accept URL as a reference pointer. Backend proxy comes later for CORS.
      const imgOk = await new Promise<boolean>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = productUrl.trim()
      })
      if (!imgOk) {
        setError(
          'Could not load that image URL (CORS or invalid link). Try downloading the image and uploading it instead.',
        )
        return
      }
      addReference({
        id: createId('product'),
        dataUrl: productUrl.trim(),
        source: 'product-url',
      })
      setProductUrl('')
      setWarning('Product image added. Crop it on the next step so only the item is selected.')
    } finally {
      setBusy(false)
    }
  }

  const canContinue = session.references.length > 0

  return (
    <ScreenShell
      backTo="/"
      backLabel="Home"
      footer={
        <Button
          fullWidth
          disabled={!canContinue || busy}
          onClick={() => navigate('/crop')}
        >
          Continue to crop
        </Button>
      }
    >
      <h1 className="font-display text-3xl font-bold text-slate-50">Add your lost item</h1>
      <p className="mt-2 text-sm text-slate-300">
        Use a gallery photo, snap a new one, or paste a product image. Up to 3 angles.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button
          variant="secondary"
          fullWidth
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Upload / gallery photo
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
        >
          Take a new photo
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void ingestFile(file, 'gallery')
          e.target.value = ''
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void ingestFile(file, 'camera')
          e.target.value = ''
        }}
      />

      <div className="mt-6 space-y-2">
        <label className="block text-sm font-medium text-slate-200" htmlFor="product-url">
          Or use an online product image
        </label>
        <div className="flex gap-2">
          <input
            id="product-url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://…"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <Button variant="secondary" onClick={() => void addProductUrl()} disabled={busy}>
            Add
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-slate-200">Try a demo sample</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_ITEMS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => loadSample(sample.id)}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200"
            >
              Demo · {sample.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <ReferenceThumbs references={session.references} onRemove={removeReference} />
      </div>

      <div className="mt-6 space-y-3">
        <Field
          label="Object name"
          hint="A short name helps — for example “black leather wallet”."
          value={session.metadata.name}
          onChange={(v) => setMetadata({ name: v })}
          placeholder="e.g. Black leather wallet"
        />
        <Field
          label="Colour"
          value={session.metadata.colour}
          onChange={(v) => setMetadata({ colour: v })}
          placeholder="e.g. Black"
        />
        <Field
          label="Brand (optional)"
          value={session.metadata.brand}
          onChange={(v) => setMetadata({ brand: v })}
          placeholder="e.g. Fossil"
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-200">
            Notes (optional)
          </span>
          <textarea
            value={session.metadata.notes}
            onChange={(e) => setMetadata({ notes: e.target.value })}
            rows={3}
            placeholder="Any detail that helps you recognise it"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </label>
      </div>

      {error && (
        <div className="mt-4">
          <StatusBanner tone="error" title="Couldn’t use that image">
            {error}
          </StatusBanner>
        </div>
      )}
      {warning && !error && (
        <div className="mt-4">
          <StatusBanner tone="warning" title="Heads up">
            {warning}
          </StatusBanner>
        </div>
      )}
    </ScreenShell>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      {hint && <span className="mb-1.5 block text-xs text-slate-500">{hint}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500"
      />
    </label>
  )
}
