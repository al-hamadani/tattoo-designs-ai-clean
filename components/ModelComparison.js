import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Scale, ArrowRight, ArrowLeft, Download, Info
} from 'lucide-react';
import tattooStyles from '../constants/tattooStyles';
import { complexityLevels, placementOptions, sizeOptions } from '../constants/tattooOptions';
import { buildTattooPrompt, truncateToTokenLimit } from '../lib/promptBuilder';

export default function ModelComparison({ initialPrompt = '', initialStyle = 'traditional', initialComplexity = 'medium', initialPlacement = 'generic', initialSize = 'medium', initialSecondaryStyle = 'none' }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState(initialStyle);
  const [complexity, setComplexity] = useState(initialComplexity);
  const [placement, setPlacement] = useState(initialPlacement);
  const [size, setSize] = useState(initialSize);
  const [secondaryStyle, setSecondaryStyle] = useState(initialSecondaryStyle);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingStandard, setIsGeneratingStandard] = useState(false);
  const [isGeneratingFreshInk, setIsGeneratingFreshInk] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const promptInputRef = useRef(null);

  // Helper for prompt ranking visualization
  function getPromptRanking(fullPrompt, truncatedPrompt) {
    const fullParts = fullPrompt.split(', ');
    const truncatedParts = truncatedPrompt.split(', ');
    return fullParts.map(part => ({
      text: part,
      kept: truncatedParts.includes(part)
    }));
  }

  const handleGenerateComparison = async () => {
    if (!prompt.trim()) {
      setError('Please describe your tattoo idea');
      promptInputRef.current?.focus();
      return;
    }
    setIsGenerating(true);
    setError('');
    setResults(null);
    try {
      const response = await fetch('/api/generate-tattoo-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, complexity, placement, size, secondaryStyle })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Generation failed');
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate comparison. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStandard = async () => {
    if (!prompt.trim()) {
      setError('Please describe your tattoo idea');
      promptInputRef.current?.focus();
      return;
    }
    setIsGeneratingStandard(true);
    setError('');
    try {
      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle
      });
      
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          style,
          complexity,
          placement,
          size,
          secondaryStyle,
          model: 'standard'
        })
      });
      
      const data = await response.json();
      
      if (!data.success) throw new Error(data.message || 'Generation failed');
      
      setResults(prev => ({
        ...prev,
        results: {
          ...prev?.results,
          standard: {
            success: true,
            images: data.images || [data.imageURL],
            prompt: enhancedPrompt,
            promptLength: enhancedPrompt.split(/\s+/).length,
            model: 'standard'
          }
        },
        promptAnalysis: {
          ...prev?.promptAnalysis,
          standardPromptLength: enhancedPrompt.split(/\s+/).length
        },
        metadata: data.metadata
      }));
      
    } catch (err) {
      setError(err.message || 'Failed to generate with standard model.');
    } finally {
      setIsGeneratingStandard(false);
    }
  };

  const handleGenerateFreshInk = async () => {
    if (!prompt.trim()) {
      setError('Please describe your tattoo idea');
      promptInputRef.current?.focus();
      return;
    }
    setIsGeneratingFreshInk(true);
    setError('');
    try {
      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle
      });
      
      const truncatedPrompt = truncateToTokenLimit(enhancedPrompt, 77);
      
      // Call the standard endpoint but with the truncated prompt for Fresh Ink model
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: truncatedPrompt, 
          style, 
          complexity, 
          placement, 
          size, 
          secondaryStyle,
          model: 'freshInk' // Add model parameter to indicate Fresh Ink
        })
      });
      
      const data = await response.json();
      
      if (!data.success) throw new Error(data.message || 'Generation failed');
      
      setResults(prev => ({
        ...prev,
        results: {
          ...prev?.results,
          freshInk: {
            success: true,
            images: data.images || [data.imageURL],
            prompt: truncatedPrompt,
            originalPrompt: enhancedPrompt,
            promptLength: truncatedPrompt.split(/\s+/).length,
            originalPromptLength: enhancedPrompt.split(/\s+/).length,
            model: 'freshInk'
          }
        },
        promptAnalysis: {
          standardPromptLength: enhancedPrompt.split(/\s+/).length,
          freshInkPromptLength: truncatedPrompt.split(/\s+/).length,
          tokensRemoved: enhancedPrompt.split(/\s+/).length - truncatedPrompt.split(/\s+/).length,
          truncationPercentage: Math.round((truncatedPrompt.split(/\s+/).length / enhancedPrompt.split(/\s+/).length) * 100),
          promptDifference: enhancedPrompt.length - truncatedPrompt.length
        }
      }));
      
    } catch (err) {
      setError(err.message || 'Failed to generate with Fresh Ink model.');
    } finally {
      setIsGeneratingFreshInk(false);
    }
  };

  const downloadImage = async (imageUrl, modelName) => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tattoo-${modelName}-${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Prepare prompt ranking visualization
  let promptRanking = [];
  if (results && results.results?.standard?.prompt && results.results?.freshInk?.prompt) {
    promptRanking = getPromptRanking(results.results.standard.prompt, results.results.freshInk.prompt);
  }

  return (
    <div>
      {/* Shared Prompt Input & Controls */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
            Shared Prompt & Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tattoo Description</label>
              <textarea
                ref={promptInputRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your tattoo idea in detail..."
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                <select
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(tattooStyles).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
                <select
                  value={complexity}
                  onChange={e => setComplexity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {complexityLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Placement</label>
                <select
                  value={placement}
                  onChange={e => setPlacement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {placementOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <select
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {sizeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateComparison}
                disabled={isGenerating}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Scale className="w-5 h-5 mr-2" />
                )}
                Generate Both Models
              </button>
              <button
                onClick={handleGenerateStandard}
                disabled={isGeneratingStandard}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingStandard ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5 mr-2" />
                )}
                Generate Standard Only
              </button>
              <button
                onClick={handleGenerateFreshInk}
                disabled={isGeneratingFreshInk}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingFreshInk ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ArrowLeft className="w-5 h-5 mr-2" />
                )}
                Generate Fresh Ink Only
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      {/* Results Section */}
      {results && (
        <div className="max-w-7xl mx-auto">
          {/* Prompt Comparison & Ranking */}
          {results.promptAnalysis && results.results?.standard?.prompt && results.results?.freshInk?.prompt && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-600" />
                Prompt Analysis & Ranking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Standard Model Prompt</h4>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-700">{results.results.standard.prompt}</p>
                    <p className="text-gray-500 mt-2">Tokens: {results.promptAnalysis.standardPromptLength}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Fresh Ink Model Prompt (Truncated)</h4>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-700">{results.results.freshInk.prompt}</p>
                    <p className="text-gray-500 mt-2">
                      Tokens: {results.promptAnalysis.freshInkPromptLength} 
                      ({results.promptAnalysis.truncationPercentage}% of original)
                    </p>
                  </div>
                </div>
              </div>
              {/* Prompt Ranking Visualization */}
              <div className="mt-6">
                <h5 className="font-semibold text-gray-700 mb-2">Prompt Enhancement Ranking</h5>
                <div className="flex flex-wrap gap-2">
                  {promptRanking.map((part, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-xs font-mono ${part.kept ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500 line-through'}`}
                    >
                      {part.text}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Analysis:</strong> {results.promptAnalysis.tokensRemoved} tokens removed 
                  ({results.promptAnalysis.promptDifference} characters shorter)
                </p>
              </div>
            </div>
          )}
          {/* Side-by-Side Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Standard Model */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2 text-blue-600" />
                  Current Model (SDXL)
                </h3>
                {results.results?.standard?.success && (
                  <button
                    onClick={() => downloadImage(results.results.standard.images[0], 'standard')}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
              <AnimatePresence>
                {results.results?.standard?.success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-4"
                  >
                    {results.results.standard.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Standard model result ${index + 1}`}
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => downloadImage(image, 'standard')}
                            className="opacity-0 group-hover:opacity-100 bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                          >
                            <Download className="w-5 h-5 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {results.results?.standard?.error || 'No result available'}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {/* Fresh Ink Model */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <ArrowLeft className="w-5 h-5 mr-2 text-green-600" />
                  Fresh Ink Model
                </h3>
                {results.results?.freshInk?.success && (
                  <button
                    onClick={() => downloadImage(results.results.freshInk.images[0], 'fresh-ink')}
                    className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
              <AnimatePresence>
                {results.results?.freshInk?.success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-4"
                  >
                    {results.results.freshInk.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Fresh Ink model result ${index + 1}`}
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => downloadImage(image, 'fresh-ink')}
                            className="opacity-0 group-hover:opacity-100 bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                          >
                            <Download className="w-5 h-5 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {results.results?.freshInk?.error || 'No result available'}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* Metadata */}
          {results.metadata && (
            <div className="mt-8 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Generation Details</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Task ID:</strong> {results.metadata.taskId}</p>
                <p><strong>Method:</strong> {results.metadata.method}</p>
                <p><strong>Style:</strong> {results.metadata.style}</p>
                <p><strong>Complexity:</strong> {results.metadata.complexity}</p>
                <p><strong>Timestamp:</strong> {new Date(results.metadata.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 