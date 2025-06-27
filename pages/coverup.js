// pages/coverup.js - Updated version
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
import StyleSelector from '../components/generate/StyleSelector'
import DesignGrid from '../components/generate/DesignGrid'
import ImageUploadAndMask from '../components/generate/ImageUploadAndMask'
import { buildTattooPrompt, buildTattooNegativePrompt } from '../lib/promptBuilder'
import Navigation from '../components/Navigation'
import Layout from '../components/Layout'

const gapFillerThemes = [
  { value: 'stars', label: 'Stars & Cosmos', description: 'Small stars, dots, celestial elements' },
  { value: 'floral', label: 'Floral Elements', description: 'Tiny flowers, leaves, botanical details' },
  { value: 'geometric', label: 'Geometric Shapes', description: 'Triangles, circles, minimal patterns' },
  { value: 'symbols', label: 'Symbolic Elements', description: 'Small meaningful symbols and icons' },
  { value: 'nature', label: 'Nature Details', description: 'Tiny animals, insects, natural elements' },
  { value: 'abstract', label: 'Abstract Forms', description: 'Flowing lines, organic shapes' },
  { value: 'ornamental', label: 'Ornamental', description: 'Decorative flourishes, filigree' },
  { value: 'dots', label: 'Dot Work', description: 'Stippling, dot patterns, pointillism' }
];
const cohesivePrompts = {
  stars: 'constellation map',
  floral: 'botanical arrangement',
  geometric: 'geometric mandala',
  symbols: 'symbolic emblem',
  nature: 'nature scene',
  abstract: 'abstract composition',
  ornamental: 'ornamental pattern',
  dots: 'dotwork image'
};

export default function CoverUp() {
  const [uploadedImage, setUploadedImage] = useState('white-canvas')
  const [selectedStyle, setSelectedStyle] = useState('blackwork')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState([])
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [secondaryStyle, setSecondaryStyle] = useState('none')
  const [selectedTheme, setSelectedTheme] = useState('stars')
  
  const fileInputRef = useRef(null)
  const drawingCanvasRef = useRef(null)

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

  const generateCoverUp = async () => {
    if (!drawingCanvasRef.current) {
      setError('Please draw the areas you want to cover up')
      return
    }
    
    setIsGenerating(true)
    setError('')
    setGeneratedDesigns([])
    
    try {
      const maskData = drawingCanvasRef.current.getMaskData()
      
      if (!maskData) {
        throw new Error('Please draw on the canvas to mark cover-up areas')
      }
      
      const canvas = drawingCanvasRef.current.getMaskCanvas()
      
      if (!canvas) {
        throw new Error('Unable to get canvas data')
      }
      
      const canvasData = canvas.toDataURL('image/png')
      
      let basePrompt = customPrompt.trim() || cohesivePrompts[selectedTheme] || 'tattoo design'
      
      const enhancedPrompt = `one complete ${basePrompt}, unified ${selectedStyle} tattoo design`
      
      const enhancedNegativePrompt = 'multiple elements, scattered, separate, disconnected'
      
      const USE_NEW_GENERATION = false
      
      const requestBody = {
        prompt: enhancedPrompt,
        negativePrompt: enhancedNegativePrompt,
        style: selectedStyle,
        guidanceScale: 15.0,
        gapFillerMode: true,
        theme: selectedTheme,
        maskData: maskData,
        useDimensionGeneration: USE_NEW_GENERATION,
      }
      
      if (USE_NEW_GENERATION) {
        requestBody.maskData = maskData
      } else {
        requestBody.originalImage = canvasData
        requestBody.maskData = maskData
      }
      
      try {
        const response = await fetch('/api/generate-tattoo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        
        let data
        const contentType = response.headers.get("content-type")
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json()
        } else {
          const text = await response.text()
          console.error('Non-JSON response from API:', text)
          data = {
            success: false,
            message: `Server error: ${text.substring(0, 100)}...`,
            error: 'Invalid response format'
          }
        }
        
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to generate cover-up designs')
        }
        
        const finalImageUrl = data.images?.[0] || data.imageURL
        
        if (!finalImageUrl) {
          throw new Error('No image generated - please try again')
        }
        
        const newDesign = {
          id: Date.now(),
          url: finalImageUrl,
          style: selectedStyle,
          theme: selectedTheme,
          prompt: customPrompt || `${selectedTheme} cover up`,
          enhancedPrompt: enhancedPrompt,
          metadata: data.metadata
        }
        
        setGeneratedDesigns([newDesign])

      } catch (err) {
        console.error('Cover-Up generation error:', err)
        setError(err.message || 'Failed to generate cover-up designs. Please try again.')
      } finally {
        setIsGenerating(false)
      }

    } catch (err) {
      console.error('Cover-Up generation error:', err)
      setError(err.message || 'Failed to generate cover-up designs. Please try again.')
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
      link.download = `coverup-${design.style}-${Date.now()}.png`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <Layout
      title="Cover Up Tattoo Generator"
      description="Generate custom cover-up tattoo designs that effectively conceal unwanted tattoos with AI."
      keywords="cover up tattoo, tattoo cover up ideas, tattoo cover up designs, hide old tattoo"
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
                      Draw over the areas you want to cover up. The AI will generate 
                      a design that effectively conceals these areas with professional techniques.
                    </p>
                  </div>

                  {/* Prompt input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your cover-up idea (optional)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={e => setCustomPrompt(e.target.value)}
                      placeholder="e.g., floral cover-up, mandala, blackout, geometric pattern, etc."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                      rows={2}
                      maxLength={200}
                    />
                  </div>
                  
                  <StyleSelector
                    tattooStyles={tattooStyles}
                    primaryStyle={selectedStyle}
                    setPrimaryStyle={setSelectedStyle}
                    secondaryStyle={secondaryStyle}
                    setSecondaryStyle={setSecondaryStyle}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                  />
                  
                  {/* Theme Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Up Theme
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {gapFillerThemes.map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setSelectedTheme(theme.value)}
                          className={`py-2 px-4 rounded-lg text-sm font-medium transition-all border-2 ${
                            selectedTheme === theme.value
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <span className="block font-semibold">{theme.label}</span>
                          <span className="block text-xs text-gray-500">{theme.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Generate Button */}
                  <button
                    onClick={generateCoverUp}
                    disabled={isGenerating || !uploadedImage}
                    className={`w-full py-4 rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2 mt-4 ${
                      isGenerating || !uploadedImage
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Cover-Up...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Cover-Up
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
                regenerateWithVariations={generateCoverUp}
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
                  Cover-Up Design Tips:
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Dark, dense designs work best for maximum coverage</li>
                  <li>• Consider the existing tattoo's shape when choosing your design</li>
                  <li>• Blackwork and heavy shading styles provide optimal concealment</li>
                  <li>• Larger designs typically cover better than smaller ones</li>
                  <li>• Consult with a professional artist for complex cover-ups</li>
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