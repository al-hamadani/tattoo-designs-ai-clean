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

export default function CoverUp() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('blackwork')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState([])
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [secondaryStyle, setSecondaryStyle] = useState('none')
  
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

  // Enhanced generateCoverUp function
  const generateCoverUp = async () => {
    if (!drawingCanvasRef.current) {
      setError('Please upload an image and mark the cover-up areas first')
      return
    }
    
    setIsGenerating(true)
    setError('')
    setGeneratedDesigns([])
    
    try {
      const maskData = drawingCanvasRef.current.getMaskData()
      
      if (!maskData) {
        throw new Error('Please draw on the image to mark cover-up areas')
      }
      
      const basePrompt = customPrompt.trim() || 'professional cover-up tattoo design'
      
      // Build enhanced prompt for cover-ups
      const enhancedPrompt = buildTattooPrompt(basePrompt, selectedStyle, 'coverup', {
        secondaryStyle
      })
      
      // Use enhanced negative prompts for cover-ups
      const enhancedNegativePrompt = buildTattooNegativePrompt('coverup')
      
      console.log('🔥 Enhanced Cover-Up Prompt:', enhancedPrompt)
      console.log('🚫 Enhanced Negative Prompt:', enhancedNegativePrompt)
      
      try {
        const response = await fetch('/api/generate-tattoo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            negativePrompt: enhancedNegativePrompt,
            style: selectedStyle,
            complexity: 'complex',
            placement: 'custom-coverup',
            size: 'custom',
            maskData: maskData
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
          throw new Error(data.message || data.error || 'Failed to generate cover-up design')
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
          prompt: basePrompt,
          enhancedPrompt: enhancedPrompt,
          metadata: data.metadata
        }
        
        setGeneratedDesigns([newDesign])

      } catch (err) {
        console.error('Cover-Up generation error:', err)
        setError(err.message || 'Failed to generate cover-up design. Please try again.')
      } finally {
        setIsGenerating(false)
      }

    } catch (err) {
      console.error('Cover-Up generation error:', err)
      setError(err.message || 'Failed to generate cover-up design. Please try again.')
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
            
            {/* Professional Enhancement Indicator */}
            <motion.div
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-full border border-green-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Enhanced Cover-Up Prompts
              </span>
            </motion.div>
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
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Enhanced
                      </span>
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
                        Generating Enhanced Cover-Up...
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
              
              {/* Enhanced Tips */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-green-900 mb-2">
                  Professional Cover-Up Tips:
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Dark, bold designs work best for covering existing tattoos</li>
                  <li>• Blackwork and traditional styles provide maximum coverage</li>
                  <li>• Consult with your artist about feasibility and session planning</li>
                  <li>• Multiple sessions may be needed for complete coverage</li>
                  <li>• Consider laser removal first for better cover-up results</li>
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

