import { useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Wand2, Download, Heart, Share2, RefreshCw, 
  ChevronLeft, ChevronRight, Maximize2, Camera, Loader2,
  Palette, Zap, Eye
} from 'lucide-react'

export default function Generate() {
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDesigns, setGeneratedDesigns] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [showAR, setShowAR] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [error, setError] = useState('')
  
  const promptInputRef = useRef(null)

  const styles = [
    { id: 'all', name: 'All Styles', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'traditional', name: 'Traditional' },
    { id: 'geometric', name: 'Geometric' },
    { id: 'watercolor', name: 'Watercolor' },
    { id: 'blackwork', name: 'Blackwork' },
    { id: 'neo-traditional', name: 'Neo-Traditional' },
    { id: 'japanese', name: 'Japanese' },
    { id: 'tribal', name: 'Tribal' },
    { id: 'realism', name: 'Realism' },
    { id: 'abstract', name: 'Abstract' },
    { id: 'linework', name: 'Linework' },
    { id: 'dotwork', name: 'Dotwork' },
    { id: 'sketch', name: 'Sketch' },
    { id: 'biomechanical', name: 'Biomechanical' },
    { id: 'surrealism', name: 'Surrealism' },
    { id: 'mandala', name: 'Mandala' },
    { id: 'celtic', name: 'Celtic' },
    { id: 'chicano', name: 'Chicano' },
    { id: 'ornamental', name: 'Ornamental' },
    { id: 'illustrative', name: 'Illustrative' }
  ]

  const examplePrompts = [
    "Minimalist mountain range with geometric shapes",
    "Fierce dragon wrapped around cherry blossoms",
    "Delicate constellation with moon phases",
    "Abstract waves with Japanese sun",
    "Geometric wolf howling at the moon",
    "Watercolor butterfly with flowers"
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      promptInputRef.current?.focus()
      return
    }

    setIsGenerating(true)
    setError('')
    
    try {
      // Call the actual API
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          style: selectedStyle === 'all' ? undefined : selectedStyle,
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate design');
      }

      // Create multiple designs with the same base image but different metadata
      const newDesigns = Array(4).fill(null).map((_, i) => ({
        id: Date.now() + i,
        prompt: prompt,
        style: selectedStyle === 'all' ? styles[Math.floor(Math.random() * (styles.length - 1)) + 1].id : selectedStyle,
        url: data.imageURL,
        liked: false
      }));
      
      setGeneratedDesigns(newDesigns);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate tattoo design. Please try again.');
      
      // Fallback to placeholder designs if API fails
      const newDesigns = Array(4).fill(null).map((_, i) => ({
        id: Date.now() + i,
        prompt: prompt,
        style: selectedStyle === 'all' ? styles[Math.floor(Math.random() * (styles.length - 1)) + 1].id : selectedStyle,
        url: `/api/placeholder/400/400?text=Design${i + 1}`,
        liked: false
      }));
      
      setGeneratedDesigns(newDesigns);
    } finally {
      setIsGenerating(false);
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

  return (
    <>
      <Head>
        <title>Generate Your Tattoo Design - TattooDesignsAI</title>
        <meta name="description" content="Create unique tattoo designs with AI. Describe your idea and get instant, personalized tattoo artwork." />
      </Head>

      {/* Navigation */}
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
            <p className="text-xl text-gray-600">
              Describe your vision and watch it come to life
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* Main Input Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8"
          >
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  />
                  <button
                    onClick={() => setPrompt(examplePrompts[Math.floor(Math.random() * examplePrompts.length)])}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Try an example"
                  >
                    <Wand2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Try:</span>
                  {examplePrompts.slice(0, 3).map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example)}
                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      "{example.substring(0, 30)}..."
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose a style (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                        selectedStyle === style.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {style.icon}
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
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
                    Creating your unique designs...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Designs
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Loading State */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl p-8 max-w-sm w-full mx-6 text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Creating Magic...</h3>
                  <p className="text-gray-600 mb-4">
                    Our AI is crafting unique designs based on your vision
                  </p>
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-blue-600 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated Designs */}
          {generatedDesigns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Your Unique Designs</h2>
                <p className="text-gray-600">Click any design to see it in detail</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {generatedDesigns.map((design, index) => (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedDesign(design)}
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      {design.url.includes('placeholder') ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-gray-500">Design Preview</span>
                        </div>
                      ) : (
                        <img 
                          src={design.url} 
                          alt={`Generated tattoo design ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(design.id)
                          }}
                          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${design.liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 capitalize">{design.style} Style</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{design.prompt}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleGenerate}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate More
                </button>
                <button 
                  onClick={() => {
                    setPrompt('')
                    promptInputRef.current?.focus()
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Try Different Prompt
                </button>
              </div>
            </motion.div>
          )}

          {/* Design Detail Modal */}
          <AnimatePresence>
            {selectedDesign && (
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col md:flex-row h-full">
                    {/* Design Preview */}
                    <div className="md:w-1/2 bg-gray-100 relative">
                      <div className="aspect-square flex items-center justify-center">
                        {selectedDesign.url.includes('placeholder') ? (
                          <span className="text-gray-500 text-xl">Full Design Preview</span>
                        ) : (
                          <img 
                            src={selectedDesign.url} 
                            alt="Full tattoo design"
                            className="w-full h-full object-contain p-8"
                          />
                        )}
                      </div>
                    </div>

                    {/* Design Details */}
                    <div className="md:w-1/2 p-8 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold mb-2">Your Design</h3>
                        <p className="text-gray-600 mb-4">{selectedDesign.prompt}</p>
                        <p className="text-sm text-gray-500 mb-6">Style: {selectedDesign.style}</p>

                        <div className="space-y-4">
                          <button
                            onClick={() => setShowAR(true)}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye className="w-5 h-5" />
                            Try On with AR
                          </button>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <button className="py-3 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors flex items-center justify-center gap-2">
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                            <button className="py-3 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors flex items-center justify-center gap-2">
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedDesign(null)}
                        className="mt-6 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AR Preview Modal */}
          <AnimatePresence>
            {showAR && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-50 flex items-center justify-center"
              >
                <button
                  onClick={() => setShowAR(false)}
                  className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-2">AR Preview</h3>
                  <p className="text-gray-300">Camera preview would appear here</p>
                  <p className="text-sm text-gray-400 mt-4">Position your device to see the tattoo on your skin</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  )
}