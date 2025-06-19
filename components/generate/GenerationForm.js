import { Wand2, Sparkles, Loader2 } from 'lucide-react';

export default function GenerationForm({ prompt, setPrompt, examplePrompts, handleGenerate, isGenerating, error, promptInputRef }) {
  return (
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
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  );
} 