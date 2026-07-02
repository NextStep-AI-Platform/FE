type BrandNameProps = {
  className?: string
  /** sm | md | lg | xl */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClass: Record<NonNullable<BrandNameProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-3xl',
}

/** Wordmark styled to match logo purple gradient */
export default function BrandName({ className = '', size = 'md' }: BrandNameProps) {
  return (
    <span className={`font-heading font-bold inline-flex items-baseline gap-0.5 ${sizeClass[size]} ${className}`}>
      <span className="brand-gradient-text">Next</span>
      <span className="brand-gradient-text">Step</span>
      <span className="brand-gradient-text-alt">AI</span>
    </span>
  )
}
