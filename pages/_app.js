import '../styles/globals.css'
import Head from 'next/head'
import GoogleAnalytics from '../components/GoogleAnalytics'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.2
})
// Optional: Add analytics, error tracking, etc.
export default function App({ Component, pageProps }) {
  const router = useRouter()
  
  useEffect(() => {
    // Handle route change events (for analytics, etc.)
    const handleStart = () => NProgress.start()
    const handleStop = () => NProgress.done()

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleStop)
    router.events.on('routeChangeError', handleStop)

    const handleRouteChange = (url) => {
      // Track page views, etc.
      console.log('Route changed to:', url)
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleStop)
      router.events.off('routeChangeError', handleStop)
    }
  }, [router.events])

  // Add any global providers here (auth, theme, etc.)
  return (
    <>
      <Head>
        {/* Global Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0066FF" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Default SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="TattooDesignsAI" />
        
        {/* Open Graph defaults */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TattooDesignsAI" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card defaults */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@tattoodesignsai" />
        
         {/* Essential SEO */}
         <meta name="description" content="Create unique AI tattoo designs in seconds. Try on with AR before getting inked. 20+ styles, free to start." />
        <meta name="keywords" content="AI tattoo generator, tattoo design, virtual tattoo try on, tattoo ideas, custom tattoo creator" />
        
        {/* Schema.org markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "TattooDesignsAI",
            "applicationCategory": "DesignApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })}
        </script>
        {/* Fonts - System fonts are used, no external fonts needed */}
      </Head>
      <GoogleAnalytics />

      <Component {...pageProps} />
    </>
  )
}





export default function App({ Component, pageProps }) {
  

  return <Component {...pageProps} />
}