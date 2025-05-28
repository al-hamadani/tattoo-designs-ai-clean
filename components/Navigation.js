import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Close mobile menu on route change
    const handleRouteChange = () => setIsMobileMenuOpen(false)
    router.events.on('routeChangeStart', handleRouteChange)
    return () => router.events.off('routeChangeStart', handleRouteChange)
  }, [router.events])

  const navLinks = [
    { href: '/generate', label: 'Generate' },
    { href: '/styles', label: 'Styles' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/gallery', label: 'Gallery' }
  ]

  const isActive = (href) => router.pathname === href

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-white/60 backdrop-blur-sm'
      } border-b border-gray-100`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold tracking-tight group">
              <span className="group-hover:text-blue-600 transition-colors">TattooDesignsAI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors font-medium ${
                    isActive(link.href) 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link 
                href="/generate" 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-2"
              >
                Try Free
                <Sparkles className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <span className="text-xl font-bold">Menu</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-6 py-8">
                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                          isActive(link.href)
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="w-4 h-4 opacity-50" />
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8 space-y-4">
                    <Link
                      href="/generate"
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      Create Your Design
                      <Sparkles className="w-4 h-4" />
                    </Link>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <Link
                        href="/login"
                        className="block text-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                </nav>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 text-center">
                    © 2025 TattooDesignsAI
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}