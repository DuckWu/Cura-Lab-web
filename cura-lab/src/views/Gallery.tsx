// src/views/Gallery.tsx

import { useState, useEffect } from 'react'
import { MapPin, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import type { Gallery, Media } from '../../../payload-project/src/payload-types'

// 辅助函数
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-lg text-neutral-600">Loading galleries...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Oops!</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Header Section */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4 tracking-tight">
              Discover Galleries
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Explore curated spaces showcasing exceptional contemporary art from around the world
            </p>
          </div>
          
          {/* Gallery Count */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full">
            <span className="text-sm font-semibold text-neutral-900">
              {galleries.length}
            </span>
            <span className="text-sm text-neutral-600">
              {galleries.length === 1 ? 'Gallery' : 'Galleries'}
            </span>
          </div>
        </div>
      </div>

      {/* Galleries Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {galleries.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-100 rounded-full mb-6">
              <MapPin className="w-10 h-10 text-neutral-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">
              No Galleries Found
            </h2>
            <p className="text-neutral-600 max-w-md mx-auto">
              There are no published galleries at the moment. Check back soon for updates!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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

/**
 * Gallery Card Component
 */
interface GalleryCardProps {
  gallery: Gallery
  onViewDetail: (id: number) => void
}

function GalleryCard({ gallery, onViewDetail }: GalleryCardProps) {
  return (
    <button
      onClick={() => onViewDetail(gallery.id)}
      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-left w-full"
    >
      {/* Logo/Image */}
      <div className="aspect-[16/10] bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
        {isMedia(gallery.logo) ? (
          <>
            <img
              src={`${PAYLOAD_URL}${gallery.logo.url!}`}
              alt={gallery.logo.alt || gallery.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-16 h-16 text-neutral-400" />
          </div>
        )}
        
        {/* Hover "View" Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="px-6 py-3 bg-white text-neutral-900 font-semibold rounded-full flex items-center gap-2 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <span>View Gallery</span>
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Gallery Name */}
        <h3 className="text-xl font-bold text-neutral-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
          {gallery.name}
        </h3>

        {/* Location */}
        {gallery.location && (
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{gallery.location}</span>
          </div>
        )}

        {/* Bio */}
        {gallery.bio && (
          <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
            {gallery.bio}
          </p>
        )}

        {/* Contact Info (if available) */}
        {(gallery.email || gallery.phone || gallery.website) && (
          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
            {gallery.email && (
              <div className="text-xs text-neutral-500 flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span className="truncate">{gallery.email}</span>
              </div>
            )}
            {gallery.website && (
              <div className="text-xs text-neutral-500 flex items-center gap-2">
                <span className="font-medium">Website:</span>
                <span className="truncate text-blue-600">{gallery.website}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  )
}