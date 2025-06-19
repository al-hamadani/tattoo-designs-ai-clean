import { Download, Share2, Eye, Heart, RefreshCw, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function DesignGrid({ generatedDesigns, isGenerating, downloadImage, handleShareClick, handleARClick, toggleFavorite, regenerateWithVariations, error, selectedDesign, setSelectedDesign, showAR, showSocialSharing, RealSocialSharing }) {
  return (
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm mt-4">
            {error}
          </div>
        )}
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
  );
} 