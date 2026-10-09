// src/views/Exhibitions.tsx
import { useState, useEffect } from 'react'
import {
  Calendar,
  MapPin,
  Search,
  Loader2,
  ArrowRight,
  ArrowUpRight
} from 'lucide-react'
import type { Exhibition, Media, Gallery } from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getDaysRemaining = (deadline: string | null | undefined) => {
  if (!deadline) return null
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open Call',
  jury_review: 'Jury Review',
  finalized: 'Finalized',
  on_display: 'On Display',
  closed: 'Closed',
  completed: 'Completed',
}

type ExhibitionsProps = {
  onViewDetail: (id: number) => void
}

export default function Exhibitions({ onViewDetail }: ExhibitionsProps) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchExhibitions() {
      try {
        setLoading(true)
        setError(null)

        const apiUrl = `${PAYLOAD_URL}/api/exhibitions?depth=1&where[status][equals]=published&sort=-createdAt`
        const response = await fetch(apiUrl)

        if (!response.ok) throw new Error('Failed to fetch exhibitions')

        const data = await response.json()

        if (Array.isArray(data.docs)) {
          setExhibitions(data.docs)
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchExhibitions()
  }, [])

  const filteredExhibitions = exhibitions.filter((exhibition) => {
    const matchesSearch =
      exhibition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exhibition.description && exhibition.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus =
      statusFilter === 'all' ||
      exhibition.exhibitionStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-ink animate-spin mx-auto mb-4" />
          <p className="eyebrow">Loading exhibitions</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center py-20">
          <p className="eyebrow mb-4">Something went wrong</p>
          <h2 className="display text-3xl mb-4">Couldn&apos;t load exhibitions</h2>
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
          <p className="eyebrow mb-5">Open Calls</p>
          <h1 className="display text-5xl sm:text-6xl lg:text-7xl mb-6">
            Exhibitions
          </h1>
          <p className="text-lg text-stone font-light max-w-xl leading-relaxed">
            Discover opportunities to showcase your work in galleries worldwide.
          </p>

          {/* Search + filter */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 max-w-3xl">
            <div className="flex-1 relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
              <input
                type="text"
                placeholder="Search exhibitions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent pl-7 pr-4 py-3 border-b border-fog focus:border-ink outline-none transition-colors text-[15px] placeholder:text-stone/60"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-transparent pl-1 pr-8 py-3 border-b border-fog focus:border-ink outline-none transition-colors cursor-pointer text-[13px] tracking-[0.08em] uppercase text-ink font-medium"
              >
                <option value="all">All Status</option>
                <option value="open">Open for Submissions</option>
                <option value="jury_review">In Jury Review</option>
                <option value="finalized">Finalized</option>
                <option value="on_display">On Display</option>
                <option value="completed">Completed</option>
              </select>
              <ArrowRight className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none rotate-90" />
            </div>
          </div>

          <div className="mt-8 text-[13px] text-stone tracking-wide">
            <span className="text-ink font-medium">{filteredExhibitions.length}</span>
            {' '}of <span className="text-ink font-medium">{exhibitions.length}</span> exhibitions
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-16">
        <ExhibitionCards exhibitions={filteredExhibitions} onViewDetail={onViewDetail} />
      </div>
    </div>
  )
}

type ExhibitionCardsProps = {
  exhibitions: Exhibition[]
  onViewDetail: (id: number) => void
}

function ExhibitionCards({ exhibitions, onViewDetail }: ExhibitionCardsProps) {
  if (exhibitions.length === 0) {
    return (
      <div className="text-center py-28 border border-dashed border-fog">
        <p className="font-display italic text-2xl text-stone mb-3">No exhibitions found.</p>
        <p className="text-sm text-stone/70">Try adjusting your search or filters.</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-px bg-fog border border-fog ${
      exhibitions.length === 1 ? 'grid-cols-1 max-w-2xl' :
      exhibitions.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }`}>
      {exhibitions.map(exhibition => (
        <ExhibitionCard key={exhibition.id} exhibition={exhibition} onViewDetail={onViewDetail} />
      ))}
    </div>
  )
}

type ExhibitionCardProps = {
  exhibition: Exhibition
  onViewDetail: (id: number) => void
}

function ExhibitionCard({ exhibition, onViewDetail }: ExhibitionCardProps) {
  const daysRemaining = getDaysRemaining(exhibition.submission_deadline)
  const status = exhibition.exhibitionStatus || 'draft'
  const isOpen = status === 'open' && (daysRemaining === null || daysRemaining > 0)
  const isClosingSoon = isOpen && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0

  return (
    <button
      onClick={() => onViewDetail(exhibition.id)}
      className="group bg-paper text-left hover:bg-white transition-colors duration-500"
    >
      <div className="aspect-[4/3] bg-fog overflow-hidden relative">
        {isMedia(exhibition.cover_image) ? (
          <img
            src={`${PAYLOAD_URL}${exhibition.cover_image.url!}`}
            alt={exhibition.cover_image.alt || exhibition.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-stone/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500" />

        <div className="absolute top-5 left-5 flex flex-col items-start gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] tracking-[0.14em] uppercase font-medium ${
            isOpen ? 'bg-ink text-paper' : 'bg-paper/90 text-ink backdrop-blur-sm'
          }`}>
            {isOpen && <span className="w-1 h-1 bg-paper rounded-full animate-pulse" />}
            {STATUS_LABEL[status] || status}
          </span>
          {isClosingSoon && (
            <span className="inline-flex items-center px-3 py-1 text-[10px] tracking-[0.14em] uppercase font-medium bg-paper text-ink">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
            </span>
          )}
        </div>

        <div className="absolute top-5 right-5 w-9 h-9 rounded-full bg-paper/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
          <ArrowUpRight className="w-4 h-4 text-ink" />
        </div>
      </div>

      <div className="p-7 lg:p-8">
        {typeof exhibition.gallery === 'object' && exhibition.gallery && (
          <div className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-stone mb-3">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{(exhibition.gallery as Gallery).name}</span>
          </div>
        )}
        <h3 className="display text-[26px] leading-tight mb-2.5 group-hover:opacity-60 transition-opacity duration-300 line-clamp-2">
          {exhibition.title}
        </h3>
        <p className="text-sm text-stone line-clamp-2 mb-6 leading-relaxed">
          {exhibition.description || ''}
        </p>
        <div className="flex items-center justify-between pt-5 border-t border-fog text-[13px]">
          <span className="text-stone">{formatDate(exhibition.submission_deadline)}</span>
          <span className="text-ink font-medium">
            {exhibition.submission_fee ? `$${exhibition.submission_fee}` : 'Free'}
          </span>
        </div>
      </div>
    </button>
  )
}
