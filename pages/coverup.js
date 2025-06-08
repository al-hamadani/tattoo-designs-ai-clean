import { useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Upload, Camera, Sparkles, Loader2, Image as ImageIcon,
  Info, Download
} from 'lucide-react'
import SEO from '../components/SEO'
import DrawingCanvas from '../components/DrawingCanvas'
import CameraCapture from '../components/CameraCapture'

export default function CoverUp() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('blackwork')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesign, setGeneratedDesign] = useState(null) // Changed to single design
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  
  const fileInputRef = useRef(null)
  const drawingCanvasRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
        setGeneratedDesign(null) // Reset to null for single design
      }
      reader.readAsDataURL(file)
    }
  }

  const generateCoverUp = async () => {
    if (!drawingCanvasRef.current) return
    
    setIsGenerating(true)
    setError('')
    setGeneratedDesign(null)
    
    try {
      // Get mask data from drawing canvas
      const maskData = drawingCanvasRef.current.getMaskData()
      
      // Enhanced prompt for cover-up designs
      const basePrompt = customPrompt.trim() || 'professional cover-up tattoo design'
      const coverUpPrompt = `${basePrompt}, ${selectedStyle} style, 
        bold black ink with heavy shading, dense pattern work, high contrast, 
        designed to effectively cover existing tattoo, intricate details, 
        complete coverage design, tattoo stencil ready, white background,
        no text, no words, no letters, design only`
      
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: coverUpPrompt,
          style: selectedStyle,
          complexity: 'complex',
          placement: 'custom-coverup',
          size: 'custom',
          maskData: maskData
        })
      })
      
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Generation failed')
      
      // Set single design instead of array
      setGeneratedDesign({
        id: Date.now(),
        url: data.imageURL,
        style: selectedStyle,
        prompt: basePrompt
      })
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate cover-up design')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async (imageUrl, design) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `coverup-${design.style}-${Date.now()}.jpg`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download image')
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
              <Link href="/gapfiller" className="hover:text-blue-600 transition-colors">Gap Filler</Link>
              <Link href="/styles" className="hover:text-blue-600 transition-colors">Styles</Link>
              <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
              <Link href="/gallery" className="hover:text-blue-600 transition-colors">Gallery</Link>
              <Link href="/generate" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all hover:scale-105">
                Try Free
              </Link>
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        Draw over the exact area you want to cover. 
                        Be generous with the coverage area for best results.
                      </p>
                    </div>
                    
                    {/* Drawing Canvas */}
                    <DrawingCanvas
                      ref={drawingCanvasRef}
                      image={uploadedImage}
                      maskColor="#3B82F6"
                      eraseColor="#ffffff"
                    />
                    
                    <button
                      onClick={() => {
                        setUploadedImage(null)
                        setGeneratedDesign(null)
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
                  
                  {/* Text Input for Design Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your cover-up design (optional)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g., 'phoenix rising from ashes' or 'geometric mandala with flowers'"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                      rows={2}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank for AI to create optimal cover-up design based on the marked area
                    </p>
                  </div>
                  
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
                
                {generatedDesign ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={generatedDesign.url}
                        alt="Generated cover-up design"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                    
                    {/* Preview on your tattoo */}
                    {uploadedImage && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Preview on your tattoo:
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={uploadedImage}
                              alt="Original"
                              className="w-full h-auto"
                            />
                            <img
                              src={generatedDesign.url}
                              alt="Cover-up overlay"
                              className="absolute inset-0 w-full h-full object-contain opacity-80 mix-blend-multiply"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => downloadImage(generatedDesign.url, generatedDesign)}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Design
                      </button>
                      <button 
                        onClick={generateCoverUp}
                        className="flex-1 py-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors font-medium"
                      >
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
            setGeneratedDesign(null)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}