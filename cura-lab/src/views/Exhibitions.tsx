// src/views/Exhibitions.tsx
import { useState, useEffect } from 'react'
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Search, 
  Filter,
  Loader2,
  AlertCircle,
  ArrowRight,
  Clock
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

// 计算剩余天数
const getDaysRemaining = (deadline: string | null | undefined) => {
  if (!deadline) return null
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
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

  // 过滤展览
  const filteredExhibitions = exhibitions.filter((exhibition) => {
    // 搜索过滤
    const matchesSearch = 
      exhibition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exhibition.description && exhibition.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // 状态过滤
    const matchesStatus = 
      statusFilter === 'all' || 
      exhibition.exhibitionStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-lg text-neutral-600">Loading exhibitions...</p>
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
              Open Calls & Exhibitions
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Discover opportunities to showcase your work in galleries worldwide
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search exhibitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-12 pr-10 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all cursor-pointer bg-white min-w-[200px]"
              >
                <option value="all">All Status</option>
                <option value="open">Open for Submissions</option>
                <option value="jury_review">In Jury Review</option>
                <option value="finalized">Finalized</option>
                <option value="on_display">On Display</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6 text-sm text-neutral-600">
            Showing <span className="font-semibold text-neutral-900">{filteredExhibitions.length}</span> of{' '}
            <span className="font-semibold text-neutral-900">{exhibitions.length}</span> exhibitions
          </div>
        </div>
      </div>

      {/* Exhibitions Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <ExhibitionCards 
          exhibitions={filteredExhibitions} 
          onViewDetail={onViewDetail} 
        />
      </div>
    </div>
  )
}

/**
 * Exhibition Cards Component
 */
type ExhibitionCardsProps = {
  exhibitions: Exhibition[]
  onViewDetail: (id: number) => void
}

function ExhibitionCards({ exhibitions, onViewDetail }: ExhibitionCardsProps) {
  if (exhibitions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-100 rounded-full mb-6">
          <Calendar className="w-10 h-10 text-neutral-400" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">
          No Exhibitions Found
        </h2>
        <p className="text-neutral-600 max-w-md mx-auto">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {exhibitions.map((exhibition) => (
        <ExhibitionCard
          key={exhibition.id}
          exhibition={exhibition}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  )
}

/**
 * Single Exhibition Card
 */
interface ExhibitionCardProps {
  exhibition: Exhibition
  onViewDetail: (id: number) => void
}

function ExhibitionCard({ exhibition, onViewDetail }: ExhibitionCardProps) {
  const daysRemaining = getDaysRemaining(exhibition.submission_deadline)
  const isClosingSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0
  const isClosed = daysRemaining !== null && daysRemaining <= 0

  return (
    <button
      onClick={() => onViewDetail(exhibition.id)}
      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-left w-full"
    >
      {/* Cover Image */}
      <div className="aspect-[16/9] bg-gradient-to-br from-neutral-100 to-neutral-200 relative overflow-hidden">
        {isMedia(exhibition.cover_image) ? (
          <>
            <img
              src={`${PAYLOAD_URL}${exhibition.cover_image.url!}`}
              alt={exhibition.cover_image.alt || exhibition.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-neutral-400" />
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Exhibition Status */}
          {exhibition.exhibitionStatus === 'open' && !isClosed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              Open Call
            </span>
          )}
          
          {isClosingSoon && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-400 to-red-500 rounded-full shadow-lg">
              <Clock className="w-3 h-3" />
              Closing Soon
            </span>
          )}

          {isClosed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-600 rounded-full shadow-lg">
              Closed
            </span>
          )}
        </div>

        {/* Hover "View" Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="px-8 py-3 bg-white text-neutral-900 font-semibold rounded-full flex items-center gap-2 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <span>View Details</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Gallery Name */}
        {typeof exhibition.gallery === 'object' && exhibition.gallery && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
            <MapPin className="w-3 h-3" />
            <span>{(exhibition.gallery as Gallery).name}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-neutral-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2">
          {exhibition.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
          {exhibition.description || 'No description available'}
        </p>

        {/* Deadline & Days Remaining */}
        <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-neutral-500">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">{formatDate(exhibition.submission_deadline)}</span>
          </div>
          {daysRemaining !== null && daysRemaining > 0 && (
            <span className={`text-xs font-medium ${isClosingSoon ? 'text-orange-600' : 'text-neutral-500'}`}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
            </span>
          )}
        </div>

        {/* Footer - Fee and Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-neutral-500" />
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500">Entry Fee</span>
              <span className="text-lg font-bold text-neutral-900">
                ${exhibition.submission_fee || 0}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 font-medium group-hover:text-blue-700 transition-colors text-sm">
            <span>Learn More</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </button>
  )
}