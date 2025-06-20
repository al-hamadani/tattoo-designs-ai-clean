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
import { buildTattooPrompt } from '../lib/promptBuilder'
import Layout from '../components/Layout'

export default function GapFiller() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('minimalist')
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
    if (!drawingCanvasRef.current) return;
    
    setIsGenerating(true);
    setError('');
    setGeneratedDesigns([]);
    
    try {
      const maskData = drawingCanvasRef.current.getMaskData();
      
      const basePrompt = customPrompt.trim() || 'minimalist themed gap filler elements';
      
        const response = await fetch('/api/generate-tattoo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          prompt: basePrompt,
            style: selectedStyle,
            complexity: 'simple',
            placement: 'custom-gapfiller',
            size: 'small',
          originalImage: uploadedImage,
            maskData: maskData
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate designs');
      }
      
      // API returns an array of images, but we only need one
      const newDesign = {
        id: Date.now(),
        url: data.images[0],
        style: selectedStyle,
        prompt: data.prompt
      };
      
      setGeneratedDesigns([newDesign]);

    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate gap filler designs');
    } finally {
      setIsGenerating(false);
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
                <h3 className="text-lg font-semibold mb-4">Step 1: Upload Your Tattoo Photo</h3>
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
                        Draw circles or shapes in the gaps where you want filler tattoos. 
                        The AI will generate designs that fit perfectly in these spaces.
                      </p>
                    </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Describe your gap filler design (optional)</label>
                      <textarea
                        value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="e.g., 'small stars and dots' or 'tiny flowers and leaves'"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none mb-2"
                        rows={2}
                      />
                  <StyleSelector
                    tattooStyles={tattooStyles}
                    primaryStyle={selectedStyle}
                    setPrimaryStyle={setSelectedStyle}
                  />
                  <button
                    onClick={generateGapFiller}
                    disabled={isGenerating}
                    className={`w-full py-4 rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2 mt-4 ${
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
                </ImageUploadAndMask>
                </motion.div>
            </div>
            <div>
              <DesignGrid
                generatedDesigns={generatedDesigns}
                isGenerating={isGenerating}
                downloadImage={() => {}}
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                      <h4 className="font-medium text-green-900 mb-2">
                        Gap Filler Tips:
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                  <li>• Minimalist style works well for small spaces</li>
                        <li>• Small designs heal faster and age well</li>
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