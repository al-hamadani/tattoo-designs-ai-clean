import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, Play, Sparkles, Type, Layers, Eye, Download,
  Check, ChevronDown, Zap, Camera, Palette
} from 'lucide-react'
import Navigation from '../components/Navigation'
import Layout from '../components/Layout'

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const [expandedFAQ, setExpandedFAQ] = useState(null)

  const steps = [
    {
      number: 1,
      title: "Describe Your Vision",
      subtitle: "Type your idea in plain words",
      icon: <Type className="w-8 h-8" />,
      description: "Simply describe what you want in everyday language. No artistic jargon needed—just share your vision as if you're talking to a friend.",
      details: [
        "Use natural language like 'geometric wolf with moon'",
        "Include style preferences if you have them",
        "Mention size, placement, or color preferences",
        "Be as specific or as open as you want"
      ],
      example: "I want a minimalist mountain range with a small sun rising behind the peaks",
      color: "from-blue-500 to-blue-600"
    },
    {
      number: 2,
      title: "AI Creates Magic",
      subtitle: "Watch multiple unique designs appear",
      icon: <Sparkles className="w-8 h-8" />,
      description: "Our advanced AI analyzes your description and creates multiple original designs tailored specifically to your vision.",
      details: [
        "Each design is 100% unique to you",
        "AI considers composition, balance, and artistry",
        "Multiple variations to choose from",
        "Generated in under 30 seconds"
      ],
      example: "4 different interpretations of your idea, each with its own artistic flair",
      color: "from-purple-500 to-purple-600"
    },
    {
      number: 3,
      title: "Choose Your Style",
      subtitle: "Pick from 20+ artistic styles",
      icon: <Palette className="w-8 h-8" />,
      description: "Select from over 20 professional tattoo styles or let our AI suggest the perfect style for your design.",
      details: [
        "Traditional, minimalist, geometric, watercolor, and more",
        "Mix and match styles for unique combinations",
        "AI can recommend styles based on your description",
        "Preview how your design looks in different styles"
      ],
      example: "Your mountain design shown in minimalist, geometric, and watercolor styles",
      color: "from-pink-500 to-pink-600"
    },
    {
      number: 4,
      title: "Try It On",
      subtitle: "See it on your skin with AR",
      icon: <Eye className="w-8 h-8" />,
      description: "Use your phone's camera to see exactly how the tattoo will look on your body before making it permanent.",
      details: [
        "Real-time AR preview on your actual skin",
        "Adjust size and placement instantly",
        "See how it looks from different angles",
        "Test multiple body locations"
      ],
      example: "Move, resize, and rotate the design on your arm in real-time",
      color: "from-orange-500 to-orange-600"
    },
    {
      number: 5,
      title: "Get Your Design",
      subtitle: "Download HD files for your artist",
      icon: <Download className="w-8 h-8" />,
      description: "Download high-resolution files ready for your tattoo artist, complete with reference images and style notes.",
      details: [
        "High-resolution PNG and SVG files",
        "Multiple size variations included",
        "Style guide for your artist",
        "Lifetime access to your designs"
      ],
      example: "Complete design package with stencil-ready artwork",
      color: "from-green-500 to-green-600"
    }
  ]

  const faqs = [
    {
      question: "How unique are the designs?",
      answer: "Every design is generated fresh based on your specific description. Our AI creates original artwork for each request, ensuring no two designs are ever the same. Your tattoo will be truly one-of-a-kind."
    },
    {
      question: "Can I modify the designs after they're generated?",
      answer: "Yes! You can regenerate variations, try different styles, adjust elements, and refine your design until it's perfect. Each iteration builds on your feedback."
    },
    {
      question: "What file formats do I receive?",
      answer: "You'll receive high-resolution PNG files (300 DPI) perfect for printing, plus vector SVG files that can be scaled to any size without quality loss. We also include a style guide for your tattoo artist."
    },
    {
      question: "How accurate is the AR preview?",
      answer: "Our AR technology provides a realistic preview of size, placement, and how the design follows your body's natural contours. While actual tattoo ink will be more vivid, you'll have a clear idea of the final result."
    },
    {
      question: "Can I use these designs with any tattoo artist?",
      answer: "Absolutely! The files we provide are professional-grade and ready for any tattoo artist to work with. They can use them directly as stencils or as detailed reference material."
    },
    {
      question: "What if I don't know what I want?",
      answer: "No problem! Start with a simple idea or feeling, browse our style gallery for inspiration, or use our AI suggestions. You can generate as many designs as you need to find the perfect one."
    }
  ]

  return (
    <Layout
      title="How It Works"
      description="Learn how TattooDesignsAI generates custom tattoo designs using artificial intelligence."
      keywords="how it works, AI tattoo, tattoo design process, tattoo generator"
    >
      <main className="min-h-screen pt-20 bg-gray-50">
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                How does it work?
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Our AI tattoo creator turns your ideas into professional designs in 5 simple steps. 
                No artistic skills needed—just your imagination.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/generate" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-2">
                  Start Creating
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium border-2 border-gray-200 hover:border-gray-300 transition-all">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Interactive Steps */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Step Progress Bar */}
            <div className="mb-12">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <button
                      onClick={() => setActiveStep(index)}
                      className={`relative transition-all ${
                        activeStep === index ? 'scale-110' : 'hover:scale-105'
                      }`}
                    >
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                        activeStep === index 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : activeStep > index
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {activeStep > index ? <Check className="w-6 h-6" /> : step.number}
                      </div>
                      <span className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs md:text-sm whitespace-nowrap ${
                        activeStep === index ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </span>
                    </button>
                    {index < steps.length - 1 && (
                      <div className={`w-16 md:w-32 h-1 mx-2 transition-all ${
                        activeStep > index ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-20"
              >
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="md:flex">
                    {/* Step Visual */}
                    <div className={`md:w-1/2 p-12 bg-gradient-to-br ${steps[activeStep].color} flex items-center justify-center`}>
                      <div className="text-white text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                          {steps[activeStep].icon}
                        </div>
                        <h3 className="text-3xl font-bold mb-2">{steps[activeStep].title}</h3>
                        <p className="text-xl opacity-90">{steps[activeStep].subtitle}</p>
                      </div>
                    </div>

                    {/* Step Details */}
                    <div className="md:w-1/2 p-12">
                      <div className="prose prose-lg">
                        <p className="text-gray-600 mb-6">
                          {steps[activeStep].description}
                        </p>
                        
                        <h4 className="text-lg font-semibold mb-3">What happens:</h4>
                        <ul className="space-y-2 mb-6">
                          {steps[activeStep].details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="bg-gray-50 rounded-xl p-6">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Example:</h5>
                          <p className="text-gray-600 italic">{steps[activeStep].example}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-8">
                        {activeStep > 0 && (
                          <button
                            onClick={() => setActiveStep(activeStep - 1)}
                            className="px-6 py-3 rounded-lg font-medium border-2 border-gray-200 hover:border-gray-300 transition-all"
                          >
                            Previous
                          </button>
                        )}
                        {activeStep < steps.length - 1 ? (
                          <button
                            onClick={() => setActiveStep(activeStep + 1)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
                          >
                            Next Step
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <Link
                            href="/generate"
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:scale-105 transition-transform flex items-center gap-2"
                          >
                            Start Creating
                            <Sparkles className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Video Demo Section */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
            <p className="text-xl text-gray-600 mb-8">
              Watch Emma go from idea to perfect design in 60 seconds
            </p>
            <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-lg relative group cursor-pointer">
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm">
                1:23
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-left">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedFAQ === index ? 'rotate-180' : ''
                    }`} />
                  </button>
                  <AnimatePresence>
                    {expandedFAQ === index && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4">
                          <p className="text-gray-600">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Still have questions?</p>
              <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact our support team
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Create Your Perfect Tattoo?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands who've already found their dream design
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/generate" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-medium hover:scale-105 transition-transform">
                Start Creating - It's Free
              </Link>
              <Link href="/gallery" className="border-2 border-white px-8 py-4 rounded-xl font-medium hover:bg-white hover:text-blue-600 transition-all">
                Browse Gallery
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}