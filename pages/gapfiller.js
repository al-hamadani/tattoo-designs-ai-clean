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
  import tattooStyles from '../constants/tattooStyles'
  import Navigation from '../components/Navigation'
  import StyleSelector from '../components/generate/StyleSelector'
  import DesignGrid from '../components/generate/DesignGrid'
  import ImageUploadAndMask from '../components/generate/ImageUploadAndMask'
  import { buildTattooPrompt, buildTattooNegativePrompt } from '../lib/promptBuilder'
  import Layout from '../components/Layout'

  export default function GapFiller() {
  // Start with white canvas instead of requiring upload
  const [uploadedImage, setUploadedImage] = useState('white-canvas')
  const [selectedStyle, setSelectedStyle] = useState('minimalist')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState([])
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('stars')

  const fileInputRef = useRef(null)
  const drawingCanvasRef = useRef(null)

  // Enhanced theme options for gap fillers
  const gapFillerThemes = [
    { value: 'stars', label: 'Stars & Cosmos', description: 'Small stars, dots, celestial elements' },
    { value: 'floral', label: 'Floral Elements', description: 'Tiny flowers, leaves, botanical details' },
    { value: 'geometric', label: 'Geometric Shapes', description: 'Triangles, circles, minimal patterns' },
    { value: 'symbols', label: 'Symbolic Elements', description: 'Small meaningful symbols and icons' },
    { value: 'nature', label: 'Nature Details', description: 'Tiny animals, insects, natural elements' },
    { value: 'abstract', label: 'Abstract Forms', description: 'Flowing lines, organic shapes' },
    { value: 'ornamental', label: 'Ornamental', description: 'Decorative flourishes, filigree' },
    { value: 'dots', label: 'Dot Work', description: 'Stippling, dot patterns, pointillism' }
  ]

  const STYLE_SPECIFIC_TEMPLATES = {
    minimalist: {
      stars: 'delicate single-needle star patterns, fine line cosmic dots',
      floral: 'minimal botanical linework, simple leaf outlines',
      geometric: 'clean geometric shapes, fine line triangles and circles',
      symbols: 'simple single-line symbols, minimalist iconic shapes',
    },
    traditional: {
      stars: 'bold traditional stars, classic nautical star fillers',
      floral: 'simple traditional flower head, small bold leaves',
      symbols: 'classic traditional symbols, bold and simple icons',
    },
    blackwork: {
      geometric: 'solid black geometric fillers, negative space patterns',
      abstract: 'bold abstract black shapes, solid blackwork filler',
      ornamental: 'blackwork ornamental filigree, bold decorative patterns',
    },
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
        setGeneratedDesigns([])
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  // Enhanced generateGapFiller function
  const generateGapFiller = async () => {
    if (!drawingCanvasRef.current) {
      setError('Please draw the areas where you want gap fillers')
      return
    }
    
    setIsGenerating(true)
    setError('')
    setGeneratedDesigns([])
    
    try {
      const maskData = drawingCanvasRef.current.getMaskData()
      
      if (!maskData) {
        throw new Error('Please draw on the canvas to mark gap areas')
      }
      
      // Get the actual drawn content from the canvas
      const canvas = drawingCanvasRef.current.getMaskCanvas()
      if (!canvas) {
        throw new Error('Unable to get canvas data')
      }
      
      // Convert canvas to image data for size-based generation
      const canvasData = canvas.toDataURL('image/png')
      
      // Use custom prompt or theme description
      let basePrompt = customPrompt.trim()
      const selectedThemeData = gapFillerThemes.find(t => t.value === selectedTheme)
      
      if (!basePrompt) {
        basePrompt = selectedThemeData ? selectedThemeData.description : 'small gap filler elements'
      }
      
      // Build enhanced prompt for gap fillers
      const enhancedPrompt = buildTattooPrompt(basePrompt, selectedStyle, 'gapfiller', {
        theme: selectedTheme,
      })
      
      // Use enhanced negative prompts for gap fillers
      const enhancedNegativePrompt = buildTattooNegativePrompt('gapfiller')
      
      try {
        const response = await fetch('/api/generate-tattoo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            negativePrompt: enhancedNegativePrompt,
            style: selectedStyle,
            // Use the real canvas as the base image
            originalImage: canvasData,          // ⬅ SEND A VALID PNG DATA-URL
            maskData: maskData,
            guidanceScale: 9.0,
            gapFillerMode: true
            // TODO: Future implementation could use canvasData directly
            // to generate tattoo matching exact drawing size
            // drawingData: canvasData
          })
        })
        
        // Handle non-JSON responses
        let data
        const contentType = response.headers.get("content-type")
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json()
        } else {
          // If response is not JSON, read as text
          const text = await response.text()
          console.error('Non-JSON response from API:', text)
          data = {
            success: false,
            message: `Server error: ${text.substring(0, 100)}...`,
            error: 'Invalid response format'
          }
        }
        
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to generate gap filler designs')
        }
        
        // Handle both new (images array) and old (imageURL) format
        const finalImageUrl = data.images?.[0] || data.imageURL
        
        if (!finalImageUrl) {
          throw new Error('No image generated - please try again')
        }
        
        const newDesign = {
          id: Date.now(),
          url: finalImageUrl,
          style: selectedStyle,
          theme: selectedTheme,
          prompt: customPrompt || `${selectedTheme} gap filler`,
          enhancedPrompt: enhancedPrompt,
          metadata: data.metadata
        }
        
        setGeneratedDesigns([newDesign])

      } catch (err) {
        console.error('Gap Filler generation error:', err)
        setError(err.message || 'Failed to generate gap filler designs. Please try again.')
      } finally {
        setIsGenerating(false)
      }

    } catch (err) {
      console.error('Gap Filler generation error:', err)
      setError(err.message || 'Failed to generate gap filler designs. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async (design) => {
    if (!design?.url) return
    try {
      const response = await fetch(design.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `gap-filler-${design.style}-${Date.now()}.png`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <Layout
      title="Gap Filler Tattoo Generator"
      description="Create AI-powered gap filler tattoo designs. Upload a photo, mark the gaps, and get custom small designs that perfectly complement your existing tattoos."
      keywords="gap filler tattoo, tattoo filler ideas, small tattoo designs, tattoo gap fillers, space filler tattoos"
    >
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
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Step 1: Draw Your Gap Filler Areas</h3>
                <ImageUploadAndMask
                  uploadedImage={uploadedImage}
                  setUploadedImage={setUploadedImage}
                  fileInputRef={fileInputRef}
                  showCamera={showCamera}
                  setShowCamera={setShowCamera}
                  handleImageUpload={handleImageUpload}
                  DrawingCanvas={DrawingCanvas}
                  drawingCanvasRef={drawingCanvasRef}
                  hidePhotoOptions={true}
                  useWhiteCanvas={true}
                  penColor="#0066FF"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Draw circles or shapes in the gaps where you want filler tattoos. 
                      The AI will generate designs that fit perfectly in these spaces.
                    </p>
                  </div>

                  {/* Prompt input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your gap filler idea (optional)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g., tiny stars, geometric shapes, dots, floral elements"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                      rows={2}
                      maxLength={200}
                    />
                  </div>

                  {/* Style Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tattoo Style
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['minimalist', 'traditional', 'geometric', 'blackwork', 'neo-traditional', 'tribal'].map((style) => (
                        <button
                          key={style}
                          onClick={() => setSelectedStyle(style)}
                          className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                            selectedStyle === style
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Generate Button */}
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
                        Generating Gap Fillers...
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
                </ImageUploadAndMask>
              </motion.div>
            </div>
            
            {/* Results Section */}
            <div>
              <DesignGrid
                generatedDesigns={generatedDesigns}
                isGenerating={isGenerating}
                downloadImage={downloadImage}
                handleShareClick={() => {}}
                handleARClick={() => {}}
                toggleFavorite={() => {}}
                regenerateWithVariations={generateGapFiller}
                error={error}
                selectedDesign={null}
                setSelectedDesign={() => {}}
                showAR={false}
                showSocialSharing={false}
                RealSocialSharing={() => null}
              />
              
              {/* Updated Tips */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-green-900 mb-2">
                  Gap Filler Design Tips:
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Choose designs that complement your existing tattoo style</li>
                  <li>• Smaller, simpler designs work best for tight spaces</li>
                  <li>• Consider the overall flow and balance of your tattoo collection</li>
                  <li>• Dots, stars, and geometric shapes are versatile gap fillers</li>
                  <li>• Match the line weight and shading style to your existing work</li>
                </ul>
              </div>
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
    </Layout>
  )
  }