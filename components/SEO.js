import Head from 'next/head'
import { useRouter } from 'next/router'

const defaultMeta = {
  title: 'TattooDesignsAI - Your Next Tattoo, Imagined in Seconds',
  description: 'Create unique AI-generated tattoo designs in seconds. Try on virtual tattoos with AR before getting inked. 20+ styles, free to start.',
  image: 'https://tattoodesignsai.com/og-image.jpg',
  type: 'website',
}

export default function SEO({ 
  title, 
  description, 
  image,
  article = false,
  date,
  keywords 
}) {
  const router = useRouter()
  const url = `https://tattoodesignsai.com${router.asPath}`
  
  const meta = {
    title: title ? `${title} | TattooDesignsAI` : defaultMeta.title,
    description: description || defaultMeta.description,
    image: image || defaultMeta.image,
    type: article ? 'article' : defaultMeta.type,
  }

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{meta.title}</title>
      <meta name="title" content={meta.title} />
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={keywords || "AI tattoo generator, tattoo design, virtual tattoo try on, tattoo ideas, custom tattoo creator, tattoo styles, minimalist tattoo, traditional tattoo, geometric tattoo"} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={meta.type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:site_name" content="TattooDesignsAI" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={meta.title} />
      <meta property="twitter:description" content={meta.description} />
      <meta property="twitter:image" content={meta.image} />
      <meta name="twitter:creator" content="@tattoodesignsai" />
      
      {/* Article specific */}
      {article && date && (
        <>
          <meta property="article:published_time" content={date} />
          <meta property="article:author" content="TattooDesignsAI" />
        </>
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="utf-8" />
      <meta name="theme-color" content="#0066FF" />
      
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'TattooDesignsAI',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            description: meta.description,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            featureList: [
              'AI-powered tattoo generation',
              'AR preview on skin',
              '20+ tattoo styles',
              'Instant download',
              'High resolution output'
            ],
            screenshot: meta.image,
          }),
        }}
      />
    </Head>
  )
}