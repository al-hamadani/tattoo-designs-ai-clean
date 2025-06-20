// pages/generate.js - Clean Enhanced Version with Professional Prompt Builder
import { useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Wand2, Download, Heart, Share2, RefreshCw, 
  ChevronLeft, ChevronRight, Maximize2, Camera, Loader2,
  Palette, Zap, Eye, Settings, Info
} from 'lucide-react'
import SEO from '../components/SEO'
import RealSocialSharing from '../components/RealSocialSharing'
import dynamic from 'next/dynamic'
import tattooStyles from '../constants/tattooStyles'
import { complexityLevels, placementOptions, sizeOptions, examplePrompts } from '../constants/tattooOptions'
import Navigation from '../components/Navigation'
import StyleSelector from '../components/generate/StyleSelector'
import ComplexitySelector from '../components/generate/ComplexitySelector'
import DesignGrid from '../components/generate/DesignGrid'
import GenerationForm from '../components/generate/GenerationForm'
import Layout from '../components/Layout'
import { buildTattooPrompt } from '../lib/promptBuilder' // Enhanced Professional Prompt Builder

// Use the dynamic wrapper
const RealisticARPreview = dynamic(
  () => import('../components/RealisticARPreview/ARPreviewDynamic'),
  { ssr: false }
)

import { useRouter } from 'next/router'

export default function Generate() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [primaryStyle, setPrimaryStyle] = useState('traditional')
  const [secondaryStyle, setSecondaryStyle] = useState('none')
  const [complexity, setComplexity] = useState('medium')
  const [placement, setPlacement] = useState('generic')
  const [size, setSize] = useState('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [showAR, setShowAR] = useState(false)
  const [showSocialSharing, setShowSocialSharing] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const promptInputRef = useRef(null)

  // Enhanced Professional Prompt Builder
  const generateEnhancedPrompt = () => {
    const randomSeed = Math.random().toString(36).substring(7)
    
    // Use the professional prompt builder with all advanced options
    const enhancedPrompt = buildTattooPrompt(prompt, primaryStyle, 'generate', {
      complexity,
      placement, 
      size,
      secondaryStyle,
      randomSeed
    })
    
    return enhancedPrompt
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe your tattoo idea')
      promptInputRef.current?.focus()
      return
    }
    setIsGenerating(true)
    setError('')
    setGeneratedDesigns([])
    
    try {
      // Generate enhanced professional prompt
      const enhancedPrompt = generateEnhancedPrompt()
      
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          style: primaryStyle,
          complexity,
          placement,
          size,
          secondaryStyle
        })
      })
      
      const data = await response.json()
      
      if (!data.success) throw new Error(data.message || 'Generation failed')
      
      // Handle both new (images array) and old (imageURL) format
      let finalImageUrl = null
      
      if (data.images && data.images.length > 0) {
        finalImageUrl = data.images[0]
      } else if (data.imageURL) {
        finalImageUrl = data.imageURL
      }
      
      const newDesign = {
        id: Date.now(),
        prompt: prompt,
        enhancedPrompt: enhancedPrompt,
        style: primaryStyle,
        complexity,
        placement,
        size,
        url: finalImageUrl,
        liked: false,
        metadata: data.metadata
      }
      
      setGeneratedDesigns([newDesign])
      
    } catch (err) {
      setError(err.message || 'Failed to generate tattoo. Please try again.')
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
      link.download = `tattoo-${design.style}-${Date.now()}.png`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleShareClick = (design) => {
    setSelectedDesign(design)
    setShowSocialSharing(true)
  }

  const handleARClick = (design) => {
    setSelectedDesign(design)
    setShowAR(true)
  }

  const toggleFavorite = (designId) => {
    setFavorites(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    )
  }

  const regenerateWithVariations = async (design) => {
    await handleGenerate()
  }

  return (
    <Layout
      title="AI Tattoo Generator"
      description="Create unique tattoo designs with our advanced AI. Choose from 20+ styles, customize complexity, and generate unlimited designs."
    >
      <SEO 
        title="AI Tattoo Generator - Create Custom Designs Instantly"
        description="Generate unique tattoo designs with AI. 20+ artistic styles, unlimited customization, and instant results. Start creating your perfect tattoo today."
        keywords="ai tattoo generator, custom tattoo design, tattoo ideas, ai art, tattoo styles"
        canonicalUrl="https://tattoodesignsai.com/generate"
      />
      
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Create Your Perfect Tattoo
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Describe your vision and watch it come to life with professional AI-generated designs
            </motion.p>
            
            {/* Professional Enhancement Indicator */}
            <motion.div
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full border border-purple-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                Enhanced with Professional Tattoo Terminology
              </span>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Generation Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                <div className="space-y-8">
                  {/* Prompt Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Describe your dream tattoo
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Enhanced with Pro Terminology
                      </span>
                    </label>
                    <div className="relative">
                      <textarea
                        ref={promptInputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A majestic wolf howling at the moon"
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                        rows={4}
                        maxLength={500}
                      />
                      <button
                        onClick={() => setPrompt('')}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">
                        Try: "{examplePrompts[Math.floor(Math.random() * examplePrompts.length)]}"
                      </div>
                      <div className="text-xs text-gray-400">
                        {prompt.length}/500
                      </div>
                    </div>
                  </div>

                  {/* Style Selection */}
                  <StyleSelector
                    primaryStyle={primaryStyle}
                    setPrimaryStyle={setPrimaryStyle}
                    secondaryStyle={secondaryStyle}
                    setSecondaryStyle={setSecondaryStyle}
                    tattooStyles={tattooStyles}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                  />

                  {/* Advanced Options */}
                  <ComplexitySelector
                    showAdvanced={showAdvanced}
                    complexity={complexity}
                    setComplexity={setComplexity}
                    placement={placement}
                    setPlacement={setPlacement}
                    size={size}
                    setSize={setSize}
                    complexityLevels={complexityLevels}
                    placementOptions={placementOptions}
                    sizeOptions={sizeOptions}
                  />

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Professional Design...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Professional Design
                      </>
                    )}
                  </button>

                  {/* Example Prompts */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">🎯 Popular Ideas:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {examplePrompts.slice(0, 6).map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPrompt(example)}
                          className="text-left text-sm text-blue-600 hover:text-blue-700 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-gray-100"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Results Area */}
            <DesignGrid
              generatedDesigns={generatedDesigns}
              isGenerating={isGenerating}
              downloadImage={downloadImage}
              handleShareClick={handleShareClick}
              handleARClick={handleARClick}
              toggleFavorite={toggleFavorite}
              regenerateWithVariations={regenerateWithVariations}
              error={error}
              selectedDesign={selectedDesign}
              setSelectedDesign={setSelectedDesign}
              showAR={showAR}
              showSocialSharing={showSocialSharing}
              RealSocialSharing={RealSocialSharing}
            />
          </div>
        </div>
      </main>
    </Layout>
  )
}