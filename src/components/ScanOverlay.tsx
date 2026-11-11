import type { MockCandidate } from '../types/search'

const bandStroke: Record<string, string> = {
  strong: '#3d9b78',
  possible: '#d4a017',
  weak: '#8a97a8',
  none: '#6b7a8d',
}

type ScanOverlayProps = {
  candidates: MockCandidate[]
  activeId?: string
  scanning: boolean
}

export function ScanOverlay({ candidates, activeId, scanning: _scanning }: ScanOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {candidates.map((c) => {
        const isActive = c.id === activeId
        return (
          <div
            key={c.id}
            className="absolute rounded-md border-2"
            style={{
              left: `${c.box.x * 100}%`,
              top: `${c.box.y * 100}%`,
              width: `${c.box.width * 100}%`,
              height: `${c.box.height * 100}%`,
              borderColor: bandStroke[c.band],
              outline: isActive ? '2px solid rgba(212, 160, 23, 0.35)' : undefined,
              outlineOffset: 2,
              zIndex: isActive ? 2 : 1,
            }}
          >
            <span
              className="absolute -top-6 left-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-slate-950"
              style={{ backgroundColor: bandStroke[c.band] }}
            >
              {c.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
