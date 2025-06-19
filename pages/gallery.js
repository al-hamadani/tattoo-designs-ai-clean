import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Grid3X3, Square, ChevronDown } from 'lucide-react'
import { CardSkeleton } from '../components/LoadingStates'
import LazyImage from '../components/LazyImage'
import Navigation from '../components/Navigation'
import Layout from '../components/Layout'

export default function Gallery() {
  const [selectedStyle, setSelectedStyle] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [galleryItems, setGalleryItems] = useState([])

  const styles = [
    'All Styles', 'Minimalist', 'Traditional', 'Geometric', 'Watercolor', 
    'Blackwork', 'Neo-Traditional', 'Japanese', 'Realism', 'Abstract'
  ]

  // Simulate loading initial designs
  useEffect(() => {
    // Mock data for initial gallery items - in production, this would fetch from your database
    const mockItems = [
      {
        id: 1,
        prompt: "Geometric wolf with moon phases",
        style: 'Geometric',
        imageUrl: '/api/placeholder/400/400?text=Design1'
      },
      {
        id: 2,
        prompt: "Minimalist mountain range with sunrise",
        style: 'Minimalist',
        imageUrl: '/api/placeholder/400/400?text=Design2'
      },
      {
        id: 3,
        prompt: "Japanese cherry blossoms with koi fish",
        style: 'Japanese',
        imageUrl: '/api/placeholder/400/400?text=Design3'
      },
      {
        id: 4,
        prompt: "Abstract waves in watercolor style",
        style: 'Watercolor',
        imageUrl: '/api/placeholder/400/400?text=Design4'
      },
      {
        id: 5,
        prompt: "Traditional rose with dagger",
        style: 'Traditional',
        imageUrl: '/api/placeholder/400/400?text=Design5'
      },
      {
        id: 6,
        prompt: "Constellation map with zodiac signs",
        style: 'Blackwork',
        imageUrl: '/api/placeholder/400/400?text=Design6'
      },
      {
        id: 7,
        prompt: "Biomechanical heart design",
        style: 'Realism',
        imageUrl: '/api/placeholder/400/400?text=Design7'
      },
      {
        id: 8,
        prompt: "Celtic tree of life",
        style: 'Traditional',
        imageUrl: '/api/placeholder/400/400?text=Design8'
      }
    ];

    // Simulate API delay
    setTimeout(() => {
      setGalleryItems(mockItems)
      setLoading(false)
    }, 1000)

    // In production, you would set up a real-time connection here
    // to listen for new designs being generated
  }, [])

  const filteredItems = galleryItems.filter(item => 
    selectedStyle === 'all' || item.style === selectedStyle
  )

  return (
    <Layout
      title="Tattoo Gallery"
      description="Browse a gallery of AI-generated tattoo designs. Get inspired for your next tattoo."
      keywords="tattoo gallery, AI tattoo, tattoo inspiration, tattoo designs"
    >
      <main className="min-h-screen pt-20 bg-gray-50">
        {/* Header */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Community Gallery
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get inspired by thousands of unique AI-generated tattoo designs 
                created by our community
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="sticky top-20 bg-white border-b border-gray-100 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Style Filter */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filter by style:</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="all">All Styles</option>
                  {styles.slice(1).map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    title="Grid view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('large')}
                    className={`p-2 ${viewMode === 'large' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    title="Large view"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {loading ? (
              // Show skeletons while loading
              Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))
            ) : (
              filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedDesign(item)}
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 ${
                      viewMode === 'grid' ? 'aspect-square' : 'aspect-[4/3]'
                    }`}>
                      {/* Design Preview */}
                      <LazyImage
                        src={item.imageUrl}
                        alt={item.prompt}
                        className="absolute inset-0 w-full h-full object-cover"
                        aspectRatio={viewMode === 'grid' ? 'aspect-square' : 'aspect-[4/3]'}
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-gray-500">Design Preview</span>
                          </div>
                        }
                      />
                    </div>

                    <div className="p-4">
                      <p className="font-medium text-gray-900 mb-1 line-clamp-2">{item.prompt}</p>
                      <p className="text-sm text-gray-600">{item.style} Style</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {filteredItems.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No designs found for this style.</p>
              <button
                onClick={() => setSelectedStyle('all')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Show all styles
              </button>
            </div>
          )}

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Load More Designs
            </button>
          </div>
        </section>

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
                  <div className="md:w-3/5 bg-gray-100 relative">
                    <button
                      onClick={() => setSelectedDesign(null)}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors z-10"
                    >
                      ✕
                    </button>
                    <div className="aspect-square flex items-center justify-center">
                      <LazyImage
                        src={selectedDesign.imageUrl}
                        alt={selectedDesign.prompt}
                        className="w-full h-full object-contain p-8"
                        aspectRatio="aspect-square"
                        fallback={
                          <span className="text-gray-500 text-xl">Full Design Preview</span>
                        }
                      />
                    </div>
                  </div>

                  {/* Design Details */}
                  <div className="md:w-2/5 p-8 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-2">Design Details</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Prompt used:</p>
                          <p className="text-lg font-medium">{selectedDesign.prompt}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Style:</p>
                          <p className="text-lg">{selectedDesign.style}</p>
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        <Link
                          href={`/generate?prompt=${encodeURIComponent(selectedDesign.prompt)}&style=${selectedDesign.style.toLowerCase()}`}
                          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          Create Similar Design
                        </Link>
                        
                        <button
                          onClick={() => setSelectedDesign(null)}
                          className="w-full py-3 border border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inspiration CTA */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white mt-16">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Feeling Inspired?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Create your own unique tattoo design in seconds
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-medium hover:scale-105 transition-transform"
            >
              Start Creating
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  )
}