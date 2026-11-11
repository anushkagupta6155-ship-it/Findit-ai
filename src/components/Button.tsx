import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-400',
  secondary:
    'bg-slate-800 text-slate-50 border border-slate-700 hover:bg-slate-700 disabled:opacity-50',
  ghost: 'bg-transparent text-slate-300 hover:text-slate-50 hover:bg-slate-800/60 disabled:opacity-50',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25',
}

export function Button({
  variant = 'primary',
  children,
  fullWidth,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition duration-150',
        'disabled:cursor-not-allowed',
        fullWidth ? 'w-full' : '',
        variants[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
