import Head from 'next/head';
import Navigation from './Navigation';
import SEO from './SEO';

export default function Layout({ children, title, description, keywords }) {
  return (
    <>
      <Head>
        <title>{title ? `${title} - TattooDesignsAI` : 'TattooDesignsAI'}</title>
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
      </Head>
      <SEO title={title} description={description} keywords={keywords} />
      <Navigation />
      <main className="min-h-screen pt-20 pb-12 bg-gray-50">
        {children}
      </main>
    </>
  );
} 