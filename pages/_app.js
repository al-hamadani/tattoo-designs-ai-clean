import '../styles/globals.css'
import Head from 'next/head'
import GoogleAnalytics from '../components/GoogleAnalytics'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import Script from 'next/script'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    // NProgress config: client only, run once
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 200,
      minimum: 0.2,
    })

    // NProgress route handlers
    const handleStart = () => NProgress.start()
    const handleStop = () => NProgress.done()

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleStop)
    router.events.on('routeChangeError', handleStop)

    // Google Analytics page view
    const handleRouteChange = (url) => {
      if (window.gtag) {
        window.gtag('config', 'G-4QQTX8X3KT', {
          page_path: url,
        })
      }
    }
    router.events.on('routeChangeComplete', handleRouteChange)

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleStop)
      router.events.off('routeChangeError', handleStop)
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4QQTX8X3KT"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4QQTX8X3KT');
        `}
      </Script>
      <Head>
        {/* ... your meta tags etc ... */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0066FF" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="TattooDesignsAI" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TattooDesignsAI" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@tattoodesignsai" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "TattooDesignsAI",
            "applicationCategory": "DesignApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }} />
      </Head>
      <GoogleAnalytics />
      <Component {...pageProps} />
    </>
  )
}
