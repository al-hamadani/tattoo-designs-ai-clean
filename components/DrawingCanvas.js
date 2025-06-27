// components/DrawingCanvas.js - Updated version
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Pen, RotateCcw, Download } from 'lucide-react'

const DrawingCanvas = forwardRef(({
  image,
  onMaskUpdate,
  width = 800,
  height = 600,
  initialBrushSize = 20,
  maskColor = '#3B82F6',
  eraseColor = '#EF4444',
  useWhiteCanvas = false
}, ref) => {
  const canvasRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const imageRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(initialBrushSize)
  const [history, setHistory] = useState([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [lastPoint, setLastPoint] = useState(null)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getMaskData: () => {
      if (!maskCanvasRef.current) return null
      // Check if mask has any actual content
      if (!hasMaskContent()) {
        return null // Return null for empty masks instead of empty data URL
      }
      return maskCanvasRef.current.toDataURL('image/png')
    },
    getMaskCanvas: () => maskCanvasRef.current,
    clearMask: () => clearDrawing(),
    downloadMask: () => downloadMask(),
    hasMaskContent: () => hasMaskContent() // Expose validation method
  }))

  // Add this new function after the useImperativeHandle block
  const hasMaskContent = () => {
    if (!maskCanvasRef.current) return false
    
    const maskCanvas = maskCanvasRef.current
    const ctx = maskCanvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const data = imageData.data
    
    // Check for white pixels (drawn content) instead of just alpha
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]     // Red
      const g = data[i + 1] // Green  
      const b = data[i + 2] // Blue
      const a = data[i + 3] // Alpha
      
      // Check if pixel is white-ish with good alpha (indicates drawn content)
      if (r > 200 && g > 200 && b > 200 && a > 200) {
        return true
      }
    }
    
    return false
  }

  // Initialize canvases when image loads or for white canvas
  useEffect(() => {
    if (!canvasRef.current || !maskCanvasRef.current) return

    // For white canvas mode, we don't need an image
    if (image === 'white-canvas' || useWhiteCanvas) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = 800
      canvas.height = 600
      
      // Fill with white background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Initialize mask canvas
      const maskCanvas = maskCanvasRef.current
      maskCanvas.width = 800
      maskCanvas.height = 600
      const maskCtx = maskCanvas.getContext('2d')
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

      saveToHistory()
      return
    }

    // Regular image loading
    if (image) {
      const img = new Image()
      img.onload = () => {
        imageRef.current = img

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        // Initialize mask canvas
        const maskCanvas = maskCanvasRef.current
        maskCanvas.width = img.width
        maskCanvas.height = img.height
        const maskCtx = maskCanvas.getContext('2d')
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

        saveToHistory()
      }
      img.src = image
    }
  }, [image, useWhiteCanvas])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX, clientY
    if (e.touches) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const saveToHistory = () => {
    if (!maskCanvasRef.current) return
    
    const newHistory = [...history.slice(0, historyStep + 1)]
    newHistory.push(maskCanvasRef.current.toDataURL())
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1
      setHistoryStep(newStep)
      
      const img = new Image()
      img.onload = () => {
        const maskCtx = maskCanvasRef.current.getContext('2d')
        maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
        maskCtx.drawImage(img, 0, 0)
        redrawCanvas()
        
        if (onMaskUpdate) {
          onMaskUpdate(maskCanvasRef.current.toDataURL())
        }
      }
      img.src = history[newStep]
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1
      setHistoryStep(newStep)
      
      const img = new Image()
      img.onload = () => {
        const maskCtx = maskCanvasRef.current.getContext('2d')
        maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
        maskCtx.drawImage(img, 0, 0)
        redrawCanvas()
        
        if (onMaskUpdate) {
          onMaskUpdate(maskCanvasRef.current.toDataURL())
        }
      }
      img.src = history[newStep]
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const coords = getCoordinates(e)
    setIsDrawing(true)
    setLastPoint(coords)
    
    // Draw initial point
    drawLine(coords.x, coords.y, coords.x, coords.y)
  }

  const drawLine = (fromX, fromY, toX, toY) => {
    if (!maskCanvasRef.current) return
    
    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')

    // Calculate distance and steps for smooth line
    const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2)
    const steps = Math.max(1, Math.floor(distance / (brushSize * 0.1)))

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = fromX + (toX - fromX) * t
      const y = fromY + (toY - fromY) * t

      maskCtx.globalCompositeOperation = 'source-over'
      maskCtx.fillStyle = 'white'
      maskCtx.beginPath()
      maskCtx.arc(x, y, brushSize, 0, Math.PI * 2)
      maskCtx.fill()
    }

    redrawCanvas()

    if (onMaskUpdate) {
      onMaskUpdate(maskCanvas.toDataURL())
    }
  }

  const continueDrawing = (e) => {
    if (!isDrawing || !lastPoint) return
    e.preventDefault()
    
    const coords = getCoordinates(e)
    
    // Draw line from last point to current point
    drawLine(lastPoint.x, lastPoint.y, coords.x, coords.y)
    setLastPoint(coords)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      setLastPoint(null)
      saveToHistory()
    }
  }

  const redrawCanvas = () => {
    if (!canvasRef.current || !maskCanvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const maskCanvas = maskCanvasRef.current

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    if (useWhiteCanvas || image === 'white-canvas') {
      // Use white background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw the mask directly in the pen color
      const maskData = maskCanvas.toDataURL()
      const maskImg = new Image()
      maskImg.onload = () => {
        // Create temporary canvas for colored mask
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext('2d')
        
        // Draw mask
        tempCtx.drawImage(maskImg, 0, 0)
        
        // Apply color to white areas of mask
        tempCtx.globalCompositeOperation = 'source-in'
        tempCtx.fillStyle = maskColor
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        
        // Draw colored mask on main canvas
        ctx.drawImage(tempCanvas, 0, 0)
      }
      maskImg.src = maskData
    } else if (imageRef.current) {
      // Original behavior - draw image with overlay
      ctx.drawImage(imageRef.current, 0, 0)

      // Create overlay for visualization
      ctx.save()
      ctx.globalAlpha = 0.4

      // Create temporary canvas for colored overlay
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = maskCanvas.width
      tempCanvas.height = maskCanvas.height
      const tempCtx = tempCanvas.getContext('2d')

      // Draw mask
      tempCtx.drawImage(maskCanvas, 0, 0)
      
      // Apply color to white areas of mask
      tempCtx.globalCompositeOperation = 'source-in'
      tempCtx.fillStyle = maskColor
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

      // Draw colored overlay on main canvas
      ctx.drawImage(tempCanvas, 0, 0)
      ctx.restore()
    }
  }

  const clearDrawing = () => {
    if (!maskCanvasRef.current || !canvasRef.current) return

    // Clear mask canvas
    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

    // Redraw main canvas
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    if (useWhiteCanvas || image === 'white-canvas') {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0)
    }

    saveToHistory()

    if (onMaskUpdate) {
      onMaskUpdate(null)
    }
  }

  const downloadMask = () => {
    if (!maskCanvasRef.current) return

    const link = document.createElement('a')
    link.download = 'tattoo-design-mask.png'
    link.href = maskCanvasRef.current.toDataURL()
    link.click()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          redo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [historyStep, history])

  return (
    <div className="space-y-4">
      {/* Drawing Tools */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-blue-600 text-white"
          >
            <Pen className="w-4 h-4" />
            Draw Areas
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Brush Size:</label>
          <input
            type="range"
            min="5"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600 w-12">{brushSize}px</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className={`p-2 rounded-lg transition-colors ${
              historyStep <= 0
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={clearDrawing}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative rounded-xl overflow-hidden bg-gray-100">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto cursor-crosshair"
          style={{ maxHeight: '600px' }}
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={continueDrawing}
          onTouchEnd={stopDrawing}
        />
        
        {/* Hidden mask canvas */}
        <canvas
          ref={maskCanvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
})

DrawingCanvas.displayName = 'DrawingCanvas'

export default DrawingCanvas