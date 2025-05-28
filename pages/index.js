import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, Eye, Layers, Download, Check } from 'lucide-react'

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeStyle, setActiveStyle] = useState(0)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const styles = [
    'Minimalist', 'Traditional', 'Geometric', 'Watercolor', 'Blackwork',
    'Neo-Traditional', 'Japanese', 'Tribal', 'Realism', 'Abstract'
  ]

  const steps = [
    { icon: <Sparkles className="w-6 h-6" />, title: 'Describe Your Vision', desc: 'Type your idea in plain words' },
    { icon: <Layers className="w-6 h-6" />, title: 'AI Creates Magic', desc: 'Watch multiple unique designs appear' },
    { icon: <Zap className="w-6 h-6" />, title: 'Choose Your Style', desc: 'Pick from 20+ artistic styles' },
    { icon: <Eye className="w-6 h-6" />, title: 'Try It On', desc: 'See it on your skin with AR' },
    { icon: <Download className="w-6 h-6" />, title: 'Get Your Design', desc: 'Download HD files for your artist' }
  ]

  return (
    <>
      <Head>
        <title>TattooDesignsAI - Your Next Tattoo, Imagined in Seconds</title>
        <meta name="description" content="Create unique AI-generated tattoo designs in seconds. Try on virtual tattoos with AR before getting inked. Free to start, no artistic skills needed." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              TattooDesignsAI
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/generate" className="hover:text-blue-600 transition-colors">Generate</Link>
              <Link href="/styles" className="hover:text-blue-600 transition-colors">Styles</Link>
              <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
              <Link href="/gallery" className="hover:text-blue-600 transition-colors">Gallery</Link>
              <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all hover:scale-105">
                Try Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Your Next Tattoo,<br />Imagined in Seconds
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Turn any idea into a stunning, one-of-a-kind tattoo design with AI. 
              No artistic skills needed—just describe what you want.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/generate" className="group bg-blue-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-blue-700 transition-all hover:scale-105 flex items-center justify-center gap-2">
                Create Your First Design Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 rounded-xl font-medium text-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:scale-105">
                See Example Designs
              </button>
            </div>
            <p className="mt-6 text-gray-500">
              Join thousands who've discovered their perfect ink
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works - 5 Steps */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How does it work?
            </h2>
            <p className="text-xl text-gray-600">
              Our AI tattoo creator turns your ideas into designs in 5 easy steps
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-200 via-blue-600 to-gray-200 hidden lg:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="relative">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4 group hover:scale-110 transition-transform cursor-pointer">
                      <div className="text-blue-600">
                        {step.icon}
                      </div>
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/generate" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-all hover:scale-105">
              Try It Yourself - It's Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Find Your Perfect Tattoo
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Ideas to Ink in Under 30 Seconds',
                desc: 'Stop scrolling through Pinterest for months. Get professional-quality designs instantly.',
                gradient: 'from-blue-500 to-purple-500'
              },
              {
                title: 'Every Style, Your Way',
                desc: 'From delicate minimalism to bold traditional, explore 20+ artistic styles.',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                title: 'See It on Your Skin First',
                desc: 'Our AR technology shows exactly how your tattoo will look on your body.',
                gradient: 'from-pink-500 to-orange-500'
              },
              {
                title: 'Yours and Yours Alone',
                desc: 'Every design is created fresh for you. No templates, no duplicates.',
                gradient: 'from-orange-500 to-yellow-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} mb-4`} />
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Style Showcase */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Endless Styles
            </h2>
            <p className="text-xl text-gray-600">
              Find your perfect artistic expression
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {styles.map((style, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveStyle(index)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeStyle === index 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {style}
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-pointer">
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform">
                  {styles[activeStyle]} Style {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { number: '50,000+', label: 'Unique Designs Created' },
              { number: '4.8/5', label: 'Average Rating' },
              { number: '10,000+', label: 'Happy Customers' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-sm max-w-2xl mx-auto"
          >
            <p className="text-lg italic mb-4">
              "I was nervous about my first tattoo, but seeing it on my arm first made all the difference. 
              The design was exactly what I described!"
            </p>
            <p className="font-semibold">Sarah M.</p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Your perfect tattoo is just a few words away. No commitment, no credit card, no regrets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/generate" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-medium hover:scale-105 transition-transform">
              Design Your Tattoo Now
            </Link>
            <button className="border-2 border-white px-8 py-4 rounded-xl font-medium hover:bg-white hover:text-blue-600 transition-all">
              See Example Designs
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-2">TattooDesignsAI</h3>
            <p className="text-gray-400">Imagine it. Generate it. Wear it forever.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-white mb-4">Create</h4>
              <ul className="space-y-2">
                <li><Link href="/generate" className="hover:text-white transition-colors">Start Designing</Link></li>
                <li><Link href="/styles" className="hover:text-white transition-colors">Style Gallery</Link></li>
                <li><Link href="/inspiration" className="hover:text-white transition-colors">Inspiration Board</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Learn</h4>
              <ul className="space-y-2">
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/tattoo-care" className="hover:text-white transition-colors">Tattoo Care Guide</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Artist Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">© 2025 TattooDesignsAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}