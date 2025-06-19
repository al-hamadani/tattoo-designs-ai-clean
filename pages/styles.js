import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Filter, ArrowRight, Info, Grid, List } from 'lucide-react'
import tattooStyles from '../constants/tattooStyles'
import Navigation from '../components/Navigation'

export default function Styles() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  const styleCategories = [
    { id: 'all', name: 'All Styles' },
    { id: 'modern', name: 'Modern' },
    { id: 'traditional', name: 'Traditional' },
    { id: 'cultural', name: 'Cultural' },
    { id: 'artistic', name: 'Artistic' },
    { id: 'technical', name: 'Technical' }
  ]

  const filteredStyles = tattooStyles.filter(style => {
    const matchesSearch = style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         style.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || style.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <>
      <Head>
        <title>Tattoo Styles Gallery - Explore 20+ Artistic Styles | TattooDesignsAI</title>
        <meta name="description" content="Explore 20+ tattoo styles from minimalist to traditional. Learn about each style's characteristics and find your perfect artistic expression." />
      </Head>

      <Navigation />

      <main className="min-h-screen pt-20 pb-12 bg-gray-50">
        {/* Header */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Explore Tattoo Styles
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover 20+ artistic styles to find your perfect expression. 
                From minimalist to traditional, every style tells a unique story.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="sticky top-20 bg-white border-b border-gray-100 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors flex-1"
                  >
                    {styleCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Styles Grid/List */}
        <section className="max-w-6xl mx-auto px-6 py-8">
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredStyles.map((style, index) => (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Style Preview */}
                <div className={`bg-gradient-to-br from-gray-100 to-gray-200 ${
                  viewMode === 'grid' ? 'aspect-[4/3]' : 'w-48 h-48'
                } flex items-center justify-center`}>
                  <span className="text-gray-500 font-medium">{style.name} Preview</span>
                </div>

                {/* Style Info */}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold">{style.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                      {style.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{style.description}</p>

                  {viewMode === 'list' && (
                    <>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Characteristics:</h4>
                        <div className="flex flex-wrap gap-2">
                          {style.characteristics.map((char, i) => (
                            <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded">
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Popular for:</h4>
                        <p className="text-sm text-gray-600">{style.popularFor}</p>
                      </div>
                    </>
                  )}

                  <Link
                    href={`/generate?style=${style.id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Try {style.name} Style
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredStyles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No styles found matching your search.</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mt-16">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Found Your Style?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Create your unique tattoo design in any style you love
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-medium hover:scale-105 transition-transform"
            >
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}