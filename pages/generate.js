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

  // Artistic Styles
  const tattooStyles = [
    { value: 'traditional', label: 'Traditional', description: 'Bold lines, bright colors, classic Americana' },
    { value: 'neo-traditional', label: 'Neo-Traditional', description: 'Modern twist on traditional with more detail' },
    { value: 'old-school', label: 'Old School', description: 'Vintage sailor tattoos, simple and bold' },
    { value: 'realistic', label: 'Realistic', description: 'Photorealistic, highly detailed artwork' },
    { value: 'portrait', label: 'Portrait', description: 'Detailed faces and figures' },
    { value: 'surreal', label: 'Surreal', description: 'Dreamlike, impossible imagery' },
    { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple lines, less is more' },
    { value: 'fine-line', label: 'Fine Line', description: 'Delicate, thin lines, elegant details' },
    { value: 'single-needle', label: 'Single Needle', description: 'Ultra-fine detail work' },
    { value: 'blackwork', label: 'Blackwork', description: 'Solid black designs, high contrast' },
    { value: 'tribal', label: 'Tribal', description: 'Bold patterns, cultural significance' },
    { value: 'gothic', label: 'Gothic', description: 'Dark, mysterious, medieval inspiration' },
    { value: 'geometric', label: 'Geometric', description: 'Mathematical patterns, sacred geometry' },
    { value: 'mandala', label: 'Mandala', description: 'Circular, spiritual patterns' },
    { value: 'abstract', label: 'Abstract', description: 'Non-representational art' },
    { value: 'japanese', label: 'Japanese', description: 'Irezumi style, koi, dragons, waves' },
    { value: 'chinese', label: 'Chinese', description: 'Traditional Chinese motifs and symbolism' },
    { value: 'celtic', label: 'Celtic', description: 'Knots, spirals, Irish heritage' },
    { value: 'polynesian', label: 'Polynesian', description: 'Pacific island tribal patterns' },
    { value: 'watercolor', label: 'Watercolor', description: 'Flowing colors, painterly effects' },
    { value: 'sketch', label: 'Sketch', description: 'Rough, hand-drawn appearance' },
    { value: 'dotwork', label: 'Dotwork', description: 'Stippling technique, dot patterns' },
    { value: 'linework', label: 'Linework', description: 'Focus on clean, bold lines' },
    { value: 'biomechanical', label: 'Biomechanical', description: 'Fusion of organic and mechanical' },
    { value: 'new-school', label: 'New School', description: 'Cartoon-like, exaggerated features' },
    { value: 'trash-polka', label: 'Trash Polka', description: 'Chaotic mix of realistic and abstract' }
  ]
  const complexityLevels = [
    { value: 'simple', label: 'Simple', description: 'Clean, basic design (1-3 elements)' },
    { value: 'medium', label: 'Medium', description: 'Moderate detail (3-5 elements)' },
    { value: 'complex', label: 'Complex', description: 'Highly detailed (5+ elements)' },
    { value: 'masterpiece', label: 'Masterpiece', description: 'Maximum detail and artistry' }
  ]
  const placementOptions = [
    { value: 'generic', label: 'Generic Design', description: 'Standalone design' },
    { value: 'forearm', label: 'Forearm', description: 'Vertical orientation, medium size' },
    { value: 'bicep', label: 'Bicep', description: 'Curved placement, bold design' },
    { value: 'shoulder', label: 'Shoulder', description: 'Circular/curved composition' },
    { value: 'back', label: 'Back', description: 'Large canvas, detailed work' },
    { value: 'chest', label: 'Chest', description: 'Symmetrical, powerful placement' },
    { value: 'wrist', label: 'Wrist', description: 'Small, delicate design' },
    { value: 'ankle', label: 'Ankle', description: 'Compact, elegant placement' },
    { value: 'neck', label: 'Neck', description: 'Bold statement piece' },
    { value: 'thigh', label: 'Thigh', description: 'Large area, detailed possibilities' },
    { value: 'ribcage', label: 'Ribcage', description: 'Curved, flowing design' },
    { value: 'calf', label: 'Calf', description: 'Vertical space, good visibility' }
  ]
  const sizeOptions = [
    { value: 'tiny', label: 'Tiny (1-2\")', description: 'Coin-sized, minimal detail' },
    { value: 'small', label: 'Small (2-4\")', description: 'Palm-sized, simple elements' },
    { value: 'medium', label: 'Medium (4-6\")', description: 'Hand-sized, good detail' },
    { value: 'large', label: 'Large (6-10\")', description: 'Forearm-sized, complex detail' },
    { value: 'extra-large', label: 'XL (10\"+)', description: 'Major piece, maximum detail' }
  ]
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
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              TattooDesignsAI
            </Link>
            <div className="flex items-center gap-6">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Heart className="w-5 h-5" />
                {favorites.length > 0 && (
                  <span className="ml-1 text-sm">{favorites.length}</span>
                )}
              </button>
              <Link href="/gallery" className="text-gray-600 hover:text-gray-900 transition-colors">
                Gallery
              </Link>
              <Link href="/styles" className="text-gray-600 hover:text-gray-900 transition-colors">
                Styles
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
                  {/* Prompt Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Describe your dream tattoo
                    </label>
                    <div className="relative">
                      <textarea
                        ref={promptInputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'geometric wolf with moon phases' or 'minimalist mountain range with pine trees'"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                        rows={3}
                        maxLength={500}
                      />
                      <button
                        onClick={() => setPrompt(examplePrompts[Math.floor(Math.random() * examplePrompts.length)])}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Try an example"
                      >
                        <Wand2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">Try:</span>
                        {examplePrompts.slice(0, 3).map((example, i) => (
                          <button
                            key={i}
                            onClick={() => setPrompt(example)}
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            "{example.substring(0, 25)}..."
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{prompt.length}/500</span>
                    </div>
                  </div>
                  {/* Quick Style Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Primary style
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {tattooStyles.slice(0, 8).map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setPrimaryStyle(style.value)}
                          className={`p-3 rounded-lg font-medium text-sm transition-all ${
                            primaryStyle === style.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Advanced Options Toggle */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Advanced Options
                      <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 border-t pt-6"
                      >
                        {/* All Styles */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            All styles available
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                            {tattooStyles.map((style) => (
                              <button
                                key={style.value}
                                onClick={() => setPrimaryStyle(style.value)}
                                className={`p-2 rounded-lg font-medium text-xs transition-all text-left ${
                                  primaryStyle === style.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                title={style.description}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Secondary Style */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Mix with style (optional)
                          </label>
                          <select
                            value={secondaryStyle}
                            onChange={(e) => setSecondaryStyle(e.target.value)}
                            className="w-full p-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                          >
                            <option value="none">None - Pure Style</option>
                            {tattooStyles.map((style) => (
                              <option key={style.value} value={style.value}>
                                + {style.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Advanced Controls Grid */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Detail Level
                            </label>
                            <select
                              value={complexity}
                              onChange={(e) => setComplexity(e.target.value)}
                              className="w-full p-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            >
                              {complexityLevels.map((level) => (
                                <option key={level.value} value={level.value}>
                                  {level.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Placement
                            </label>
                            <select
                              value={placement}
                              onChange={(e) => setPlacement(e.target.value)}
                              className="w-full p-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            >
                              {placementOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Size Guide
                            </label>
                            <select
                              value={size}
                              onChange={(e) => setSize(e.target.value)}
                              className="w-full p-3 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            >
                              {sizeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className={`w-full py-4 rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2 ${
                      isGenerating || !prompt.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating your unique design...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Design
                      </>
                    )}
                  </button>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            {/* Results Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="text-lg font-medium mb-4">
                  Your Design{generatedDesigns.length > 1 ? 's' : ''}
                </h3>
                {generatedDesigns.length > 0 ? (
                  <div className="space-y-6">
                    {generatedDesigns.map((design, index) => (
                      <div key={design.id} className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                             onClick={() => setSelectedDesign(design)}>
                          <img
                            src={design.url}
                            alt="Generated tattoo design"
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => downloadImage(design.url, design)}
                            className="py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            onClick={() => handleShareClick(design)}
                            className="py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                          <button
                            onClick={() => handleARClick(design)}
                            className="py-2 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            AR Preview
                          </button>
                          <button
                            onClick={() => toggleFavorite(design.id)}
                            className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                              design.liked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${design.liked ? 'fill-current' : ''}`} />
                            {design.liked ? 'Liked' : 'Like'}
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
                          <p><strong>Style:</strong> {design.style}</p>
                          <p><strong>Complexity:</strong> {design.complexity}</p>
                          <p><strong>Placement:</strong> {design.placement}</p>
                          <p><strong>Size:</strong> {design.size}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex space-x-3">
                      <button
                        onClick={regenerateWithVariations}
                        disabled={isGenerating}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        More Variations
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <div className="text-4xl mb-4">🎨</div>
                    <p className="text-center text-sm">
                      {isGenerating 
                        ? 'AI is crafting your masterpiece...' 
                        : 'Describe your vision and watch it come to life'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Detail Modal */}
          <AnimatePresence>
            {selectedDesign && !showAR && !showSocialSharing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                onClick={() => setSelectedDesign(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-3/5 bg-gray-100 relative">
                      <button
                        onClick={() => setSelectedDesign(null)}
                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="p-6">
                        <img
                          src={selectedDesign.url}
                          alt="Generated tattoo design"
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="md:w-2/5 p-8 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold mb-2">{selectedDesign.prompt}</h3>
                        <p className="text-gray-600 mb-4">{selectedDesign.style} Style</p>
                        <div className="space-y-3 mb-6">
                          <button
                            onClick={() => handleARClick(selectedDesign)}
                            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye className="w-5 h-5" />
                            Try On with AR
                          </button>
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => downloadImage(selectedDesign.url, selectedDesign)}
                              className="py-3 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                            <button 
                              onClick={() => handleShareClick(selectedDesign)}
                              className="py-3 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2 bg-gray-50 rounded-lg p-4">
                          <p><strong>Style:</strong> {selectedDesign.style}</p>
                          <p><strong>Complexity:</strong> {selectedDesign.complexity}</p>
                          <p><strong>Placement:</strong> {selectedDesign.placement}</p>
                          <p><strong>Size:</strong> {selectedDesign.size}</p>
                          <p className="text-green-600">✅ 100% Unique Design</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Fixed Social Sharing Modal */}
          <AnimatePresence>
            {showSocialSharing && selectedDesign && (
              <RealSocialSharing
                imageUrl={selectedDesign.url}
                design={selectedDesign}
                onClose={() => setShowSocialSharing(false)}
              />
            )}
          </AnimatePresence>
          


        
        </div>
      </main>
    </>
  )
}

