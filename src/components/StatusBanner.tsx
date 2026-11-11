import type { ReactNode } from 'react'

type Tone = 'info' | 'warning' | 'error' | 'success'

const tones: Record<Tone, string> = {
  info: 'border-slate-600 bg-slate-800/80 text-slate-200',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  error: 'border-red-500/40 bg-red-500/10 text-red-100',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
}

export function StatusBanner({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone
  title: string
  children?: ReactNode
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm opacity-90">{children}</div>}
    </div>
  )
}
