import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Pen, Eraser, RotateCcw, Download } from 'lucide-react'

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
  const [drawingMode, setDrawingMode] = useState('draw')
  const [brushSize, setBrushSize] = useState(initialBrushSize)
  const [history, setHistory] = useState([])
  const [historyStep, setHistoryStep] = useState(-1)

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
      ctx.drawImage(img, 0, 0)

      const maskCanvas = maskCanvasRef.current
      maskCanvas.width = img.width
      maskCanvas.height = img.height
      const maskCtx = maskCanvas.getContext('2d')
      maskCtx.fillStyle = 'black'
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

      setHistory([])
      setHistoryStep(-1)
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
    const maskData = maskCanvas.toDataURL()

    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(maskData)

    if (newHistory.length > 50) newHistory.shift()

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
    draw(coords.x, coords.y)
  }

  const draw = (x, y) => {
    if (!maskCanvasRef.current || !canvasRef.current) return

    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')

    maskCtx.globalCompositeOperation = drawingMode === 'draw' ? 'source-over' : 'destination-out'
    maskCtx.fillStyle = 'white'
    maskCtx.beginPath()
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2)
    maskCtx.fill()

    redrawCanvas()

    if (onMaskUpdate) {
      onMaskUpdate(maskCanvas.toDataURL())
    }
  }

  const continueDrawing = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const coords = getCoordinates(e)
    draw(coords.x, coords.y)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveToHistory()
    }
  }

  const redrawCanvas = () => {
    if (!canvasRef.current || !imageRef.current || !maskCanvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const maskCanvas = maskCanvasRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0)

    ctx.save()
    ctx.globalAlpha = 0.4

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = maskCanvas.width
    tempCanvas.height = maskCanvas.height
    const tempCtx = tempCanvas.getContext('2d')

    tempCtx.drawImage(maskCanvas, 0, 0)
    tempCtx.globalCompositeOperation = 'source-in'
    tempCtx.fillStyle = maskColor
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    ctx.drawImage(tempCanvas, 0, 0)
    ctx.restore()
  }

  const clearDrawing = () => {
    if (!maskCanvasRef.current || !canvasRef.current || !imageRef.current) return

    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')
    maskCtx.fillStyle = 'black'
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

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
    link.download = 'tattoo-mask.png'
    link.href = maskCanvasRef.current.toDataURL()
    link.click()
  }

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
            onClick={() => setDrawingMode('draw')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              drawingMode === 'draw'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Pen className="w-4 h-4" />
            Draw
          </button>
          <button
            onClick={() => setDrawingMode('erase')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              drawingMode === 'erase'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Eraser className="w-4 h-4" />
            Erase
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Size:</label>
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
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Clear all"
          >
            <RotateCcw className="w-5 h-5" />
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
        <p>• Click and drag to mark areas for the tattoo</p>
        <p>• Use Undo/Redo or Ctrl+Z/Ctrl+Y for mistakes</p>
        <p>• Be generous with coverage area for best results</p>
      </div>
    </div>
  )
})

DrawingCanvas.displayName = 'DrawingCanvas'

export default DrawingCanvas
