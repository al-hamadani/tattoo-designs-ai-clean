import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Filter, ArrowRight, Info, Grid, List } from 'lucide-react'

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

  const tattooStyles = [
    {
      id: 'minimalist',
      name: 'Minimalist',
      category: 'modern',
      description: 'Clean lines, simple shapes, and negative space. Less is more.',
      characteristics: ['Simple lines', 'Small designs', 'Geometric shapes', 'Minimal shading'],
      popularFor: 'First tattoos, subtle statements, modern aesthetics'
    },
    {
      id: 'traditional',
      name: 'Traditional (Old School)',
      category: 'traditional',
      description: 'Bold lines, bright colors, and iconic imagery from tattoo history.',
      characteristics: ['Thick black outlines', 'Limited color palette', 'Classic motifs', 'Solid fills'],
      popularFor: 'Timeless designs, nautical themes, pin-ups'
    },
    {
      id: 'geometric',
      name: 'Geometric',
      category: 'modern',
      description: 'Mathematical precision meets artistic expression through shapes and patterns.',
      characteristics: ['Perfect symmetry', 'Sacred geometry', 'Dotwork patterns', 'Angular designs'],
      popularFor: 'Modern art lovers, precision seekers, sacred symbols'
    },
    {
      id: 'watercolor',
      name: 'Watercolor',
      category: 'artistic',
      description: 'Soft, flowing designs that mimic watercolor paintings on skin.',
      characteristics: ['Color bleeds', 'No black outlines', 'Soft edges', 'Vibrant splashes'],
      popularFor: 'Artistic expressions, nature themes, abstract art'
    },
    {
      id: 'blackwork',
      name: 'Blackwork',
      category: 'technical',
      description: 'Bold, solid black ink creates striking contrast and dramatic designs.',
      characteristics: ['Solid black fills', 'High contrast', 'No color', 'Bold patterns'],
      popularFor: 'Statement pieces, geometric patterns, tribal influences'
    },
    {
      id: 'neo-traditional',
      name: 'Neo-Traditional',
      category: 'traditional',
      description: 'Evolution of traditional style with modern techniques and expanded themes.',
      characteristics: ['Bold lines', 'Expanded color palette', 'Dimensional shading', 'Modern themes'],
      popularFor: 'Updated classics, portraits, nature designs'
    },
    {
      id: 'japanese',
      name: 'Japanese (Irezumi)',
      category: 'cultural',
      description: 'Rich cultural tradition featuring mythological creatures and natural elements.',
      characteristics: ['Large scale', 'Flowing composition', 'Traditional motifs', 'Background elements'],
      popularFor: 'Full sleeves, back pieces, cultural appreciation'
    },
    {
      id: 'tribal',
      name: 'Tribal',
      category: 'cultural',
      description: 'Bold patterns inspired by indigenous cultures worldwide.',
      characteristics: ['Black ink only', 'Symbolic patterns', 'Flowing curves', 'Cultural significance'],
      popularFor: 'Cultural heritage, bold statements, arm bands'
    },
    {
      id: 'realism',
      name: 'Realism',
      category: 'technical',
      description: 'Photo-realistic tattoos that capture life-like detail.',
      characteristics: ['Fine details', 'Smooth shading', 'Depth perception', 'Photo accuracy'],
      popularFor: 'Portraits, nature scenes, memorial tattoos'
    },
    {
      id: 'abstract',
      name: 'Abstract',
      category: 'artistic',
      description: 'Non-representational art that focuses on form, color, and emotion.',
      characteristics: ['Unconventional shapes', 'Color experimentation', 'Emotional expression', 'Unique composition'],
      popularFor: 'Personal expression, modern art, unique pieces'
    },
    {
      id: 'linework',
      name: 'Linework',
      category: 'technical',
      description: 'Intricate designs created entirely with lines of varying weights.',
      characteristics: ['Single needle', 'Fine lines', 'No shading', 'Delicate details'],
      popularFor: 'Delicate designs, botanical themes, minimalist art'
    },
    {
      id: 'dotwork',
      name: 'Dotwork',
      category: 'technical',
      description: 'Stippling technique creates shading and texture through dots.',
      characteristics: ['Dot patterns', 'Gradual shading', 'Geometric patterns', 'Time intensive'],
      popularFor: 'Mandalas, geometric designs, unique textures'
    },
    {
      id: 'sketch',
      name: 'Sketch',
      category: 'artistic',
      description: 'Tattoos that look like pencil sketches on paper.',
      characteristics: ['Loose lines', 'Sketch marks', 'Unfinished look', 'Artistic freedom'],
      popularFor: 'Artistic pieces, portraits, creative expressions'
    },
    {
      id: 'biomechanical',
      name: 'Biomechanical',
      category: 'modern',
      description: 'Fusion of organic and mechanical elements in surreal designs.',
      characteristics: ['3D effects', 'Machine parts', 'Organic integration', 'Detailed shading'],
      popularFor: 'Sci-fi fans, unique pieces, sleeve designs'
    },
    {
      id: 'surrealism',
      name: 'Surrealism',
      category: 'artistic',
      description: 'Dream-like imagery that challenges reality and perception.',
      characteristics: ['Impossible scenes', 'Dream imagery', 'Symbolic elements', 'Creative freedom'],
      popularFor: 'Unique expressions, philosophical themes, art lovers'
    },
    {
      id: 'mandala',
      name: 'Mandala',
      category: 'cultural',
      description: 'Sacred circular designs representing the universe and inner peace.',
      characteristics: ['Circular patterns', 'Perfect symmetry', 'Spiritual significance', 'Intricate details'],
      popularFor: 'Spiritual meanings, meditation symbols, decorative art'
    },
    {
      id: 'celtic',
      name: 'Celtic',
      category: 'cultural',
      description: 'Intricate knotwork and symbols from Celtic heritage.',
      characteristics: ['Interwoven patterns', 'No beginning or end', 'Cultural symbols', 'Black ink'],
      popularFor: 'Heritage pieces, symbolic meanings, arm bands'
    },
    {
      id: 'chicano',
      name: 'Chicano',
      category: 'cultural',
      description: 'Mexican-American culture expressed through distinctive imagery.',
      characteristics: ['Fine line black and gray', 'Religious imagery', 'Cultural icons', 'Realistic portraits'],
      popularFor: 'Cultural pride, memorial pieces, religious themes'
    },
    {
      id: 'ornamental',
      name: 'Ornamental',
      category: 'artistic',
      description: 'Decorative patterns inspired by jewelry and architectural details.',
      characteristics: ['Decorative patterns', 'Symmetrical designs', 'Jewelry-like', 'Fine details'],
      popularFor: 'Body decoration, elegant designs, feminine pieces'
    },
    {
      id: 'illustrative',
      name: 'Illustrative',
      category: 'artistic',
      description: 'Tattoos that look like illustrations from storybooks or comics.',
      characteristics: ['Bold outlines', 'Flat colors', 'Storybook quality', 'Whimsical themes'],
      popularFor: 'Pop culture, character designs, narrative pieces'
    }
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

      {/* Navigation - STYLES PAGE */}
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
              <Link href="/styles" className="text-blue-600 font-medium">Styles</Link>
              <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
              <Link href="/gallery" className="hover:text-blue-600 transition-colors">Gallery</Link>
              <Link href="/generate" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all hover:scale-105">
                Try Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

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