import { useState } from 'react';

const TattooGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('traditional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  const tattooStyles = [
    { value: 'traditional', label: 'Traditional', description: 'Bold lines, classic designs' },
    { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple lines' },
    { value: 'geometric', label: 'Geometric', description: 'Mathematical patterns' },
    { value: 'blackwork', label: 'Blackwork', description: 'Solid black designs' },
    { value: 'tribal', label: 'Tribal', description: 'Cultural patterns' },
    { value: 'realistic', label: 'Realistic', description: 'Lifelike designs' }
  ];

  const examplePrompts = [
    'A majestic wolf howling at the moon',
    'Japanese cherry blossom branch',
    'Geometric mandala with intricate patterns', 
    'Small delicate butterfly on wrist',
    'Viking compass with norse runes',
    'Minimalist mountain landscape'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe your tattoo idea');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImage(null);
    
    try {
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Generation failed');
      }

      setGeneratedImage(data.imageURL);
    } catch (err) {
      setError(err.message || 'Failed to generate tattoo. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tattoo-design-${Date.now()}.jpg`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

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
          Generate your first design in 30 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          AI Tattoo Generator
        </h2>
        <p className="text-gray-300">
          Describe your vision and watch AI create your perfect tattoo design
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Describe Your Tattoo Idea
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A fierce dragon wrapped around a sword with flames"
              className="w-full p-4 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              rows={4}
              maxLength={200}
            />
            <div className="text-right text-sm text-gray-400 mt-1">
              {prompt.length}/200
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Choose Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full p-4 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {tattooStyles.map((styleOption) => (
                <option key={styleOption.value} value={styleOption.value} className="bg-gray-800">
                  {styleOption.label} - {styleOption.description}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating your design...</span>
              </div>
            ) : (
              '✨ Generate Tattoo Design'
            )}
          </button>

          <div>
            <p className="text-sm text-gray-400 mb-2">Need inspiration? Try these:</p>
            <div className="grid grid-cols-1 gap-2">
              {examplePrompts.slice(0, 3).map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="text-left text-sm text-blue-300 hover:text-blue-200 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-medium text-white mb-4">
            Your Tattoo Design
          </h3>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {generatedImage ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedImage}
                  alt="Generated tattoo design"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={downloadImage}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  📥 Download Design
                </button>
                <button
                  onClick={() => {
                    setGeneratedImage(null);
                    setError('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  🔄 Generate New
                </button>
              </div>

              <div className="text-center text-sm text-gray-400 space-y-1">
                <p>Love your design? Show it to your tattoo artist!</p>
                <p>Remember: This is a starting point for your real tattoo.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="text-4xl mb-4">🎨</div>
              <p className="text-center">
                {isGenerating 
                  ? 'AI is creating your tattoo design...' 
                  : 'Enter your idea and click generate to see your design'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => setShowGenerator(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to main page
        </button>
      </div>
    </div>
  );
};

export default TattooGenerator;