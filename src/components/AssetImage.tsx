import { useState, type ReactNode } from 'react'
import { pictureAsset } from '../lib/picture'

export { pictureAsset }

type AssetImageProps = {
  src: string
  alt: string
  className?: string
  fallback?: ReactNode
}

export default function AssetImage({ src, alt, className = '', fallback }: AssetImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-purple-600/25 to-indigo-600/15 ${className}`} aria-hidden>
        {fallback}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
