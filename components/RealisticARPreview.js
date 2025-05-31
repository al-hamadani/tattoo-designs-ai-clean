import { useState, useRef, useEffect } from 'react'
import { Camera, Download, RotateCcw, X, Move, ZoomIn, ZoomOut, SwitchCamera, Sliders } from 'lucide-react'

export default function RealisticARPreview({ imageUrl, design, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const renderCanvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tattooSize, setTattooSize] = useState(80)
  const [tattooPosition, setTattooPosition] = useState({ x: 50, y: 50 })
  const [tattooRotation, setTattooRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [tattooImage, setTattooImage] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const [skinTone, setSkinTone] = useState({ r: 0, g: 0, b: 0 })
  const [opacity, setOpacity] = useState(85)
  const [blur, setBlur] = useState(0.5)
  const [showAdvancedControls, setShowAdvancedControls] = useState(false)

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
  }, [facingMode])

  useEffect(() => {
    if (videoRef.current && tattooImage) {
      startRendering()
    }
  }, [tattooImage, tattooSize, tattooPosition, tattooRotation, opacity, blur, skinTone])

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
          facingMode: facingMode
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
          setupCanvas()
          // Auto-detect skin tone after camera loads
          setTimeout(() => detectSkinTone(), 500)
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

  const switchCamera = () => {
    stopCamera()
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user')
  }

  const setupCanvas = () => {
    if (!canvasRef.current || !renderCanvasRef.current || !videoRef.current) return
    
    const canvas = canvasRef.current
    const renderCanvas = renderCanvasRef.current
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    renderCanvas.width = video.videoWidth
    renderCanvas.height = video.videoHeight
  }

  const detectSkinTone = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Sample from multiple points to get average skin tone
    const samplePoints = [
      { x: canvas.width * 0.5, y: canvas.height * 0.3 },
      { x: canvas.width * 0.4, y: canvas.height * 0.4 },
      { x: canvas.width * 0.6, y: canvas.height * 0.4 }
    ]
    
    let totalR = 0, totalG = 0, totalB = 0, validSamples = 0
    
    samplePoints.forEach(point => {
      const imageData = ctx.getImageData(
        point.x - 10, 
        point.y - 10, 
        20, 
        20
      )
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]
        
        // Check if it's likely skin tone (basic heuristic)
        if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
          totalR += r
          totalG += g
          totalB += b
          validSamples++
        }
      }
    })
    
    if (validSamples > 0) {
      setSkinTone({
        r: Math.round(totalR / validSamples),
        g: Math.round(totalG / validSamples),
        b: Math.round(totalB / validSamples)
      })
    }
  }

  const startRendering = () => {
    if (!canvasRef.current || !renderCanvasRef.current || !videoRef.current || !tattooImage) return
    
    const canvas = renderCanvasRef.current
    const ctx = canvas.getContext('2d')
    const video = videoRef.current
    
    const render = () => {
      if (!canvas || !ctx || !video || !tattooImage) return
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Calculate tattoo dimensions
      const scale = tattooSize / 100
      const baseSize = Math.min(canvas.width, canvas.height) * 0.15
      const tattooWidth = baseSize * scale
      const tattooHeight = (tattooWidth * tattooImage.height) / tattooImage.width
      
      const x = (canvas.width * tattooPosition.x / 100) - tattooWidth / 2
      const y = (canvas.height * tattooPosition.y / 100) - tattooHeight / 2
      
      // Save context
      ctx.save()
      
      // Create off-screen canvas for tattoo processing
      const offCanvas = document.createElement('canvas')
      const offCtx = offCanvas.getContext('2d')
      offCanvas.width = tattooWidth
      offCanvas.height = tattooHeight
      
      // Draw tattoo to off-screen canvas
      offCtx.drawImage(tattooImage, 0, 0, tattooWidth, tattooHeight)
      
      // Apply skin tone tinting
      offCtx.globalCompositeOperation = 'source-atop'
      offCtx.fillStyle = `rgba(${skinTone.r}, ${skinTone.g}, ${skinTone.b}, 0.15)`
      offCtx.fillRect(0, 0, tattooWidth, tattooHeight)
      
      // Reset composite operation
      offCtx.globalCompositeOperation = 'source-over'
      
      // Position and rotate
      ctx.translate(x + tattooWidth/2, y + tattooHeight/2)
      ctx.rotate(tattooRotation * Math.PI / 180)
      
      // Apply slight blur for realism
      ctx.filter = `blur(${blur}px)`
      
      // Draw shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 3
      ctx.shadowOffsetY = 3
      
      // Draw with multiply blend for skin integration
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = opacity / 100
      ctx.drawImage(offCanvas, -tattooWidth/2, -tattooHeight/2)
      
      // Add subtle highlight
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = 0.05
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-tattooWidth/2, -tattooHeight/2, tattooWidth * 0.3, tattooHeight * 0.3)
      
      // Restore context
      ctx.restore()
      
      animationRef.current = requestAnimationFrame(render)
    }
    
    render()
  }

  const captureARPhoto = () => {
    if (!renderCanvasRef.current) return
    
    const canvas = renderCanvasRef.current
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ar-tattoo-${design.style}-${Date.now()}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    }, 'image/jpeg', 0.95)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setShowControls(true)
    handleMove(e)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    handleMove(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e) => {
    e.preventDefault()
    setIsDragging(true)
    setShowControls(true)
    handleMove(e.touches[0])
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (!isDragging) return
    handleMove(e.touches[0])
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleMove = (e) => {
    if (!renderCanvasRef.current) return
    
    const canvas = renderCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setTattooPosition({ 
      x: Math.max(10, Math.min(90, x)), 
      y: Math.max(10, Math.min(90, y)) 
    })
  }

  const resetPosition = () => {
    setTattooPosition({ x: 50, y: 50 })
    setTattooSize(80)
    setTattooRotation(0)
    setOpacity(85)
    setBlur(0.5)
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
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
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

      {/* Hidden Processing Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Render Canvas - Full Screen */}
      <canvas
        ref={renderCanvasRef}
        className="absolute inset-0 w-full h-full object-cover touch-none cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !isDragging && setShowControls(!showControls)}
      />

      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">AR Tattoo Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={switchCamera}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              title="Switch camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Sliders className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Controls Panel */}
      {showAdvancedControls && showControls && (
        <div className="absolute top-16 right-4 bg-black/80 backdrop-blur-lg rounded-lg p-4 text-white min-w-[240px]">
          <h4 className="font-semibold mb-3">Advanced Settings</h4>
          
          <div className="space-y-4">
            {/* Opacity Control */}
            <div>
              <label className="text-sm mb-1 block">Opacity: {opacity}%</label>
              <input
                type="range"
                min="40"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
              />
            </div>

            {/* Blur Control */}
            <div>
              <label className="text-sm mb-1 block">Edge Blur: {blur}px</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={blur}
                onChange={(e) => setBlur(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
              />
            </div>

            {/* Rotation Control */}
            <div>
              <label className="text-sm mb-1 block">Rotation: {tattooRotation}°</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={tattooRotation}
                onChange={(e) => setTattooRotation(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none slider"
              />
            </div>

            {/* Skin Tone Display */}
            <div>
              <label className="text-sm mb-1 block">Detected Skin Tone</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border border-white/50"
                  style={{ backgroundColor: `rgb(${skinTone.r}, ${skinTone.g}, ${skinTone.b})` }}
                />
                <button
                  onClick={detectSkinTone}
                  className="text-xs bg-blue-500/20 hover:bg-blue-500/30 px-2 py-1 rounded"
                >
                  Re-detect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
            Drag to move tattoo
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