// src/views/Gallery.tsx

import { useState, useEffect } from 'react'
import { MapPin, ArrowUpRight, Loader2 } from 'lucide-react'
import type { Gallery, Media } from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

function isMedia(logo: string | number | Media | null | undefined): logo is Media {
  return typeof logo === 'object' && logo !== null && 'url' in logo
}

type GalleryListProps = {
  onViewDetail: (id: number) => void
}

export default function GalleryList({ onViewDetail }: GalleryListProps) {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGalleries() {
      try {
        setLoading(true)
        setError(null)

        const apiUrl = `${PAYLOAD_URL}/api/galleries?depth=1&where[status][equals]=published`
        const response = await fetch(apiUrl)

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.message || 'Failed to fetch galleries')
        }

        const data = await response.json()

        if (Array.isArray(data.docs)) {
          setGalleries(data.docs)
        } else {
          setGalleries([])
        }
      } catch (err: any) {
        console.error('Failed to fetch galleries:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGalleries()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-ink animate-spin mx-auto mb-4" />
          <p className="eyebrow">Loading galleries</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center py-20">
          <p className="eyebrow mb-4">Something went wrong</p>
          <h2 className="display text-3xl mb-4">Couldn&apos;t load galleries</h2>
          <p className="text-stone mb-10">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-solid">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-fog">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-12">
          <p className="eyebrow mb-5">Spaces</p>
          <h1 className="display text-5xl sm:text-6xl lg:text-7xl mb-6">
            Galleries
          </h1>
          <p className="text-lg text-stone font-light max-w-xl leading-relaxed">
            Explore curated spaces showcasing exceptional contemporary art from around the world.
          </p>
          <div className="mt-8 text-[13px] text-stone tracking-wide">
            <span className="text-ink font-medium">{galleries.length}</span>
            {' '}{galleries.length === 1 ? 'gallery' : 'galleries'}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-16">
        {galleries.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-fog">
            <p className="font-display italic text-2xl text-stone mb-3">No galleries yet.</p>
            <p className="text-sm text-stone/70">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-fog border border-fog">
            {galleries.map((gallery) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface GalleryCardProps {
  gallery: Gallery
  onViewDetail: (id: number) => void
}

function GalleryCard({ gallery, onViewDetail }: GalleryCardProps) {
  return (
    <button
      onClick={() => onViewDetail(gallery.id)}
      className="group bg-paper text-left hover:bg-white transition-colors duration-500"
    >
      <div className="aspect-[16/10] bg-fog overflow-hidden relative">
        {isMedia(gallery.logo) ? (
          <img
            src={`${PAYLOAD_URL}${gallery.logo.url!}`}
            alt={gallery.logo.alt || gallery.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-stone/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500" />
        <div className="absolute top-5 right-5 w-9 h-9 rounded-full bg-paper/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
          <ArrowUpRight className="w-4 h-4 text-ink" />
        </div>
      </div>

      <div className="p-7 lg:p-8">
        <h3 className="display text-[26px] leading-tight mb-2 group-hover:opacity-60 transition-opacity duration-300">
          {gallery.name}
        </h3>
        {gallery.location && (
          <div className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-stone mb-3">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{gallery.location}</span>
          </div>
        )}
        {gallery.bio && (
          <p className="text-sm text-stone line-clamp-3 leading-relaxed">
            {gallery.bio}
          </p>
        )}
      </div>
    </button>
  )
}
