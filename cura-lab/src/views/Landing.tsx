// src/views/Landing.tsx
import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Exhibition, Media } from '../../../payload-project/src/payload-types'

import art1 from '../assets/artworks/art1.jpg'
import art2 from '../assets/artworks/art2.jpg'
import art3 from '../assets/artworks/art3.jpg'
import art4 from '../assets/artworks/art4.jpg'
import art5 from '../assets/artworks/art5.jpg'
import art6 from '../assets/artworks/art6.jpg'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL
const heroImages = [art1, art2, art3, art4, art5, art6]

function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

type LandingProps = {
  onBrowse: () => void
  onArtistPortal: () => void
}

export default function Landing({ onBrowse, onArtistPortal }: LandingProps) {
  const [heroIndex, setHeroIndex] = useState(0)

  // Slow crossfade between hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="bg-white">
      {/* ─── Hero ─── */}
      <section className="relative h-[85vh] overflow-hidden">
        {/* Background image with crossfade - only first image eager loaded */}
        {heroImages.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{ opacity: heroIndex === i ? 1 : 0 }}
          >
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end max-w-screen-2xl mx-auto px-6 lg:px-12 pb-20">
          <h1
            className="text-5xl sm:text-6xl lg:text-8xl text-white font-light leading-[1.05] mb-6 max-w-4xl"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Where art meets
            <br />
            its audience.
          </h1>
          <p className="text-lg text-white/70 max-w-xl mb-10 leading-relaxed">
            A platform for galleries, artists, and jurors to collaborate
            on exhibitions with clarity and elegance.
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={onArtistPortal}
              className="group px-8 py-4 text-[13px] tracking-[0.1em] uppercase font-medium bg-white text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={onBrowse}
              className="group px-8 py-4 text-[13px] tracking-[0.1em] uppercase font-medium text-white border border-white/40 hover:border-white hover:bg-white/10 transition-all"
            >
              View Exhibitions
            </button>
          </div>
        </div>

        {/* Image counter */}
        <div className="absolute bottom-8 right-12 hidden lg:flex items-center gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`w-8 h-0.5 transition-all ${
                heroIndex === i ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ─── Value Proposition ─── */}
      <section className="py-32 border-b border-neutral-100">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            <div>
              <p className="text-[13px] tracking-[0.15em] uppercase text-neutral-400 mb-6">
                The Platform
              </p>
              <h2
                className="text-4xl lg:text-5xl font-light text-neutral-900 leading-[1.15]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                A considered approach to exhibition management.
              </h2>
            </div>
            <div className="lg:pt-4 space-y-8">
              <p className="text-lg text-neutral-500 leading-relaxed">
                Cura Lab replaces the scattered workflows of open calls, jury reviews,
                and artist communications with a single, refined experience.
              </p>
              <div className="space-y-6">
                {[
                  { title: 'For Galleries', desc: 'Create exhibitions, manage submissions, and coordinate jury panels from one workspace.' },
                  { title: 'For Artists', desc: 'Discover opportunities, submit work, and track every application in real time.' },
                  { title: 'For Jurors', desc: 'Review submissions through an intuitive interface designed for focused, fair evaluation.' },
                ].map((item, i) => (
                  <div key={i} className="group">
                    <h3 className="text-sm font-medium text-neutral-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-32 border-b border-neutral-100">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <p className="text-[13px] tracking-[0.15em] uppercase text-neutral-400 mb-16">
            Process
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { num: '01', title: 'Create', desc: 'Set up your exhibition with details, deadlines, and submission requirements.' },
              { num: '02', title: 'Review', desc: 'Invite jurors to evaluate submissions through a focused review interface.' },
              { num: '03', title: 'Exhibit', desc: 'Finalize selections, generate exhibition materials, and notify artists.' },
            ].map((step) => (
              <div key={step.num}>
                <div className="text-[13px] tracking-[0.15em] text-neutral-300 mb-4">{step.num}</div>
                <h3
                  className="text-2xl font-light text-neutral-900 mb-3"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Image Grid ─── */}
      <section className="py-32 border-b border-neutral-100">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[13px] tracking-[0.15em] uppercase text-neutral-400 mb-4">
                Current Exhibitions
              </p>
              <h2
                className="text-3xl lg:text-4xl font-light text-neutral-900"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Now Accepting Submissions
              </h2>
            </div>
            <button
              onClick={onBrowse}
              className="hidden sm:flex items-center gap-2 text-[13px] tracking-[0.08em] uppercase text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <OpenExhibitions onCardClick={onBrowse} />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 bg-neutral-950 text-white">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 text-center">
          <h2
            className="text-4xl lg:text-6xl font-light mb-6 leading-[1.1]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Begin your next exhibition.
          </h2>
          <p className="text-neutral-500 text-lg mb-12 max-w-xl mx-auto">
            Join galleries and artists who trust Cura Lab for a more
            intentional approach to exhibitions.
          </p>
          <button
            onClick={onArtistPortal}
            className="px-10 py-4 text-[13px] tracking-[0.1em] uppercase font-medium bg-white text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 border-t border-neutral-100">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="text-sm tracking-[0.1em] uppercase text-neutral-300"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Cura Lab
          </span>
          <span className="text-xs text-neutral-300">
            &copy; {new Date().getFullYear()} All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  )
}

// ─── Open Exhibitions Grid ──────────────────────────────────

function OpenExhibitions({ onCardClick }: { onCardClick: () => void }) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(
          `${PAYLOAD_URL}/api/exhibitions?depth=1&where[status][equals]=published&where[exhibitionStatus][equals]=open&limit=4`
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.docs)) setExhibitions(data.docs)
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch_()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-100">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white">
            <div className="aspect-[4/3] bg-neutral-50 animate-pulse" />
            <div className="p-6 space-y-3">
              <div className="h-4 bg-neutral-100 rounded w-2/3" />
              <div className="h-3 bg-neutral-50 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (exhibitions.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-400">No open exhibitions at the moment.</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-px bg-neutral-200 ${
      exhibitions.length === 1 ? 'grid-cols-1 max-w-2xl' :
      exhibitions.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2'
    }`}>
      {exhibitions.map((ex) => (
        <button
          key={ex.id}
          onClick={onCardClick}
          className="group bg-white text-left hover:bg-neutral-50 transition-colors"
        >
          <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative">
            {isMedia(ex.cover_image) ? (
              <img
                src={`${PAYLOAD_URL}${ex.cover_image.url!}`}
                alt={ex.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-neutral-100" />
            )}
          </div>
          <div className="p-6 lg:p-8">
            <h3
              className="text-xl font-light text-neutral-900 mb-2 group-hover:opacity-70 transition-opacity"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {ex.title}
            </h3>
            <p className="text-sm text-neutral-400 line-clamp-2 mb-4">
              {ex.description || ''}
            </p>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>${ex.submission_fee || 0} entry</span>
              <span className="flex items-center gap-1 group-hover:text-neutral-900 transition-colors">
                Details <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}