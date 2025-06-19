// pages/generate.js - With ADVANCED controls and Detail Modal, using FIXED components
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
// pages/generate.js
import dynamic from 'next/dynamic';
import tattooStyles from '../constants/tattooStyles';
import { complexityLevels, placementOptions, sizeOptions } from '../constants/tattooOptions';
import Navigation from '../components/Navigation';
import StyleSelector from '../components/generate/StyleSelector';
import ComplexitySelector from '../components/generate/ComplexitySelector';
import DesignGrid from '../components/generate/DesignGrid';
import GenerationForm from '../components/generate/GenerationForm';

// Use the dynamic wrapper
const RealisticARPreview = dynamic(
  () => import('../components/RealisticARPreview/ARPreviewDynamic'),
  { ssr: false }
);

import { useRouter } from 'next/router';




export default function Generate() {
  // Inside your component
const router = useRouter();
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

  const examplePrompts = [
    'A majestic wolf howling at the moon',
    'Japanese cherry blossom branch with falling petals',
    'Geometric mandala with lotus flower center',
    'Minimalist mountain range silhouette with sunrise',
    'Celtic knot with hidden trinity symbol',
    'Watercolor butterfly emerging from chrysalis'
  ]

  // Build prompt for API
  const generateUniquePrompt = () => {
    const timestamp = Date.now()
    const randomSeed = Math.random().toString(36).substring(7)
    let enhancedPrompt = prompt
    enhancedPrompt += `, ${primaryStyle} tattoo style`
    if (secondaryStyle !== 'none') {
      enhancedPrompt += ` with ${secondaryStyle} influences`
    }
    const complexityMap = {
      simple: 'clean and simple',
      medium: 'moderate detail',
      complex: 'highly detailed',
      masterpiece: 'intricate masterpiece quality'
    }
    enhancedPrompt += `, ${complexityMap[complexity]}`
    if (placement !== 'generic') {
      const placementMap = {
        forearm: 'designed for forearm placement, vertical composition',
        bicep: 'designed for bicep placement, curved composition',
        shoulder: 'designed for shoulder placement, circular flow',
        back: 'designed for back placement, large scale composition',
        chest: 'designed for chest placement, symmetrical layout',
        wrist: 'designed for wrist placement, compact and delicate',
        ankle: 'designed for ankle placement, small elegant design',
        neck: 'designed for neck placement, bold statement',
        thigh: 'designed for thigh placement, vertical emphasis',
        ribcage: 'designed for ribcage placement, curved flowing lines',
        calf: 'designed for calf placement, good proportions'
      }
      enhancedPrompt += `, ${placementMap[placement]}`
    }
    const sizeMap = {
      tiny: 'tiny detailed design, coin-sized',
      small: 'small intricate design, palm-sized',
      medium: 'medium sized design with good detail',
      large: 'large detailed design, forearm-sized',
      'extra-large': 'extra large detailed design, major tattoo piece'
    }
    enhancedPrompt += `, ${sizeMap[size]}`
    enhancedPrompt += ', black and white tattoo design, clean white background, high contrast, professional tattoo art, stencil ready'
    enhancedPrompt += `, unique design ${randomSeed}`
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
      const uniquePrompt = generateUniquePrompt()
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: uniquePrompt,
          style: primaryStyle,
          complexity,
          placement,
          size
        })
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Generation failed')
      const newDesign = {
        id: Date.now(),
        prompt: prompt,
        style: primaryStyle,
        complexity,
        placement,
        size,
        url: data.imageURL,
        liked: false,
        metadata: data.metadata
      }
      setGeneratedDesigns([newDesign])
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate tattoo. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateWithVariations = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError('')
    try {
      const variations = []
      for (let i = 0; i < 3; i++) {
        const uniquePrompt = generateUniquePrompt()
        const response = await fetch('/api/generate-tattoo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: uniquePrompt,
            style: primaryStyle,
            complexity,
            placement,
            size
          })
        })
        const data = await response.json()
        if (data.success) {
          variations.push({
            id: Date.now() + i,
            prompt: prompt,
            style: primaryStyle,
            complexity,
            placement,
            size,
            url: data.imageURL,
            liked: false,
            metadata: data.metadata
          })
        }
      }
      setGeneratedDesigns(prev => [...prev, ...variations])
    } catch (err) {
      console.error('Variation generation error:', err)
      setError('Failed to generate variations. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleFavorite = (designId) => {
    setGeneratedDesigns(designs => 
      designs.map(d => d.id === designId ? { ...d, liked: !d.liked } : d)
    )
    if (favorites.includes(designId)) {
      setFavorites(favs => favs.filter(id => id !== designId))
    } else {
      setFavorites(favs => [...favs, designId])
    }
  }

  const downloadImage = async (imageUrl, design) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tattoo-${design.style}-${design.complexity}-${Date.now()}.jpg`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download image')
    }
  }

  const handleShareClick = (design) => {
    setSelectedDesign(design)
    setShowSocialSharing(true)
  }
  

// Replace the AR button click handler
const handleARClick = (design) => {
  router.push(`/ar?image=${encodeURIComponent(design.url)}`);
};

  return (
    <>
      <Head>
        <title>Generate Your Tattoo Design - TattooDesignsAI</title>
        <meta name="description" content="Create unique tattoo designs with AI. Describe your idea and get instant, personalized tattoo artwork with 20+ styles and advanced options." />
      </Head>
      <SEO 
        title="Generate Your Tattoo Design"
        description="Create custom tattoo designs with AI. Choose from 20+ styles including minimalist, traditional, geometric, and more. Free to try!"
        keywords="tattoo generator, AI tattoo design, custom tattoo, tattoo creator online"
      />
      <Navigation />

      <main className="min-h-screen pt-20 pb-12 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Create Your Perfect Tattoo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Describe your vision and watch it come to life with professional AI-generated designs
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Controls Section */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
              >
                <div className="space-y-6">
                  <GenerationForm
                    prompt={prompt}
                    setPrompt={setPrompt}
                    examplePrompts={examplePrompts}
                    handleGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    error={error}
                    promptInputRef={promptInputRef}
                  />
                  <StyleSelector
                    tattooStyles={tattooStyles}
                    primaryStyle={primaryStyle}
                    setPrimaryStyle={setPrimaryStyle}
                    secondaryStyle={secondaryStyle}
                    setSecondaryStyle={setSecondaryStyle}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                  />
                  <ComplexitySelector
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
                </div>
              </motion.div>
            </div>
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
    </>
  )
}