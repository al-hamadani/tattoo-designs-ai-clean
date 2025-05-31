// components/EnhancedARPreview.js
import { useState, useRef, useEffect } from 'react'
import { Camera, Download, RotateCcw, Maximize2, Minimize2, X, Settings } from 'lucide-react'

export default function EnhancedARPreview({ imageUrl, design, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tattooSize, setTattooSize] = useState(100) // Scale percentage
  const [tattooPosition, setTattooPosition] = useState({ x: 50, y: 50 }) // Percentage
  const [selectedAngle, setSelectedAngle] = useState('front')
  const [skinTone, setSkinTone] = useState('#f4c2a1') // Default skin tone
  const [showSettings, setShowSettings] = useState(false)

  const angles = [
    { id: 'front', name: 'Front View', description: 'Straight on view' },
    { id: 'side-left', name: 'Left Side', description: '45° left angle' },
    { id: 'side-right', name: 'Right Side', description: '45° right angle' },
    { id: 'back', name: 'Back View', description: 'Behind view' },
    { id: 'top', name: 'Top View', description: 'From above' }
  ]

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      setIsLoading(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
          detectSkinTone()
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

  const detectSkinTone = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    ctx.drawImage(video, 0, 0)
    
    // Sample skin tone from center area (face region)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 3
    const sampleSize = 50
    
    const imageData = ctx.getImageData(
      centerX - sampleSize/2, 
      centerY - sampleSize/2, 
      sampleSize, 
      sampleSize
    )
    
    let r = 0, g = 0, b = 0, count = 0
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      r += imageData.data[i]
      g += imageData.data[i + 1]
      b += imageData.data[i + 2]
      count++
    }
    
    if (count > 0) {
      r = Math.round(r / count)
      g = Math.round(g / count)
      b = Math.round(b / count)
      
      const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      setSkinTone(hexColor)
    }
  }

  const adjustTattooForSkinTone = (imageUrl, skinTone) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw original tattoo
        ctx.drawImage(img, 0, 0)
        
        // Apply skin tone blending
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = skinTone + '20' // 20% opacity
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Restore normal blending and add contrast
        ctx.globalCompositeOperation = 'normal'
        ctx.filter = 'contrast(1.2) brightness(0.9)'
        ctx.drawImage(canvas, 0, 0)
        
        resolve(canvas.toDataURL())
      }
      
      img.crossOrigin = 'anonymous'
      img.src = imageUrl
    })
  }

  const captureARPhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame
    ctx.drawImage(video, 0, 0)
    
    // Get skin-tone adjusted tattoo
    const adjustedTattoo = await adjustTattooForSkinTone(imageUrl, skinTone)
    
    // Draw tattoo overlay
    const tattooImg = new Image()
    tattooImg.onload = () => {
      const scale = tattooSize / 100
      const width = tattooImg.width * scale * 0.3 // Base size multiplier
      const height = tattooImg.height * scale * 0.3
      
      const x = (canvas.width * tattooPosition.x / 100) - width / 2
      const y = (canvas.height * tattooPosition.y / 100) - height / 2
      
      // Add shadow for realism
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      ctx.drawImage(tattooImg, x, y, width, height)
      
      // Save the final image
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ar-tattoo-preview-${Date.now()}.jpg`
        link.click()
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.9)
    }
    
    tattooImg.src = adjustedTattoo
  }

  const handleVideoClick = (e) => {
    if (!videoRef.current) return
    
    const rect = videoRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setTattooPosition({ x, y })
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md">
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <h3 className="text-white font-semibold">AR Tattoo Preview</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover cursor-crosshair"
          onClick={handleVideoClick}
        />
        
        {/* Tattoo Overlay */}
        {imageUrl && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${tattooPosition.x}%`,
              top: `${tattooPosition.y}%`,
              transform: `translate(-50%, -50%) scale(${tattooSize / 100})`,
              filter: `brightness(0.9) contrast(1.1)`,
              mixBlendMode: 'multiply'
            }}
          >
            <img
              src={imageUrl}
              alt="Tattoo overlay"
              className="w-32 h-32 object-contain opacity-80"
              style={{
                filter: `sepia(0.3) hue-rotate(10deg)`
              }}
            />
          </div>
        )}
        
        {/* Crosshair at tattoo position */}
        <div
          className="absolute w-6 h-6 border-2 border-white/50 rounded-full pointer-events-none"
          style={{
            left: `${tattooPosition.x}%`,
            top: `${tattooPosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/50 backdrop-blur-sm">
        {/* Size Control */}
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">
            Size: {tattooSize}%
          </label>
          <input
            type="range"
            min="25"
            max="200"
            value={tattooSize}
            onChange={(e) => setTattooSize(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Angle Selection */}
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">View Angle</label>
          <div className="flex gap-2 overflow-x-auto">
            {angles.map((angle) => (
              <button
                key={angle.id}
                onClick={() => setSelectedAngle(angle.id)}
                className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  selectedAngle === angle.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {angle.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={captureARPhoto}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Save AR Photo
          </button>
          
          <button
            onClick={() => setTattooPosition({ x: 50, y: 50 })}
            className="bg-white/20 text-white p-3 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={detectSkinTone}
            className="bg-white/20 text-white p-3 rounded-lg hover:bg-white/30 transition-colors"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute right-4 top-16 bg-black/80 backdrop-blur-lg rounded-lg p-4 text-white min-w-[200px]">
          <h4 className="font-semibold mb-3">AR Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Skin Tone</label>
              <input
                type="color"
                value={skinTone}
                onChange={(e) => setSkinTone(e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            
            <button
              onClick={detectSkinTone}
              className="w-full bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Auto-Detect Skin Tone
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}