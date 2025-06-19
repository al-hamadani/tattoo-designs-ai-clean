// components/TattooGenerator.js

import { useState, useRef } from 'react'
import { ButtonLoading, GenerationProgress } from './LoadingStates'
import LazyImage from './LazyImage'
import tattooStyles from '../constants/tattooStyles'
import { complexityLevels, placementOptions, sizeOptions } from '../constants/tattooOptions'

// --- Analytics Event Tracking ---
const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

const examplePrompts = [
  'A majestic wolf howling at the moon',
  'Japanese cherry blossom branch',
  'Geometric mandala with lotus center',
  'Minimalist mountain range silhouette',
  'Celtic knot with hidden meaning',
  'Watercolor butterfly transformation',
  'Biomechanical arm enhancement',
  'Traditional anchor with banner',
  'Dotwork sunflower in bloom',
  'Abstract ocean waves flow'
]

const TattooGenerator = () => {
  const [prompt, setPrompt] = useState('')
  const [primaryStyle, setPrimaryStyle] = useState('traditional')
  const [secondaryStyle, setSecondaryStyle] = useState('none')
  const [complexity, setComplexity] = useState('medium')
  const [placement, setPlacement] = useState('generic')
  const [size, setSize] = useState('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [error, setError] = useState('')
  const [showGenerator, setShowGenerator] = useState(false)
  const [showARPreview, setShowARPreview] = useState(false)
  const [generationStage, setGenerationStage] = useState('preparing')
  const videoRef = useRef(null)

  // --- Prompt Generation ---
  const generateUniquePrompt = () => {
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
    enhancedPrompt += ', black and white tattoo design, clean white background, high contrast, professional tattoo art, stencil ready'
    enhancedPrompt += `, unique design ${randomSeed}`
    return enhancedPrompt
  }

  // --- Generate Handler ---
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe your tattoo idea')
      return
    }
    setIsGenerating(true)
    setError('')
    setGeneratedImage(null)
    setGenerationStage('preparing')

    trackEvent('generate_tattoo_attempt', {
      style: primaryStyle, complexity, placement, size
    })

    try {
      setTimeout(() => setGenerationStage('generating'), 500)
      const uniquePrompt = generateUniquePrompt()
      setGeneratedPrompt(uniquePrompt)
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

      setGenerationStage('enhancing')
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Generation failed')
      setGenerationStage('finalizing')
      setTimeout(() => {
        setGeneratedImage(data.imageURL)
        setIsGenerating(false)
      }, 500)

      trackEvent('generate_tattoo_success', {
        style: primaryStyle, complexity, placement, size
      })
    } catch (err) {
      setError(err.message || 'Failed to generate tattoo. Please try again.')
      setIsGenerating(false)
      trackEvent('generate_tattoo_error', {
        error: err.message, style: primaryStyle, complexity, placement, size
      })
    }
  }

  // --- Download Handler ---
  const downloadImage = async () => {
    if (!generatedImage) return
    trackEvent('download_tattoo', { style: primaryStyle, complexity, placement, size })
    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tattoo-${primaryStyle}-${complexity}-${Date.now()}.jpg`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  // --- AR Preview Handler ---
  const startARPreview = async () => {
    trackEvent('ar_preview_started', { style: primaryStyle, complexity, placement, size })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowARPreview(true)
      }
    } catch (error) {
      alert('Camera access needed for AR preview. Please allow camera permissions.')
    }
  }

  const stopARPreview = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }
    setShowARPreview(false)
  }

  const handlePrimaryStyleChange = (e) => {
    const newStyle = e.target.value
    trackEvent('style_changed', { new_style: newStyle, old_style: primaryStyle })
    setPrimaryStyle(newStyle)
  }

  // --- UI ---
  if (!showGenerator) {
    return (
      <div className="text-center">
        <button
          onClick={() => setShowGenerator(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 text-lg"
        >
          🎨 Try AI Generator (FREE)
        </button>
        <p className="text-gray-400 mt-2 text-sm">
          20+ styles • AR try-on • Unlimited creativity
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Professional AI Tattoo Generator
        </h2>
        <p className="text-gray-300">
          20+ artistic styles • Complexity control • AR preview • 100% unique designs
        </p>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Input */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <label className="block text-sm font-medium text-white mb-3">
              Describe Your Tattoo Vision
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., A fierce dragon wrapped around a cherry blossom tree"
              className="w-full p-4 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              rows={3}
              maxLength={300}
            />
            <div className="text-right text-sm text-gray-400 mt-1">
              {prompt.length}/300
            </div>
          </div>
          {/* Style Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <label className="block text-sm font-medium text-white mb-3">
                Primary Style
              </label>
              <select
                value={primaryStyle}
                onChange={handlePrimaryStyleChange}
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {tattooStyles.map(style => (
                  <option key={style.value} value={style.value} className="bg-gray-800">
                    {style.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {tattooStyles.find(s => s.value === primaryStyle)?.description}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <label className="block text-sm font-medium text-white mb-3">
                Mix with Style (Optional)
              </label>
              <select
                value={secondaryStyle}
                onChange={e => setSecondaryStyle(e.target.value)}
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="none" className="bg-gray-800">None - Pure Style</option>
                {tattooStyles.map(style => (
                  <option key={style.value} value={style.value} className="bg-gray-800">
                    + {style.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Blend two styles for unique results
              </p>
            </div>
          </div>
          {/* Advanced Controls */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <label className="block text-sm font-medium text-white mb-2">
                Detail Level
              </label>
              <select
                value={complexity}
                onChange={e => setComplexity(e.target.value)}
                className="w-full p-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {complexityLevels.map(level => (
                  <option key={level.value} value={level.value} className="bg-gray-800">
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <label className="block text-sm font-medium text-white mb-2">
                Placement
              </label>
              <select
                value={placement}
                onChange={e => setPlacement(e.target.value)}
                className="w-full p-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {placementOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <label className="block text-sm font-medium text-white mb-2">
                Size Guide
              </label>
              <select
                value={size}
                onChange={e => setSize(e.target.value)}
                className="w-full p-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {sizeOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Generate Button with Loading State */}
          <ButtonLoading
            onClick={handleGenerate}
            isLoading={isGenerating}
            loadingText={`Creating your unique ${primaryStyle} design...`}
            disabled={!prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
          >
            ✨ Generate Unique Design
          </ButtonLoading>
          {/* Example Prompts */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-sm text-gray-400 mb-3">🎯 Try these popular ideas:</p>
            <div className="grid md:grid-cols-2 gap-2">
              {examplePrompts.slice(0, 6).map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  className="text-left text-sm text-blue-300 hover:text-blue-200 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Result Section */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-4">
            <h3 className="text-lg font-medium text-white mb-4">
              Your Unique Design
            </h3>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-64">
                <GenerationProgress stage={generationStage} />
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <LazyImage
                    src={generatedImage}
                    alt="Generated tattoo design"
                    className="w-full h-auto rounded-lg"
                    aspectRatio="aspect-square"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={downloadImage}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    📥 Download HD Design
                  </button>
                  <button
                    onClick={startARPreview}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    📱 AR Try-On Preview
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedImage(null)
                      setError('')
                    }}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                  >
                    🔄 Generate Another
                  </button>
                </div>
                <div className="text-center text-xs text-gray-400 space-y-1 bg-white/5 rounded-lg p-3">
                  <p><strong>Style:</strong> {primaryStyle}{secondaryStyle !== 'none' ? ` + ${secondaryStyle}` : ''}</p>
                  <p><strong>Complexity:</strong> {complexity}</p>
                  <p><strong>Placement:</strong> {placement}</p>
                  <p className="text-green-400">✅ 100% Unique Design</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="text-4xl mb-4">🎨</div>
                <p className="text-center text-sm">
                  Describe your vision and watch it come to life
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* AR Preview Modal */}
      {showARPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">AR Try-On Preview</h3>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
              />
              {generatedImage && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-70">
                  <LazyImage
                    src={generatedImage}
                    alt="Tattoo overlay"
                    className="w-24 h-24 object-contain"
                    aspectRatio="aspect-square"
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={stopARPreview}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => alert('Advanced AR features coming soon!')}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adjust Position
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Back Button */}
      <div className="text-center">
        <button
          onClick={() => setShowGenerator(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to main page
        </button>
      </div>
    </div>
  )
}

export default TattooGenerator
