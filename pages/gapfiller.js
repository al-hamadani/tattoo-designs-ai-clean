import { useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Upload, Camera, Sparkles, Loader2, Image as ImageIcon,
  Info, Download, RefreshCw
} from 'lucide-react'
import SEO from '../components/SEO'
import DrawingCanvas from '../components/DrawingCanvas'
import CameraCapture from '../components/CameraCapture'

export default function GapFiller() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('minimalist')
  const [selectedTheme, setSelectedTheme] = useState('floral')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState([])
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
        setGeneratedDesigns([])
      }
      reader.readAsDataURL(file)
    }
  }

  const generateGapFiller = async () => {
    if (!drawingCanvasRef.current) return
    
    setIsGenerating(true)
    setError('')
    setGeneratedDesigns([])
    
    try {
      // Get mask data from drawing canvas
      const maskData = drawingCanvasRef.current.getMaskData()
      
      // Enhanced prompt for gap filler designs
      const basePrompt = customPrompt.trim() || `${selectedTheme} themed gap filler elements`
      const gapFillerPrompt = `${basePrompt}, ${selectedStyle} style tattoo design, 
        small detailed elements, perfect for filling spaces between existing tattoos, 
        complementary design, tattoo filler piece, clean design, white background, 
        suitable for small spaces, cohesive with existing tattoos,
        no text, no words, no letters, design only`
      
      // Generate multiple variations
      const variations = []
      for (let i = 0; i < 3; i++) {
        const response = await fetch('/api/generate-tattoo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: gapFillerPrompt + ` variation ${i + 1}`,
            style: selectedStyle,
            complexity: 'simple',
            placement: 'custom-gapfiller',
            size: 'small',
            maskData: maskData
          })
        })
        
        const data = await response.json()
        if (data.success) {
          variations.push({
            id: Date.now() + i,
            url: data.imageURL,
            style: selectedStyle,
            theme: selectedTheme
          })
        }
      }
      
      setGeneratedDesigns(variations)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate gap filler designs')
    } finally {
      setIsGenerating(false)
    }
  }

  const tattooStyles = [
    { value: 'minimalist', label: 'Minimalist', description: 'Simple, clean lines' },
    { value: 'dotwork', label: 'Dotwork', description: 'Stippled texture' },
    { value: 'fine-line', label: 'Fine Line', description: 'Delicate details' },
    { value: 'geometric', label: 'Geometric', description: 'Small shapes' },
    { value: 'traditional', label: 'Traditional', description: 'Classic small motifs' },
    { value: 'ornamental', label: 'Ornamental', description: 'Decorative elements' },
    { value: 'mandala', label: 'Mandala', description: 'Small circular patterns' },
    { value: 'abstract', label: 'Abstract', description: 'Artistic shapes' }
  ]

  const themes = [
    { value: 'floral', label: 'Floral', icon: '🌸' },
    { value: 'stars', label: 'Stars & Cosmos', icon: '⭐' },
    { value: 'nature', label: 'Nature', icon: '🌿' },
    { value: 'geometric', label: 'Geometric', icon: '◆' },
    { value: 'symbols', label: 'Symbols', icon: '☯' },
    { value: 'animals', label: 'Small Animals', icon: '🦋' },
    { value: 'abstract', label: 'Abstract', icon: '🎨' },
    { value: 'ornamental', label: 'Ornamental', icon: '✨' }
  ]

  return (
    <>
      <Head>
        <title>Gap Filler Tattoo Generator - TattooDesignsAI</title>
        <meta name="description" content="Generate perfect gap filler tattoo designs to complete your tattoo collection with AI" />
      </Head>
      
      <SEO 
        title="Gap Filler Tattoo Generator"
        description="Create AI-powered gap filler tattoo designs. Upload a photo, mark the gaps, and get custom small designs that perfectly complement your existing tattoos."
        keywords="gap filler tattoo, tattoo filler ideas, small tattoo designs, tattoo gap fillers, space filler tattoos"
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
              <Link href="/coverup" className="hover:text-blue-600 transition-colors">Cover Up</Link>
              <Link href="/gapfiller" className="text-blue-600 font-medium">Gap Filler</Link>
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
              Gap Filler Tattoo Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Complete your tattoo collection with perfect gap fillers. Mark the spaces 
              between your existing tattoos and get AI-designed elements that tie everything together.
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
                <h3 className="text-lg font-semibold mb-4">Step 1: Upload Your Tattoo Photo</h3>
                
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Upload a photo showing your existing tattoos and the gaps you want to fill
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
                        Draw circles or shapes in the gaps where you want filler tattoos. 
                        The AI will generate designs that fit perfectly in these spaces.
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
                        setGeneratedDesigns([])
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Upload different photo
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Theme Selection */}
              {uploadedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Step 2: Choose Theme & Style</h3>
                  
                  <div className="space-y-4">
                    {/* Text Input for Design Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Describe your gap filler design (optional)
                      </label>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g., 'small stars and dots' or 'tiny flowers and leaves'"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                        rows={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank to use theme-based designs
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Theme</label>
                      <div className="grid grid-cols-4 gap-2">
                        {themes.map(theme => (
                          <button
                            key={theme.value}
                            onClick={() => setSelectedTheme(theme.value)}
                            className={`p-3 rounded-lg text-center transition-all ${
                              selectedTheme === theme.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="text-2xl mb-1">{theme.icon}</div>
                            <div className="text-xs">{theme.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {tattooStyles.map(style => (
                          <button
                            key={style.value}
                            onClick={() => setSelectedStyle(style.value)}
                            className={`p-2 rounded-lg text-left transition-all ${
                              selectedStyle === style.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-medium text-sm">{style.label}</div>
                            <div className={`text-xs ${
                              selectedStyle === style.value ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {style.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
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
                    onClick={generateGapFiller}
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
                        Generating Gap Filler Designs...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Gap Fillers
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
                <h3 className="text-lg font-semibold mb-4">Your Gap Filler Designs</h3>
                
                {generatedDesigns.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {generatedDesigns.map((design, index) => (
                        <div key={design.id} className="space-y-2">
                          <div className="bg-gray-50 rounded-lg p-2 aspect-square flex items-center justify-center">
                            <img
                              src={design.url}
                              alt={`Gap filler design ${index + 1}`}
                              className="w-full h-full object-contain rounded"
                            />
                          </div>
                          <button className="w-full py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors">
                            Use This
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={generateGapFiller}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate More Variations
                      </button>
                      
                      <button className="w-full py-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors font-medium flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" />
                        Download All Designs
                      </button>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">
                        Gap Filler Tips:
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• These designs complement {selectedTheme} themed tattoos</li>
                        <li>• {selectedStyle} style works well for small spaces</li>
                        <li>• Consider the flow between existing tattoos</li>
                        <li>• Small designs heal faster and age well</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">✨</div>
                    <p>Upload a photo and mark the gaps</p>
                    <p className="text-sm mt-2">Perfect filler designs will appear here</p>
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
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}