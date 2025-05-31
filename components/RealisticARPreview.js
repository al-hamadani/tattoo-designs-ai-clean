// components/RealisticARPreview.js
import { useState, useRef, useEffect } from 'react'
import { Camera, Download, RotateCcw, X, Move, ZoomIn, ZoomOut } from 'lucide-react'

export default function RealisticARPreview({ imageUrl, design, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tattooSize, setTattooSize] = useState(80)
  const [tattooPosition, setTattooPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [tattooImage, setTattooImage] = useState(null)

  useEffect(() => {
    startCamera()
    loadTattooImage()
    
    // Hide controls after 3 seconds
    const controlsTimer = setTimeout(() => setShowControls(false), 3000)
    
    return () => {
      stopCamera()
      clearTimeout(controlsTimer)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && tattooImage) {
      startRendering()
    }
  }, [tattooImage, tattooSize, tattooPosition])

  const loadTattooImage = () => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setTattooImage(img)
    img.onerror = () => setError('Failed to load tattoo image')
    img.src = imageUrl
  }

  const startCamera = async () => {
    try {
      setIsLoading(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
          setupCanvas()
        }
      }
    } catch (err) {
      setError('Camera access required for AR preview')
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const setupCanvas = () => {
    if (!canvasRef.current || !videoRef.current) return
    
    const canvas = canvasRef.current
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.style.width = '100%'
    canvas.style.height = '100%'
  }

  const startRendering = () => {
    if (!canvasRef.current || !videoRef.current || !tattooImage) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const video = videoRef.current
    
    const render = () => {
      if (!canvas || !ctx || !video || !tattooImage) return
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Calculate tattoo position and size
      const scale = tattooSize / 100
      const baseSize = Math.min(canvas.width, canvas.height) * 0.15 // Base size relative to canvas
      const tattooWidth = baseSize * scale
      const tattooHeight = (tattooWidth * tattooImage.height) / tattooImage.width
      
      const x = (canvas.width * tattooPosition.x / 100) - tattooWidth / 2
      const y = (canvas.height * tattooPosition.y / 100) - tattooHeight / 2
      
      // Save context for transformations
      ctx.save()
      
      // Apply realistic skin blending
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.8
      
      // Create gradient for depth effect
      const gradient = ctx.createRadialGradient(
        x + tattooWidth/2, y + tattooHeight/2, 0,
        x + tattooWidth/2, y + tattooHeight/2, tattooWidth/2
      )
      gradient.addColorStop(0, 'rgba(0,0,0,0.1)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.3)')
      
      // Draw shadow for depth
      ctx.fillStyle = gradient
      ctx.fillRect(x + 2, y + 2, tattooWidth, tattooHeight)
      
      // Draw the tattoo with skin tone blending
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.85
      ctx.drawImage(tattooImage, x, y, tattooWidth, tattooHeight)
      
      // Add highlight for realism
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = 0.1
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x, y, tattooWidth * 0.3, tattooHeight * 0.3)
      
      ctx.restore()
      
      animationRef.current = requestAnimationFrame(render)
    }
    
    render()
  }

  const handleTouchStart = (e) => {
    e.preventDefault()
    setIsDragging(true)
    setShowControls(true)
    
    // Reset controls hide timer
    setTimeout(() => setShowControls(false), 3000)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || !canvasRef.current) return
    e.preventDefault()
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    const y = ((touch.clientY - rect.top) / rect.height) * 100
    
    setTattooPosition({ 
      x: Math.max(10, Math.min(90, x)), 
      y: Math.max(10, Math.min(90, y)) 
    })
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const captureARPhoto = async () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    
    // Create high-quality capture
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ar-tattoo-preview-${Date.now()}.jpg`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/jpeg', 0.95)
  }

  const resetPosition = () => {
    setTattooPosition({ x: 50, y: 50 })
    setTattooSize(80)
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md mx-4">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-white text-black px-6 py-3 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Starting camera...</p>
          </div>
        </div>
      )}

      {/* Hidden Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      {/* Main Canvas - Full Screen */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setShowControls(!showControls)}
      />

      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">AR Tattoo Preview</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile-Optimized Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Size Control */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <ZoomOut className="w-5 h-5 text-white" />
            <input
              type="range"
              min="30"
              max="150"
              value={tattooSize}
              onChange={(e) => setTattooSize(parseInt(e.target.value))}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none slider"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(tattooSize-30)/120*100}%, rgba(255,255,255,0.2) ${(tattooSize-30)/120*100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <ZoomIn className="w-5 h-5 text-white" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-safe">
            <button
              onClick={resetPosition}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white py-3 rounded-xl font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            
            <button
              onClick={captureARPhoto}
              className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Save Photo
            </button>
          </div>
        </div>
      </div>

      {/* Tap Instructions */}
      {!isDragging && showControls && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm">
            <Move className="w-4 h-4 inline mr-2" />
            Touch and drag to move tattoo
          </div>
        </div>
      )}

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  )
}