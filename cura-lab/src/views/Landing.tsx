// src/views/Landing.tsx
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import type { Exhibition, Media } from '../../../payload-project/src/payload-types'

const HeroCanvas = lazy(() => import('../components/HeroCanvas'))

import art1 from '../assets/artworks/art1.jpg'
import art2 from '../assets/artworks/art2.jpg'
import art3 from '../assets/artworks/art3.jpg'
import art4 from '../assets/artworks/art4.jpg'
import art5 from '../assets/artworks/art5.jpg'
import art6 from '../assets/artworks/art6.jpg'

gsap.registerPlugin(ScrollTrigger)

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL
const heroImages = [art1, art2, art3, art4, art5, art6]

function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

type LandingProps = {
  onBrowse: () => void
  onArtistPortal: () => void
  onViewExhibition: (id: number) => void
}

export default function Landing({ onBrowse, onArtistPortal, onViewExhibition }: LandingProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [heroIndex, setHeroIndex] = useState(0)

  // Hero slideshow is owned here: the 6s timer advances heroIndex,
  // HeroCanvas crossfades to follow it (ticks are clickable too).
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  // Hero entrance: masked line reveals + fade
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(
        '.hero-line > span',
        { yPercent: 110 },
        { yPercent: 0, duration: 1.4, stagger: 0.12, delay: 0.35 },
      )
        .fromTo(
          '.hero-fade',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, stagger: 0.12 },
          '-=0.8',
        )
        .fromTo(
          '.hero-counter',
          { opacity: 0 },
          { opacity: 1, duration: 1 },
          '-=0.6',
        )
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // Section reveals on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach(el => {
        gsap.fromTo(
          el,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
          },
        )
      })
      // stagger children of grids
      gsap.utils.toArray<HTMLElement>('.reveal-group').forEach(group => {
        gsap.fromTo(
          group.children,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.1,
            scrollTrigger: { trigger: group, start: 'top 85%' },
          },
        )
      })
      // Re-measure triggers after layout-affecting resources settle
      // (webfonts, async content). Without this, triggers measured
      // against a taller pre-load layout may never fire.
    }, rootRef)
    const refresh = () => ScrollTrigger.refresh()
    if (document.fonts?.ready) document.fonts.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => {
      window.removeEventListener('load', refresh)
      ctx.revert()
    }
  }, [])

  return (
    <main ref={rootRef} className="bg-paper">
      {/* ─── Hero ─── */}
      <section className="relative h-[92vh] min-h-[640px] overflow-hidden grain">
        <Suspense fallback={<div className="absolute inset-0 bg-neutral-950" />}>
          <HeroCanvas images={heroImages} activeIndex={heroIndex} />
        </Suspense>

        {/* Legibility gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end max-w-screen-2xl mx-auto px-6 lg:px-12 pb-24">
          <h1 className="display text-white text-6xl sm:text-7xl lg:text-[7.5rem] mb-8 max-w-5xl">
            <span className="mask-line hero-line"><span>Where art meets</span></span>
            <span className="mask-line hero-line"><span className="italic">its audience.</span></span>
          </h1>
          <p className="hero-fade text-lg text-white/70 max-w-xl mb-10 leading-relaxed font-light">
            A platform for galleries, artists, and jurors to collaborate
            on exhibitions with clarity and elegance.
          </p>
          <div className="hero-fade flex flex-wrap items-center gap-5">
            <button onClick={onArtistPortal} className="btn-solid bg-white text-ink hover:bg-white/85">
              Get Started
            </button>
            <button onClick={onBrowse} className="btn-line text-white border-white/40 hover:border-white">
              View Exhibitions
            </button>
          </div>
        </div>

        {/* Image counter */}
        <div className="hero-counter absolute bottom-10 right-12 hidden lg:flex items-center gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              aria-label={`Show artwork ${i + 1}`}
              className={`h-0.5 transition-all duration-500 ${heroIndex === i ? 'w-10 bg-white' : 'w-6 bg-white/30 hover:bg-white/60'}`}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <div className="hero-fade absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3 text-white/50">
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <span className="w-px h-10 bg-white/30 overflow-hidden relative">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-white animate-[scrollhint_1.8s_ease-in-out_infinite]" />
          </span>
        </div>
      </section>

      {/* ─── Value Proposition ─── */}
      <section className="py-28 lg:py-40 border-b border-fog">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <div className="lg:sticky lg:top-32">
              <div className="reveal">
                <p className="eyebrow mb-6">The Platform</p>
                <h2 className="display text-4xl lg:text-6xl">
                  A considered approach to exhibition management.
                </h2>
              </div>
            </div>
            <div className="lg:pt-4 space-y-10">
              <p className="reveal text-xl text-ink-soft leading-relaxed font-light">
                Cura Lab replaces the scattered workflows of open calls, jury reviews,
                and artist communications with a single, refined experience.
              </p>
              <div className="reveal-group space-y-8">
                {[
                  { title: 'For Galleries', desc: 'Create exhibitions, manage submissions, and coordinate jury panels from one workspace.' },
                  { title: 'For Artists', desc: 'Discover opportunities, submit work, and track every application in real time.' },
                  { title: 'For Jurors', desc: 'Review submissions through an intuitive interface designed for focused, fair evaluation.' },
                ].map(item => (
                  <div key={item.title} className="group border-l border-fog pl-8 py-1 hover:border-ink transition-colors duration-500">
                    <h3 className="font-sans text-sm font-medium tracking-[0.08em] uppercase text-ink mb-2">{item.title}</h3>
                    <p className="text-[15px] text-stone leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-28 lg:py-40 border-b border-fog">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <p className="reveal eyebrow mb-16">Process</p>
          <div className="reveal-group grid grid-cols-1 md:grid-cols-3 gap-14">
            {[
              { num: '01', title: 'Create', desc: 'Set up your exhibition with details, deadlines, and submission requirements.' },
              { num: '02', title: 'Review', desc: 'Invite jurors to evaluate submissions through a focused review interface.' },
              { num: '03', title: 'Exhibit', desc: 'Finalize selections, generate exhibition materials, and notify artists.' },
            ].map(step => (
              <div key={step.num} className="group">
                <div className="text-[13px] tracking-[0.2em] text-stone/60 mb-5 font-display italic text-2xl">{step.num}</div>
                <h3 className="display text-3xl mb-4">{step.title}</h3>
                <p className="text-[15px] text-stone leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Exhibitions ─── */}
      <section className="py-28 lg:py-40 border-b border-fog">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="reveal flex items-end justify-between mb-14">
            <div>
              <p className="eyebrow mb-4">Current Exhibitions</p>
              <h2 className="display text-4xl lg:text-5xl">Now Accepting Submissions</h2>
            </div>
            <button
              onClick={onBrowse}
              className="hidden sm:flex items-center gap-2 text-[13px] tracking-[0.1em] uppercase text-stone hover:text-ink transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <OpenExhibitions onCardClick={onViewExhibition} />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-32 lg:py-44 bg-ink text-paper overflow-hidden">
        <div className="reveal max-w-screen-2xl mx-auto px-6 lg:px-12 text-center relative">
          <p className="eyebrow mb-8 text-paper/40">Begin</p>
          <h2 className="display text-paper text-5xl lg:text-7xl mb-8 leading-[1.05]">
            Begin your next<br /><span className="italic">exhibition.</span>
          </h2>
          <p className="text-paper/50 text-lg mb-14 max-w-xl mx-auto font-light">
            Join galleries and artists who trust Cura Lab for a more
            intentional approach to exhibitions.
          </p>
          <button onClick={onArtistPortal} className="btn-solid bg-paper text-ink hover:bg-white">
            Get Started
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 border-t border-fog">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg tracking-[0.12em] uppercase text-stone">
            Cura Lab
          </span>
          <span className="text-xs text-stone/70 tracking-wide">
            &copy; {new Date().getFullYear()} All rights reserved.
          </span>
        </div>
      </footer>

    </main>
  )
}

// ─── Open Exhibitions Grid ──────────────────────────────────

function OpenExhibitions({ onCardClick }: { onCardClick: (id: number) => void }) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const animatedRef = useRef(false)

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
      finally {
        setLoading(false)
        // skeleton -> real content changes page height; re-measure triggers
        requestAnimationFrame(() => ScrollTrigger.refresh())
      }
    }
    fetch_()
  }, [])

  // The page-level reveal effect runs on mount while this grid is still a
  // skeleton, so animate the cards here once real data lands.
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || exhibitions.length === 0 || animatedRef.current) return
    animatedRef.current = true
    const tween = gsap.fromTo(
      grid.children,
      { y: 36, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: grid, start: 'top 85%' },
      },
    )
    ScrollTrigger.refresh()
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [exhibitions.length])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-fog">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-paper">
            <div className="aspect-[4/3] bg-fog/60 animate-pulse" />
            <div className="p-8 space-y-3">
              <div className="h-4 bg-fog rounded w-2/3" />
              <div className="h-3 bg-fog/70 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (exhibitions.length === 0) {
    return (
      <div className="py-24 text-center border border-dashed border-fog">
        <p className="font-display italic text-2xl text-stone">No open exhibitions at the moment.</p>
        <p className="text-sm text-stone/70 mt-3">Check back soon — new open calls appear here.</p>
      </div>
    )
  }

  return (
    <div ref={gridRef} className={`reveal-group grid gap-px bg-fog border border-fog ${
      exhibitions.length === 1 ? 'grid-cols-1 max-w-2xl' :
      exhibitions.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2'
    }`}>
      {exhibitions.map(ex => (
        <button
          key={ex.id}
          onClick={() => onCardClick(ex.id)}
          className="group bg-paper text-left hover:bg-white transition-colors duration-500"
        >
          <div className="aspect-[4/3] bg-fog overflow-hidden relative">
            {isMedia(ex.cover_image) ? (
              <img
                src={`${PAYLOAD_URL}${ex.cover_image.url!}`}
                alt={ex.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
            ) : (
              <div className="w-full h-full bg-fog" />
            )}
            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500" />
          </div>
          <div className="p-8">
            <p className="eyebrow text-[11px] mb-3">{ex.submission_fee ? `$${ex.submission_fee} entry` : 'Free entry'}</p>
            <h3 className="display text-2xl mb-3 group-hover:opacity-60 transition-opacity duration-300">
              {ex.title}
            </h3>
            <p className="text-sm text-stone line-clamp-2 mb-6 leading-relaxed">
              {ex.description || ''}
            </p>
            <span className="inline-flex items-center gap-2 text-[12px] tracking-[0.12em] uppercase text-ink font-medium">
              View Exhibition
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
