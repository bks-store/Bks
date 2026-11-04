import { useState, type CSSProperties } from 'react'
import { IMAGES } from '../config/images'

interface Props {
  src?: string
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
  style?: CSSProperties
}

// Image with a branded fallback: never a broken icon or an empty box.
export default function SmartImage({ src, alt, className = '', loading = 'lazy', style }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <img src={IMAGES.logo.onDark} alt="" aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      style={style}
      onError={() => setFailed(true)}
    />
  )
}
