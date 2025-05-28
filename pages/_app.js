import '../styles/globals.css'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// Optional: Add analytics, error tracking, etc.
export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    // Handle route change events (for analytics, etc.)
    const handleRouteChange = (url) => {
      // Track page views, etc.
      console.log('Route changed to:', url)
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
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
        
        {/* Fonts - System fonts are used, no external fonts needed */}
      </Head>

      <Component {...pageProps} />
    </>
  )
}