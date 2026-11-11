import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from './BrandMark'

type ScreenShellProps = {
  children: ReactNode
  showHeader?: boolean
  backTo?: string
  backLabel?: string
  footer?: ReactNode
  dense?: boolean
}

export function ScreenShell({
  children,
  showHeader = true,
  backTo,
  backLabel = 'Back',
  footer,
  dense = false,
}: ScreenShellProps) {
  return (
    <div className="relative min-h-dvh bg-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-2xl">
        {showHeader && (
          <header className="mb-6 flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <Link to="/" className="no-underline">
              <BrandMark size="sm" />
            </Link>
            {backTo ? (
              <Link
                to={backTo}
                className="text-sm font-medium text-slate-400 no-underline hover:text-slate-100"
              >
                {backLabel}
              </Link>
            ) : (
              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Lost object finder
              </span>
            )}
          </header>
        )}

        <main className={`fade-in flex-1 ${dense ? '' : 'pb-6'}`}>{children}</main>

        {footer && (
          <div className="sticky bottom-0 -mx-4 border-t border-slate-800 bg-slate-950 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
