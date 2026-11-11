type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  className?: string
}

const sizeClass = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl',
  hero: 'text-5xl sm:text-6xl md:text-7xl',
}

export function BrandMark({ size = 'md', className = '' }: BrandMarkProps) {
  return (
    <div className={`font-display font-extrabold tracking-tight ${sizeClass[size]} ${className}`}>
      <span className="text-slate-50">FindIt</span>
      <span className="text-amber-500"> AI</span>
    </div>
  )
}
