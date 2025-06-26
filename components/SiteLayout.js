import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Share2, Download } from 'lucide-react';

// Assuming Navigation component is the same as the previous correct version.
export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all ${
        scrolled
          ? 'border-gray-200 bg-white/90 text-black shadow-md backdrop-blur-lg'
          : 'border-white/10 bg-transparent text-white'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-3xl font-bold italic">
          Wave ink
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {['Design', 'Community', 'Gallery', 'Try Pro'].map((label) => (
            <li key={label}>
              <Link href="#" className="text-sm font-medium transition-colors hover:text-gray-300">
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="#"
              className={`rounded-md border px-5 py-2 text-sm font-semibold transition-colors ${
                scrolled
                  ? 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                  : 'border-white text-white hover:bg-white hover:text-black'
              }`}
            >
              Try Pro
            </Link>
          </li>
        </ul>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 transition-colors hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}


/* -------------------------------------------------------------------------- */
/* 2. Hero – FINAL VERSION with updated Splatter and Polaroid Buttons         */
/* -------------------------------------------------------------------------- */
export function Hero() {
  const styles = ['Traditional', 'Realism', 'Geometric', 'Tribal'];
  const [selectedStyle, setSelectedStyle] = useState(null);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1A102A] py-32 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute -top-1/2 -left-1/3 h-[1000px] w-[1000px] rounded-full bg-purple-900/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-1/2 -right-1/3 h-[1000px] w-[1000px] rounded-full bg-indigo-900/20 blur-3xl" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 px-6 md:grid-cols-2">
        {/* Left Side: Prompt Area with Final Ink Splatter */}
        <div className="relative isolate">
          {/* UPDATED: Bigger, more random splatter SVG */}
          <svg
            viewBox="0 0 700 600"
            className="pointer-events-none absolute -inset-24 z-0 h-auto w-[140%] text-black"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M481.3,71.3C441.6,47,370.8,41.2,316,51.8c-54.8,10.6-103.9,40.8-144.1,81.3S104.3,222.3,100,277 c-4.3,54.7,14.8,108.8,50.1,148.9c35.3,40.1,86.2,64,141.5,67.2c55.3,3.2,111.4-14.7,155.8-51.2c44.4-36.5,73.5-90.8,75.2-148.5 C524.3,235.1,521,120.9,481.3,71.3z" />
          </svg>
          
          <div className="relative z-10 flex flex-col gap-5 p-8">
            <h1 className="text-4xl font-semibold leading-snug sm:text-5xl">
              Describe your dream tattoo
            </h1>
            <input
              type="text"
              className="w-full rounded-lg border-2 border-gray-500 bg-transparent px-4 py-3 text-lg text-white placeholder-gray-400 outline-none transition-colors focus:border-purple-500"
            />
            <div className="flex flex-wrap gap-3">
              {styles.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className="rounded-md border-2 border-white bg-black px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/20"
                >
                  {style}
                </button>
              ))}
            </div>
            <details className="text-sm font-medium text-white">
              <summary className="cursor-pointer list-none select-none">
                Advanced Options &#8964;
              </summary>
            </details>
            <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#4F46E5] py-4 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105">
              Generate Design
            </button>
          </div>
        </div>

        {/* Right Side: Stacked Polaroids with Integrated Buttons */}
        <div className="flex items-center justify-center">
            <div className="relative w-full max-w-sm">
                {/* Back Polaroid */}
                <div className="absolute inset-0 -rotate-6 transform rounded-lg bg-gray-300 p-2 pb-5 shadow-lg">
                     <div className="h-full w-full rounded-sm bg-[#E0E0E0]" />
                </div>
                {/* Front Polaroid */}
                <div className="relative w-full transform rounded-lg bg-gray-200 p-2 shadow-2xl">
                    <div className="flex h-64 w-full items-center justify-center rounded-sm bg-[#F3F3F3] text-center sm:h-80">
                        <span className="text-xl font-medium text-gray-400">
                            Your design
                            <br />
                            will appear here
                        </span>
                    </div>
                     {/* Bottom section of the polaroid frame */}
                    <div className="relative h-20 w-full pt-3">
                        {/* UPDATED: Buttons styled as handwritten text on the frame */}
                         <div className="absolute bottom-4 left-4 flex items-center">
                            <button className="flex items-center gap-2 font-serif text-lg italic text-gray-700 transition-colors hover:text-black">
                                <Share2 className="h-5 w-5" />
                                Share
                            </button>
                         </div>
                         <div className="absolute bottom-4 right-4 flex items-center">
                             <button className="flex items-center gap-2 font-serif text-lg italic text-gray-700 transition-colors hover:text-black">
                                <Download className="h-5 w-5" />
                                Download
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. Page-level layout                                                       */
/* -------------------------------------------------------------------------- */
export default function LandingPageLayout() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
      </main>
    </>
  );
}