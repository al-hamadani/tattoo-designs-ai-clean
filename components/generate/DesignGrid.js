// components/generate/DesignGrid.js - Updated without like functionality
import { Download, Share2, Eye, RefreshCw, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function DesignGrid({ generatedDesigns, isGenerating, downloadImage, handleShareClick, handleARClick, regenerateWithVariations, error, selectedDesign, setSelectedDesign, showAR, showSocialSharing, RealSocialSharing, isPro, user }) {
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
                    onClick={() => downloadImage(design)}
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
                  
                </div>
              </div>
            ))}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (!isPro && user?.generationsRemaining <= 0) {
                    alert('No credits remaining. Upgrade to Pro for unlimited generations!');
                    return;
                  }
                  regenerateWithVariations();
                }}
                disabled={isGenerating}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                More Variations {!isPro && `(${user?.generationsRemaining || 0} credits)`}
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
                  <img
                    src={selectedDesign.url}
                    alt="Tattoo design detail"
                    className="w-full h-full object-contain p-8"
                  />
                </div>
                <div className="md:w-2/5 p-8 overflow-y-auto">
                  <h3 className="text-2xl font-bold mb-4">Design Details</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Your Prompt</h4>
                      <p className="text-gray-600">{selectedDesign.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => downloadImage(selectedDesign)}
                        className="py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download HD
                      </button>
                      <button
                        onClick={() => handleShareClick(selectedDesign)}
                        className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* AR Preview Modal */}
      <AnimatePresence>
        {showAR && (
          <RealSocialSharing
            imageUrl={selectedDesign?.url}
            onClose={() => setShowAR(false)}
          />
        )}
      </AnimatePresence>
      {/* Social Sharing Modal */}
      <AnimatePresence>
        {showSocialSharing && (
          <RealSocialSharing
            imageUrl={selectedDesign?.url}
            onClose={() => setShowSocialSharing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}