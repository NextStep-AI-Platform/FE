import { PICTURE } from '../lib/picture'

/** Tailwind font-size (px) — used as brand text height reference */
const BRAND_TEXT_HEIGHT_PX = {
  sm: 16,  // text-base
  md: 18,  // text-lg
  lg: 20,  // text-xl
  xl: 30,  // text-3xl
} as const

export type LogoBrandSize = keyof typeof BRAND_TEXT_HEIGHT_PX

type LogoMarkProps = {
  /** Match the `size` prop on adjacent `<BrandName />` */
  brandSize?: LogoBrandSize
  className?: string
}

/** Logo width & height = 3/2 × brand name text height */
export function logoSizePx(brandSize: LogoBrandSize = 'md'): number {
  return (BRAND_TEXT_HEIGHT_PX[brandSize] * 3) / 2
}

export default function LogoMark({ brandSize = 'md', className = '' }: LogoMarkProps) {
  const px = logoSizePx(brandSize)
  return (
    <img
      src={PICTURE.logo}
      alt="NextStep AI"
      width={px}
      height={px}
      className={`object-contain flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
    />
  )
}
