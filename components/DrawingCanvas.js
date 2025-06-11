import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Pen, RotateCcw, Download } from 'lucide-react'

const DrawingCanvas = forwardRef(({
  image,
  onMaskUpdate,
  width = 800,
  height = 600,
  initialBrushSize = 20,
  maskColor = '#3B82F6',
  eraseColor = '#EF4444'
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
      return maskCanvasRef.current.toDataURL('image/png')
    },
    getMaskCanvas: () => maskCanvasRef.current,
    clearMask: () => clearDrawing(),
    downloadMask: () => downloadMask()
  }))

  // Initialize canvases when image loads
  useEffect(() => {
    if (!image || !canvasRef.current || !maskCanvasRef.current) return

    const img = new Image()
    img.onload = () => {
      imageRef.current = img

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw the original image
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // Initialize mask canvas with transparent background
      const maskCanvas = maskCanvasRef.current
      maskCanvas.width = img.width
      maskCanvas.height = img.height
      const maskCtx = maskCanvas.getContext('2d')
      
      // Clear mask canvas (transparent by default)
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

      // Save initial state
      saveToHistory()
    }
    img.src = image
  }, [image])

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
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return
    
    const maskData = maskCanvas.toDataURL()

    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(maskData)

    if (newHistory.length > 20) newHistory.shift()

    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1
      setHistoryStep(newStep)
      restoreFromHistory(history[newStep])
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1
      setHistoryStep(newStep)
      restoreFromHistory(history[newStep])
    }
  }

  const restoreFromHistory = (dataUrl) => {
    const img = new Image()
    img.onload = () => {
      const maskCanvas = maskCanvasRef.current
      const maskCtx = maskCanvas.getContext('2d')
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
      maskCtx.drawImage(img, 0, 0)
      redrawCanvas()
    }
    img.src = dataUrl
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const coords = getCoordinates(e)
    setLastPoint(coords)
    
    // Draw a single dot
    drawDot(coords.x, coords.y)
  }

  const drawDot = (x, y) => {
    if (!maskCanvasRef.current) return

    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')

    // Draw white circle on mask (this represents the areas to fill)
    maskCtx.globalCompositeOperation = 'source-over'
    maskCtx.fillStyle = 'white'
    maskCtx.beginPath()
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2)
    maskCtx.fill()

    redrawCanvas()

    if (onMaskUpdate) {
      onMaskUpdate(maskCanvas.toDataURL())
    }
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
    if (!canvasRef.current || !imageRef.current || !maskCanvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const maskCanvas = maskCanvasRef.current

    // Clear and draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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

  const clearDrawing = () => {
    if (!maskCanvasRef.current || !canvasRef.current || !imageRef.current) return

    // Clear mask canvas
    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

    // Redraw main canvas with just the image
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0)

    saveToHistory()

    if (onMaskUpdate) {
      onMaskUpdate(null)
    }
  }

  const downloadMask = () => {
    if (!maskCanvasRef.current) return

    const link = document.createElement('a')
    link.download = 'gap-filler-mask.png'
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
            Draw Gap Areas
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
            className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCcw className="w-5 h-5 scale-x-[-1]" />
          </button>
          <button
            onClick={clearDrawing}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            title="Clear all"
          >
            Clear
          </button>
          <button
            onClick={downloadMask}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Download mask"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden inline-block">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto cursor-crosshair block"
          style={{ maxHeight: '600px' }}
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={continueDrawing}
          onTouchEnd={stopDrawing}
        />
        <canvas
          ref={maskCanvasRef}
          className="hidden"
        />
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600">
        <p>• Click and drag to mark gaps where you want filler tattoos</p>
        <p>• Use Undo/Redo or Ctrl+Z/Ctrl+Y to correct mistakes</p>
        <p>• Mark multiple separate areas for different filler designs</p>
        <p>• Clear to start over with a clean canvas</p>
      </div>
    </div>
  )
})

DrawingCanvas.displayName = 'DrawingCanvas'

export default DrawingCanvas