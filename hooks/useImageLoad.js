import { useState, useEffect } from 'react'

export const useImageLoad = (src) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src) {
      setLoading(false)
      return
    }

    const img = new Image()
    
    const handleLoad = () => {
      setLoading(false)
      setError(false)
    }
    
    const handleError = () => {
      setLoading(false)
      setError(true)
    }

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)
    img.src = src

    return () => {
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }
  }, [src])

  return { loading, error }
}
