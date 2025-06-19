import { AnimatePresence, motion } from 'framer-motion';
import { Settings, ChevronRight } from 'lucide-react';

export default function StyleSelector({ tattooStyles, primaryStyle, setPrimaryStyle, secondaryStyle, setSecondaryStyle, showAdvanced, setShowAdvanced }) {
  return (
    <div>
      {/* Quick Style Selection */}
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Primary style
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tattooStyles.slice(0, 8).map((style) => (
          <button
            key={style.id}
            onClick={() => setPrimaryStyle(style.id)}
            className={`p-3 rounded-lg font-medium text-sm transition-all ${
              primaryStyle === style.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>
      {/* Advanced Options Toggle and All Styles */}
      <div className="flex items-center justify-between mt-4">
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
                    key={style.id}
                    onClick={() => setPrimaryStyle(style.id)}
                    className={`p-2 rounded-lg font-medium text-xs transition-all text-left ${
                      primaryStyle === style.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={style.description}
                  >
                    {style.name}
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
                  <option key={style.id} value={style.id}>
                    + {style.name}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 