type TipChipsProps = {
  tips: string[]
  onSelect?: (tip: string) => void
}

export function TipChips({ tips, onSelect }: TipChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tips.map((tip) => (
        <button
          key={tip}
          type="button"
          onClick={() => onSelect?.(tip)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-amber-500 hover:text-amber-400"
        >
          {tip}
        </button>
      ))}
    </div>
  )
}
