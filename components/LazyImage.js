import { useState } from 'react'
import { useImageLoad } from '../hooks/useImageLoad'
import { ImageSkeleton } from './LoadingStates'

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  aspectRatio = 'aspect-square',
  fallback = null 
}) {
  const { loading, error } = useImageLoad(src)
  const [imageError, setImageError] = useState(false)

  if (loading) {
    return <ImageSkeleton aspectRatio={aspectRatio} />
  }

  if (error || imageError) {
    return fallback || (
      <div className={`${aspectRatio} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <p className="text-gray-400 text-sm">Failed to load image</p>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  )
}