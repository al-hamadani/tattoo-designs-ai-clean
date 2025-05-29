import { motion } from 'framer-motion'

// Skeleton loader component
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-lg ${className}`}
      {...props}
    />
  )
}

// Image loading placeholder
export const ImageSkeleton = ({ aspectRatio = 'aspect-square' }) => {
  return (
    <div className={`${aspectRatio} relative overflow-hidden bg-gray-100 rounded-lg`}>
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  )
}

// Text loading placeholder
export const TextSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

// Button loading state
export const ButtonLoading = ({ children, isLoading, loadingText, className = '', ...props }) => {
  return (
    <button
      disabled={isLoading}
      className={`relative transition-all ${isLoading ? 'cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      <span className={`${isLoading ? 'opacity-0' : ''}`}>
        {children}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingText}
        </span>
      )}
    </button>
  )
}

// Full page loading
export const PageLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading amazing content...</p>
      </motion.div>
    </div>
  )
}

// Card loading state
export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <ImageSkeleton />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Generation progress indicator
export const GenerationProgress = ({ stage = 'preparing' }) => {
  const stages = {
    preparing: { text: 'Preparing your design...', progress: 20 },
    generating: { text: 'AI is creating magic...', progress: 60 },
    enhancing: { text: 'Enhancing details...', progress: 80 },
    finalizing: { text: 'Almost there...', progress: 95 }
  }

  const currentStage = stages[stage] || stages.preparing

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-4">
        <p className="text-lg font-medium text-gray-900">{currentStage.text}</p>
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: '0%' }}
          animate={{ width: `${currentStage.progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-6 flex justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-600 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}