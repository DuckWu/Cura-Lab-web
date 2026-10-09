// src/views/GalleryDetail.tsx

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  ArrowUpRight
} from 'lucide-react'
import type { Gallery, Media, Exhibition } from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type GalleryDetailProps = {
  id: number
  onBack: () => void
  onViewExhibition?: (id: number) => void
}

export default function GalleryDetail({ id, onBack, onViewExhibition }: GalleryDetailProps) {
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingExhibitions, setLoadingExhibitions] = useState(false)

  useEffect(() => {
    async function fetchGalleryAndExhibitions() {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const galleryResponse = await fetch(`${PAYLOAD_URL}/api/galleries/${id}?depth=1`)
        if (!galleryResponse.ok) {
          throw new Error('Failed to fetch gallery details')
        }
        const galleryData: Gallery = await galleryResponse.json()
        setGallery(galleryData)

        setLoadingExhibitions(true)
        const exhibitionsResponse = await fetch(
          `${PAYLOAD_URL}/api/exhibitions?depth=1&where[gallery][equals]=${id}&where[status][equals]=published`
        )

        if (exhibitionsResponse.ok) {
          const exhibitionsData = await exhibitionsResponse.json()
          if (Array.isArray(exhibitionsData.docs)) {
            setExhibitions(exhibitionsData.docs)
          }
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
        setLoadingExhibitions(false)
      }
    }

    fetchGalleryAndExhibitions()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-ink animate-spin mx-auto mb-4" />
          <p className="eyebrow">Loading gallery</p>
        </div>
      </div>
    )
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center py-20">
          <p className="eyebrow mb-4">Not found</p>
          <h2 className="display text-3xl mb-4">Gallery Not Found</h2>
          <p className="text-stone mb-10">{error || 'This gallery does not exist.'}</p>
          <button onClick={onBack} className="btn-solid">
            Back to Galleries
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Back bar */}
      <div className="sticky top-16 z-40 bg-paper/85 backdrop-blur-xl border-b border-fog">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-4">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-[13px] tracking-[0.1em] uppercase text-stone hover:text-ink font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Galleries</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative bg-ink text-paper overflow-hidden">
        {isMedia(gallery.logo) && (
          <div className="absolute inset-0">
            <img
              src={`${PAYLOAD_URL}${gallery.logo.url!}`}
              alt={gallery.logo.alt || gallery.name}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
          </div>
        )}

        <div className="relative max-w-screen-2xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div className="max-w-3xl">
            {isMedia(gallery.logo) && (
              <div className="mb-10">
                <img
                  src={`${PAYLOAD_URL}${gallery.logo.url!}`}
                  alt={gallery.logo.alt || gallery.name}
                  className="w-28 h-28 object-cover rounded-full border border-paper/20"
                />
              </div>
            )}

            <h1 className="display text-paper text-5xl sm:text-6xl lg:text-7xl mb-5">
              {gallery.name}
            </h1>

            {gallery.location && (
              <div className="flex items-center gap-2 text-[13px] tracking-[0.12em] uppercase text-paper/50 mb-8">
                <MapPin className="w-4 h-4" />
                <span>{gallery.location}</span>
              </div>
            )}

            {gallery.bio && (
              <p className="text-lg text-paper/60 leading-relaxed font-light max-w-2xl">
                {gallery.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Exhibitions */}
          <div className="lg:col-span-2">
            <div className="flex items-baseline justify-between mb-8">
              <p className="eyebrow">Exhibitions</p>
              <span className="text-[13px] text-stone">
                <span className="text-ink font-medium">{exhibitions.length}</span>
                {' '}{exhibitions.length === 1 ? 'exhibition' : 'exhibitions'}
              </span>
            </div>

            {loadingExhibitions ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-stone animate-spin" />
              </div>
            ) : exhibitions.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-fog">
                <p className="font-display italic text-2xl text-stone mb-3">No exhibitions yet.</p>
                <p className="text-sm text-stone/70">This gallery hasn&apos;t published any exhibitions.</p>
              </div>
            ) : (
              <div className="divide-y divide-fog border-y border-fog">
                {exhibitions.map((exhibition) => (
                  <ExhibitionRow
                    key={exhibition.id}
                    exhibition={exhibition}
                    onView={onViewExhibition}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-10">
              <div className="border-t border-fog pt-8">
                <p className="eyebrow mb-5">Contact</p>
                <div className="space-y-3.5">
                  {gallery.email && (
                    <a
                      href={`mailto:${gallery.email}`}
                      className="flex items-center gap-3 text-[15px] text-stone hover:text-ink transition-colors group"
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="break-all">{gallery.email}</span>
                    </a>
                  )}
                  {gallery.phone && (
                    <a
                      href={`tel:${gallery.phone}`}
                      className="flex items-center gap-3 text-[15px] text-stone hover:text-ink transition-colors"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{gallery.phone}</span>
                    </a>
                  )}
                  {gallery.website && (
                    <a
                      href={gallery.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-[15px] text-stone hover:text-ink transition-colors"
                    >
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span className="break-all flex-1">{gallery.website}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  )}
                  {!gallery.email && !gallery.phone && !gallery.website && (
                    <p className="font-display italic text-lg text-stone">No contact information available.</p>
                  )}
                </div>
              </div>

              {gallery.commissionRate !== undefined && gallery.commissionRate !== null && (
                <div className="border border-fog p-7">
                  <p className="eyebrow mb-3">Commission Rate</p>
                  <p className="font-display text-4xl font-light text-ink">{gallery.commissionRate}%</p>
                  <p className="text-sm text-stone mt-2">Standard commission on artwork sales.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ExhibitionRowProps {
  exhibition: Exhibition
  onView?: (id: number) => void
}

function ExhibitionRow({ exhibition, onView }: ExhibitionRowProps) {
  return (
    <button
      onClick={() => onView && onView(exhibition.id)}
      disabled={!onView}
      className="group w-full flex items-center gap-6 py-6 text-left disabled:cursor-default"
    >
      <div className="flex-shrink-0 w-20 h-20 bg-fog overflow-hidden">
        {isMedia(exhibition.cover_image) ? (
          <img
            src={`${PAYLOAD_URL}${exhibition.cover_image.url!}`}
            alt={exhibition.cover_image.alt || exhibition.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-stone/50" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-display text-xl text-ink mb-1 truncate group-hover:opacity-60 transition-opacity">
          {exhibition.title}
        </h4>
        {exhibition.start_date && exhibition.end_date && (
          <div className="flex items-center gap-1.5 text-[13px] text-stone">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(exhibition.start_date)} — {formatDate(exhibition.end_date)}</span>
          </div>
        )}
      </div>

      {onView && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full border border-fog flex items-center justify-center group-hover:bg-ink group-hover:border-ink transition-colors">
          <ArrowUpRight className="w-4 h-4 text-stone group-hover:text-paper transition-colors" />
        </div>
      )}
    </button>
  )
}
