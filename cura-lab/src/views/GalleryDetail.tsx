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
  AlertCircle,
  ExternalLink,
  Image as ImageIcon
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
        // 1. 获取画廊详情
        const galleryResponse = await fetch(`${PAYLOAD_URL}/api/galleries/${id}?depth=1`)
        if (!galleryResponse.ok) {
          throw new Error('Failed to fetch gallery details')
        }
        const galleryData: Gallery = await galleryResponse.json()
        setGallery(galleryData)

        // 2. 获取这个画廊的展览
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-lg text-neutral-600">Loading gallery details...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Gallery Not Found</h2>
          <p className="text-neutral-600 mb-6">{error || 'This gallery does not exist.'}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all"
          >
            Back to Galleries
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Back Button - Fixed at top */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Galleries</span>
          </button>
        </div>
      </div>

      {/* Hero Section with Logo */}
      <div className="relative bg-neutral-900 text-white overflow-hidden">
        {/* Background Image */}
        {isMedia(gallery.logo) && (
          <div className="absolute inset-0">
            <img
              src={`${PAYLOAD_URL}${gallery.logo.url!}`}
              alt={gallery.logo.alt || gallery.name}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 via-neutral-900/90 to-neutral-900"></div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            {/* Logo Icon */}
            {isMedia(gallery.logo) && (
              <div className="mb-8">
                <img
                  src={`${PAYLOAD_URL}${gallery.logo.url!}`}
                  alt={gallery.logo.alt || gallery.name}
                  className="w-32 h-32 object-cover rounded-2xl shadow-2xl border-4 border-white/10"
                />
              </div>
            )}

            {/* Gallery Name */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              {gallery.name}
            </h1>

            {/* Location */}
            {gallery.location && (
              <div className="flex items-center gap-2 text-lg text-white/80 mb-6">
                <MapPin className="w-5 h-5" />
                <span>{gallery.location}</span>
              </div>
            )}

            {/* Bio */}
            {gallery.bio && (
              <p className="text-lg text-white/90 leading-relaxed">
                {gallery.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Exhibitions Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">
                  Exhibitions
                </h2>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-full">
                  {exhibitions.length} {exhibitions.length === 1 ? 'Exhibition' : 'Exhibitions'}
                </span>
              </div>

              {loadingExhibitions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                </div>
              ) : exhibitions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    No Exhibitions Yet
                  </h3>
                  <p className="text-neutral-600">
                    This gallery hasn't published any exhibitions yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exhibitions.map((exhibition) => (
                    <ExhibitionCard
                      key={exhibition.id}
                      exhibition={exhibition}
                      onView={onViewExhibition}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Contact Info */}
          <div className="lg:col-span-1">
  <div className="sticky top-24 space-y-6">
    {/* Contact Card */}
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">
        Contact Information
      </h3>
      <div className="space-y-4">
        {gallery.email && (
          <a
            href={`mailto:${gallery.email}`}
            className="flex items-center gap-3 text-neutral-600 hover:text-neutral-900 transition-colors group"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-sm break-all">{gallery.email}</span>
          </a>
        )}
        
        {gallery.phone && (
          <a
            href={`tel:${gallery.phone}`}
            className="flex items-center gap-3 text-neutral-600 hover:text-neutral-900 transition-colors group"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-sm">{gallery.phone}</span>
          </a>
        )}
        
        {gallery.website && (
          <a
            href={gallery.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-neutral-600 hover:text-neutral-900 transition-colors group"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-sm break-all flex-1">{gallery.website}</span>
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
          </a>
        )}

        {!gallery.email && !gallery.phone && !gallery.website && (
          <p className="text-sm text-neutral-500">
            No contact information available.
          </p>
        )}
      </div>
    </div>

    {/* Additional Info Card */}
    {gallery.commissionRate !== undefined && gallery.commissionRate !== null && (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-2">
          Commission Rate
        </h3>
        <p className="text-3xl font-bold text-blue-600">
          {gallery.commissionRate}%
        </p>
        <p className="text-sm text-neutral-600 mt-2">
          Standard commission on artwork sales
        </p>
      </div>
    )}
  </div>
</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Exhibition Card Component
 */
interface ExhibitionCardProps {
  exhibition: Exhibition
  onView?: (id: number) => void
}

function ExhibitionCard({ exhibition, onView }: ExhibitionCardProps) {
  const handleClick = () => {
    if (onView) {
      onView(exhibition.id)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!onView}
      className="w-full bg-white rounded-xl border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-lg transition-all text-left group disabled:cursor-default"
    >
      <div className="flex items-start gap-4">
        {/* Cover Image Thumbnail */}
        <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg overflow-hidden">
          {isMedia(exhibition.cover_image) ? (
            <img
              src={`${PAYLOAD_URL}${exhibition.cover_image.url!}`}
              alt={exhibition.cover_image.alt || exhibition.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-neutral-400" />
            </div>
          )}
        </div>

        {/* Exhibition Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-neutral-900 mb-1 group-hover:text-blue-600 transition-colors truncate">
            {exhibition.title}
          </h4>
          
          {exhibition.description && (
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {exhibition.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            {exhibition.start_date && exhibition.end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}
                </span>
              </div>
            )}
            
            {exhibition.exhibitionStatus && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                exhibition.exhibitionStatus === 'open' 
                  ? 'bg-green-100 text-green-700'
                  : exhibition.exhibitionStatus === 'jury_review'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-neutral-100 text-neutral-700'
              }`}>
                {exhibition.exhibitionStatus.replace(/_/g, ' ').toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Arrow Icon */}
        {onView && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 transition-colors">
              <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        )}
      </div>
    </button>
  )
}