import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Upload, Camera, Eraser, Pen, RotateCcw, Download, 
  ArrowRight, Info, Sparkles, Loader2, Image as ImageIcon
} from 'lucide-react'
import SEO from '../components/SEO'
import CameraCapture from '../components/CameraCapture'

export default function CoverUp() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingMode, setDrawingMode] = useState('draw') // 'draw' or 'erase'
  const [brushSize, setBrushSize] = useState(20)
  const [maskedArea, setMaskedArea] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('blackwork')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState([])
  const [error, setError] = useState('')
  
  const [showCamera, setShowCamera] = useState(false)
  
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const fileInputRef = useRef(null)
  const maskCanvasRef = useRef(null)

  // Initialize canvas when image is loaded
  useEffect(() => {
    if (uploadedImage && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = imageRef.current
      
      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0)
      
      // Initialize mask canvas
      if (maskCanvasRef.current) {
        const maskCanvas = maskCanvasRef.current
        maskCanvas.width = img.width
        maskCanvas.height = img.height
        const maskCtx = maskCanvas.getContext('2d')
        maskCtx.fillStyle = 'black'
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
      }
    }
  }, [uploadedImage])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
        setGeneratedDesigns([])
        setMaskedArea(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const startDrawing = (e) => {
    if (!canvasRef.current) return
    setIsDrawing(true)
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    
    draw(x, y)
  }

  const draw = (x, y) => {
    if (!isDrawing || !canvasRef.current || !maskCanvasRef.current) return
    
    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Scale coordinates
    const scaleX = maskCanvas.width / canvas.offsetWidth
    const scaleY = maskCanvas.height / canvas.offsetHeight
    const scaledX = x * scaleX
    const scaledY = y * scaleY
    
    maskCtx.globalCompositeOperation = drawingMode === 'draw' ? 'source-over' : 'destination-out'
    maskCtx.fillStyle = 'white'
    maskCtx.beginPath()
    maskCtx.arc(scaledX, scaledY, brushSize * scaleX, 0, Math.PI * 2)
    maskCtx.fill()
    
    // Visual feedback on main canvas
    ctx.globalAlpha = 0.3
    ctx.fillStyle = drawingMode === 'draw' ? '#3B82F6' : '#EF4444'
    ctx.beginPath()
    ctx.arc(scaledX, scaledY, brushSize * scaleX, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    draw(x, y)
  }

  const handleTouchMove = (e) => {
    if (!isDrawing || !canvasRef.current) return
    e.preventDefault()
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const y = e.touches[0].clientY - rect.top
    
    draw(x, y)
  }

  const clearDrawing = () => {
    if (!canvasRef.current || !imageRef.current || !maskCanvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0)
    
    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext('2d')
    maskCtx.fillStyle = 'black'
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    
    setMaskedArea(null)
  }

  const generateCoverUp = async () => {
    if (!maskCanvasRef.current) return
    
    setIsGenerating(true)
    setError('')
    setGeneratedDesigns([])
    
    try {
      // Get mask data
      const maskCanvas = maskCanvasRef.current
      const maskData = maskCanvas.toDataURL('image/png')
      setMaskedArea(maskData)
      
      // Enhanced prompt for cover-up designs
      const coverUpPrompt = `professional tattoo design for cover-up, ${selectedStyle} style, 
        bold black ink with heavy shading, dense pattern work, high contrast, 
        designed to effectively cover existing tattoo, intricate details, 
        complete coverage design, tattoo stencil ready, white background`
      
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: coverUpPrompt,
          style: selectedStyle,
          complexity: 'complex',
          placement: 'custom-coverup',
          size: 'custom',
          maskData: maskData // Include mask for future API enhancement
        })
      })
      
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Generation failed')
      
      setGeneratedDesigns([{
        id: Date.now(),
        url: data.imageURL,
        style: selectedStyle
      }])
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate cover-up design')
    } finally {
      setIsGenerating(false)
    }
  }

  const tattooStyles = [
    { value: 'blackwork', label: 'Blackwork', description: 'Best for complete coverage' },
    { value: 'traditional', label: 'Traditional', description: 'Bold lines and solid fills' },
    { value: 'japanese', label: 'Japanese', description: 'Dense patterns and flow' },
    { value: 'geometric', label: 'Geometric', description: 'Structured coverage' },
    { value: 'mandala', label: 'Mandala', description: 'Circular dense patterns' },
    { value: 'tribal', label: 'Tribal', description: 'Bold black patterns' },
    { value: 'ornamental', label: 'Ornamental', description: 'Decorative coverage' },
    { value: 'dotwork', label: 'Dotwork', description: 'Dense stippling' }
  ]

  return (
    <>
      <Head>
        <title>Cover Up Tattoo Generator - TattooDesignsAI</title>
        <meta name="description" content="Generate custom cover-up tattoo designs that effectively conceal unwanted tattoos with AI" />
      </Head>
      
      <SEO 
        title="Cover Up Tattoo Generator"
        description="Create AI-powered cover-up tattoo designs. Upload a photo, mark the area to cover, and get custom designs that effectively conceal unwanted tattoos."
        keywords="cover up tattoo, tattoo cover up ideas, tattoo cover up designs, hide old tattoo"
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              TattooDesignsAI
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/generate" className="hover:text-blue-600 transition-colors">Generate</Link>
              <Link href="/coverup" className="text-blue-600 font-medium">Cover Up</Link>
              <Link href="/styles" className="hover:text-blue-600 transition-colors">Styles</Link>
              <Link href="/gallery" className="hover:text-blue-600 transition-colors">Gallery</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="min-h-screen pt-20 pb-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Cover Up Tattoo Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform unwanted tattoos into beautiful new designs. Upload a photo, 
              mark what you want to cover, and let AI create the perfect cover-up.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload and Drawing Section */}
            <div className="space-y-6">
              {/* Upload Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Step 1: Upload Your Photo</h3>
                
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Upload a clear photo showing the tattoo you want to cover
                    </p>
                    <div className="flex justify-center gap-4">
                      <label className="cursor-pointer">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          Upload Photo
                        </div>
                      </label>
                      <button 
                        onClick={() => setShowCamera(true)}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Take Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Use the pen tool to mark the exact area you want to cover. 
                        Be generous with the coverage area for best results.
                      </p>
                    </div>
                    
                    {/* Drawing Tools */}
                    <div className="flex items-center gap-4 mb-4">
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
                      <div className="flex items-center gap-2 ml-auto">
                        <label className="text-sm text-gray-600">Brush Size:</label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-600 w-8">{brushSize}</span>
                      </div>
                      <button
                        onClick={clearDrawing}
                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Clear drawing"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Canvas */}
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        ref={imageRef}
                        src={uploadedImage}
                        alt="Uploaded tattoo"
                        className="hidden"
                        onLoad={() => {
                          // Trigger canvas setup
                          if (canvasRef.current && imageRef.current) {
                            const canvas = canvasRef.current
                            const img = imageRef.current
                            canvas.width = img.width
                            canvas.height = img.height
                            const ctx = canvas.getContext('2d')
                            ctx.drawImage(img, 0, 0)
                          }
                        }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="max-w-full h-auto cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={handleMouseMove}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={stopDrawing}
                      />
                      <canvas
                        ref={maskCanvasRef}
                        className="hidden"
                      />
                    </div>
                    
                    <button
                      onClick={() => {
                        setUploadedImage(null)
                        setGeneratedDesigns([])
                        setMaskedArea(null)
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Upload different photo
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Style Selection */}
              {uploadedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Step 2: Choose Cover-Up Style</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {tattooStyles.map(style => (
                      <button
                        key={style.value}
                        onClick={() => setSelectedStyle(style.value)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          selectedStyle === style.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="font-medium">{style.label}</div>
                        <div className={`text-xs mt-1 ${
                          selectedStyle === style.value ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {style.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Generate Button */}
              {uploadedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    onClick={generateCoverUp}
                    disabled={isGenerating}
                    className={`w-full py-4 rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2 ${
                      isGenerating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Cover-Up Design...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Cover-Up Design
                      </>
                    )}
                  </button>
                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Results Section */}
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24"
              >
                <h3 className="text-lg font-semibold mb-4">Your Cover-Up Design</h3>
                
                {generatedDesigns.length > 0 ? (
                  <div className="space-y-4">
                    {generatedDesigns.map(design => (
                      <div key={design.id} className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <img
                            src={design.url}
                            alt="Generated cover-up design"
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                        
                        {/* Overlay Preview */}
                        {maskedArea && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Preview on your tattoo:
                            </h4>
                            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={uploadedImage}
                                alt="Original"
                                className="w-full h-auto"
                              />
                              <img
                                src={design.url}
                                alt="Overlay"
                                className="absolute inset-0 w-full h-full object-contain opacity-70 mix-blend-multiply"
                                style={{
                                  maskImage: `url(${maskedArea})`,
                                  WebkitMaskImage: `url(${maskedArea})`,
                                  maskSize: 'cover',
                                  WebkitMaskSize: 'cover'
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-3">
                          <button className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" />
                            Download Design
                          </button>
                          <button className="flex-1 py-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors font-medium">
                            Try Another Style
                          </button>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">
                            Cover-Up Tips:
                          </h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• This design uses {selectedStyle} style for maximum coverage</li>
                            <li>• Dark, bold designs work best for covering existing tattoos</li>
                            <li>• Consult with your artist about feasibility</li>
                            <li>• Multiple sessions may be needed for complete coverage</li>
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">🎨</div>
                    <p>Upload a photo and mark the area to cover</p>
                    <p className="text-sm mt-2">Your custom cover-up design will appear here</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={(image) => {
            setUploadedImage(image)
            setGeneratedDesigns([])
            setMaskedArea(null)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}