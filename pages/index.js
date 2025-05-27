// pages/index.js - Beautiful landing page
import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // For now, just show success message
    // Later: integrate with email service
    setIsSubmitted(true)
  }

  return (
    <>
      <Head>
        <title>Tattoo Designs AI - Create Your Dream Tattoo with AI</title>
        <meta name="description" content="Generate unique, personalized tattoo designs using AI. From idea to ink in seconds." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <div className="text-2xl font-bold text-white">
              Tattoo Designs AI
            </div>
            <button className="bg-white text-purple-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Coming Soon
            </button>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Create Your Dream
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent block">
                Tattoo with AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Generate unique, personalized tattoo designs in seconds. 
              From simple ideas to complex artwork - powered by artificial intelligence.
            </p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-white mb-2">Instant Generation</h3>
                <p className="text-gray-300">Get unique designs in under 30 seconds</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-white mb-2">Multiple Styles</h3>
                <p className="text-gray-300">Traditional, minimalist, geometric, and more</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-xl font-semibold text-white mb-2">100% Unique</h3>
                <p className="text-gray-300">Every design is original and personalized</p>
              </div>
            </div>

            {/* Email Signup */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md mx-auto border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Get Early Access</h2>
              
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Notify Me When Ready 🚀
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-white mb-2">You&apos; on the list!</h3>
                  <p className="text-gray-300">We&apos;ll notify you when Tattoo Designs AI launches.</p>
                </div>
              )}
              
              <p className="text-sm text-gray-400 mt-4">
                Join 100+ people waiting for launch
              </p>
            </div>

            {/* Social Proof */}
            <div className="mt-16 text-center">
              <p className="text-gray-400 mb-4">Powered by cutting-edge AI technology</p>
              <div className="flex justify-center space-x-8 opacity-60">
                <div className="text-white font-semibold">OpenAI</div>
                <div className="text-white font-semibold">Stable Diffusion</div>
                <div className="text-white font-semibold">Neural Networks</div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-white/20">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Tattoo Designs AI. Built with passion for ink and innovation.</p>
          </div>
        </footer>
      </div>
    </>
  )
}