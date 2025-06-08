import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, Share2, Filter, TrendingUp, Clock, Award, 
  Grid3X3, Square, ChevronDown, X, Eye, Download
} from 'lucide-react'
import { CardSkeleton } from '../components/LoadingStates'
import LazyImage from '../components/LazyImage'

export default function Gallery() {
  const [selectedFilter, setSelectedFilter] = useState('trending')
  const [selectedStyle, setSelectedStyle] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [likedDesigns, setLikedDesigns] = useState([])
  const [loading, setLoading] = useState(true)

  const filters = [
    { id: 'trending', name: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'recent', name: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'popular', name: 'Most Popular', icon: <Award className="w-4 h-4" /> }
  ]

  const styles = [
    'All Styles', 'Minimalist', 'Traditional', 'Geometric', 'Watercolor', 
    'Blackwork', 'Neo-Traditional', 'Japanese', 'Realism', 'Abstract'
  ]

  // Mock data for gallery items
  const galleryItems = Array(24).fill(null).map((_, i) => ({
    id: i + 1,
    prompt: [
      "Geometric wolf with moon phases",
      "Minimalist mountain range with sunrise",
      "Japanese cherry blossoms with koi fish",
      "Abstract waves in watercolor style",
      "Traditional rose with dagger",
      "Constellation map with zodiac signs",
      "Biomechanical heart design",
      "Celtic tree of life",
      "Mandala with lotus flower",
      "Geometric butterfly transformation"
    ][i % 10],
    style: styles[Math.floor(Math.random() * (styles.length - 1)) + 1],
    likes: Math.floor(Math.random() * 500) + 50,
    views: Math.floor(Math.random() * 2000) + 200,
    creator: ['Emma_ink', 'ArtistMike', 'TattooLover23', 'InkMaster', 'DesignPro'][Math.floor(Math.random() * 5)],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    trending: Math.random() > 0.7,
    imageUrl: `/api/placeholder/400/400?text=Design${i + 1}` // Add image URL
  }))

  // Simulate loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 1500)
  }, [])

  const filteredItems = galleryItems
    .filter(item => selectedStyle === 'all' || item.style === selectedStyle)
    .sort((a, b) => {
      switch (selectedFilter) {
        case 'trending':
          return b.trending - a.trending || b.likes - a.likes
        case 'recent':
          return b.createdAt - a.createdAt
        case 'popular':
          return b.likes - a.likes
        default:
          return 0
      }
    })

  const toggleLike = (designId) => {
    if (likedDesigns.includes(designId)) {
      setLikedDesigns(prev => prev.filter(id => id !== designId))
    } else {
      setLikedDesigns(prev => [...prev, designId])
    }
  }

  const formatDate = (date) => {
    const days = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  return (
    <>
      <Head>
        <title>Tattoo Design Gallery - Browse Community Creations | TattooDesignsAI</title>
        <meta name="description" content="Explore thousands of AI-generated tattoo designs from our community. Get inspired and find your perfect tattoo style." />
      </Head>

      {/* Navigation - GALLERY PAGE */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              TattooDesignsAI
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/generate" className="hover:text-blue-600 transition-colors">Generate</Link>
              <Link href="/coverup" className="hover:text-blue-600 transition-colors">Cover Up</Link>
              <Link href="/gapfiller" className="hover:text-blue-600 transition-colors">Gap Filler</Link>
              <Link href="/styles" className="hover:text-blue-600 transition-colors">Styles</Link>
              <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
              <Link href="/gallery" className="text-blue-600 font-medium">Gallery</Link>
              <Link href="/generate" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all hover:scale-105">
                Try Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                      selectedFilter === filter.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.icon}
                    {filter.name}
                  </button>
                ))}
              </div>

              {/* Style Filter & View Toggle */}
              <div className="flex items-center gap-4">
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

                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('large')}
                    className={`p-2 ${viewMode === 'large' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
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
                      {/* Design Preview with LazyImage */}
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
                      
                      {/* Trending Badge */}
                      {item.trending && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(item.id)
                          }}
                          className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                        >
                          <Heart className={`w-5 h-5 ${
                            likedDesigns.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'
                          }`} />
                        </button>
                        <button className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                          <Eye className="w-5 h-5 text-gray-700" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="font-medium text-gray-900 mb-1 line-clamp-1">{item.prompt}</p>
                      <p className="text-sm text-gray-600 mb-3">{item.style} Style</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Heart className="w-4 h-4" />
                            {item.likes}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Eye className="w-4 h-4" />
                            {item.views}
                          </span>
                        </div>
                        <span className="text-gray-400">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

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
                className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col md:flex-row h-full">
                  {/* Design Preview */}
                  <div className="md:w-3/5 bg-gray-100 relative">
                    <button
                      onClick={() => setSelectedDesign(null)}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors z-10"
                    >
                      <X className="w-5 h-5" />
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
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-semibold mb-2">{selectedDesign.prompt}</h3>
                          <p className="text-gray-600">{selectedDesign.style} Style</p>
                        </div>
                        <button
                          onClick={() => toggleLike(selectedDesign.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            likedDesigns.includes(selectedDesign.id)
                              ? 'bg-red-50 text-red-500'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${
                            likedDesigns.includes(selectedDesign.id) ? 'fill-current' : ''
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {selectedDesign.likes} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {selectedDesign.views} views
                        </span>
                      </div>

                      <div className="border-t pt-6 mb-6">
                        <p className="text-sm text-gray-600 mb-2">Created by</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                          <div>
                            <p className="font-medium">{selectedDesign.creator}</p>
                            <p className="text-sm text-gray-500">{formatDate(selectedDesign.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Link
                          href={`/generate?prompt=${encodeURIComponent(selectedDesign.prompt)}&style=${selectedDesign.style.toLowerCase()}`}
                          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          Create Similar Design
                        </Link>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button className="py-3 border border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" />
                            Save
                          </button>
                          <button className="py-3 border border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                        </div>
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
              <Heart className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}