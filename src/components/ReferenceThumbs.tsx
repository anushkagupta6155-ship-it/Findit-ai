import type { ReferencePhoto } from '../types/search'
import { MAX_REFERENCES } from '../context/SearchContext'

type ReferenceThumbsProps = {
  references: ReferencePhoto[]
  onRemove?: (id: string) => void
}

export function ReferenceThumbs({ references, onRemove }: ReferenceThumbsProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-200">
          Reference photos ({references.length}/{MAX_REFERENCES})
        </p>
        <p className="text-xs text-slate-500">Different angles help</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {references.map((ref, index) => (
          <div
            key={ref.id}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900"
          >
            <img
              src={ref.croppedDataUrl ?? ref.dataUrl}
              alt={`Reference ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(ref.id)}
                className="absolute right-1 top-1 rounded-md bg-slate-950/80 px-1.5 text-[10px] text-slate-200"
                aria-label={`Remove reference ${index + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {references.length < MAX_REFERENCES &&
          Array.from({ length: MAX_REFERENCES - references.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-700 text-[11px] text-slate-500"
            >
              Empty
            </div>
          ))}
      </div>
    </div>
  )
}
