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
import tattooStyles from '../constants/tattooStyles'
import StyleSelector from '../components/generate/StyleSelector'
import DesignGrid from '../components/generate/DesignGrid'
import ImageUploadAndMask from '../components/generate/ImageUploadAndMask'
import { buildTattooPrompt } from '../lib/promptBuilder'
import Navigation from '../components/Navigation'
import Layout from '../components/Layout'

export default function CoverUp() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('blackwork')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesign, setGeneratedDesign] = useState(null)
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
        setGeneratedDesign(null)
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
      const maskData = drawingCanvasRef.current.getMaskData()
      const basePrompt = customPrompt.trim() || 'professional cover-up tattoo design'
      const prompt = buildTattooPrompt(basePrompt, selectedStyle, 'coverup', { secondaryStyle })
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
          complexity: 'complex',
          placement: 'custom-coverup',
          size: 'custom',
          maskData: maskData
        })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Generation failed')
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
                >
                  {/* Prompt input */}
                  <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Describe your cover-up idea (optional)</label>
                    <textarea
                      value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="e.g., floral cover-up, mandala, blackout, etc."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none mb-2"
                      rows={2}
                    maxLength={200}
                  />
                  <StyleSelector
                    tattooStyles={tattooStyles}
                    primaryStyle={selectedStyle}
                    setPrimaryStyle={setSelectedStyle}
                    secondaryStyle={secondaryStyle}
                    setSecondaryStyle={setSecondaryStyle}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                  />
                  <button
                    onClick={generateCoverUp}
                    disabled={isGenerating}
                    className={`w-full py-4 rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2 mt-4 ${
                      isGenerating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <span className="animate-spin mr-2"><Sparkles className="w-5 h-5" /></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Cover-Up
                      </>
                    )}
                  </button>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm mt-4">
                      {error}
                    </div>
                  )}
                </ImageUploadAndMask>
                </motion.div>
            </div>

            {/* Results Section */}
            <div>
              <DesignGrid
                generatedDesigns={generatedDesign ? [generatedDesign] : []}
                isGenerating={isGenerating}
                downloadImage={downloadImage}
                handleShareClick={() => {}}
                handleARClick={() => {}}
                toggleFavorite={() => {}}
                regenerateWithVariations={() => {}}
                error={error}
                selectedDesign={null}
                setSelectedDesign={() => {}}
                showAR={false}
                showSocialSharing={false}
                RealSocialSharing={() => null}
              />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
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
    </Layout>
  )
}

