// src/views/JurorReview.tsx
import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import {
  ChevronLeft,
  X,
  Check,
  Loader2,
  AlertCircle,
  Award,
  Calendar,
  User,
  Maximize2,
  Tag,
  Ruler,
  DollarSign,
  Package,
  Palette
} from 'lucide-react'
import type { 
  User as PayloadUser, 
  Submission, 
  Artwork, 
  Exhibition, 
  Media 
} from '../../../payload-project/src/payload-types'

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

type JurorReviewProps = {
  currentUser: PayloadUser | null
  exhibitionId?: number
}

export default function JurorReview({ currentUser, exhibitionId }: JurorReviewProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
  })

  useEffect(() => {
    async function fetchSubmissions() {
      if (!currentUser) return

      try {
        setLoading(true)
        setError(null)

        let url = `${PAYLOAD_URL}/api/submissions?depth=2&where[juryStatus][equals]=pending`
        
        if (exhibitionId) {
          url += `&where[exhibition][equals]=${exhibitionId}`
        } else {
          url += `&where[exhibition.jurors][contains]=${currentUser.id}`
        }

        const response = await fetch(url, { credentials: 'include' })
        
        if (!response.ok) throw new Error('Failed to fetch submissions')
        
        const data = await response.json()
        
        if (Array.isArray(data.docs)) {
          setSubmissions(data.docs)
          setStats({
            total: data.docs.length,
            reviewed: 0,
            accepted: 0,
            rejected: 0,
          })
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [currentUser, exhibitionId])

  const handleReview = async (decision: 'accepted' | 'rejected') => {
    const currentSubmission = submissions[currentIndex]
    if (!currentSubmission || reviewing) return

    setReviewing(true)

    try {
      const response = await fetch(
        `${PAYLOAD_URL}/api/submissions/${currentSubmission.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            juryStatus: decision,
            reviewedAt: new Date().toISOString(),
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to update submission')

      setStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        accepted: decision === 'accepted' ? prev.accepted + 1 : prev.accepted,
        rejected: decision === 'rejected' ? prev.rejected + 1 : prev.rejected,
      }))

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setReviewing(false)
      }, 300)
    } catch (err: any) {
      console.error(err)
      alert('Failed to submit review: ' + err.message)
      setReviewing(false)
    }
  }

  const handleUndo = () => {
    if (currentIndex > 0 && !reviewing) {
      setCurrentIndex((prev) => prev - 1)
      setStats((prev) => {
        const prevSubmission = submissions[currentIndex - 1]
        const wasAccepted = prevSubmission.juryStatus === 'accepted'
        
        return {
          ...prev,
          reviewed: prev.reviewed - 1,
          accepted: wasAccepted ? prev.accepted - 1 : prev.accepted,
          rejected: !wasAccepted ? prev.rejected - 1 : prev.rejected,
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-neutral-200">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
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

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-neutral-200">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">All Done!</h2>
          <p className="text-gray-600">
            You've reviewed all pending submissions. Great work!
          </p>
        </div>
      </div>
    )
  }

  if (currentIndex >= submissions.length) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-neutral-200">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Review Complete!
          </h2>
          <div className="space-y-2 text-left bg-neutral-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Reviewed:</span>
              <span className="font-semibold text-neutral-900">{stats.reviewed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Accepted:</span>
              <span className="font-semibold text-green-600">{stats.accepted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rejected:</span>
              <span className="font-semibold text-red-600">{stats.rejected}</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all"
          >
            Review More
          </button>
        </div>
      </div>
    )
  }

  const currentSubmission = submissions[currentIndex]
  const progress = ((stats.reviewed / stats.total) * 100).toFixed(0)

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header with Progress */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Jury Review</h1>
              <p className="text-sm text-gray-600">
                Reviewing submission {stats.reviewed + 1} of {stats.total}
              </p>
            </div>
            <button
              onClick={handleUndo}
              disabled={currentIndex === 0 || reviewing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo last review"
            >
              <ChevronLeft className="w-4 h-4" />
              Undo
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Main Content - 🆕 改进布局：图片 + 详细信息并排 */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Left: Artwork Image */}
          <div>
            <SwipeCard
              submission={currentSubmission}
              onAccept={() => handleReview('accepted')}
              onReject={() => handleReview('rejected')}
              disabled={reviewing}
            />
          </div>

          {/* Right: Artwork Details - 🆕 默认显示，更详细 */}
          <div className="space-y-6">
            <ArtworkDetailPanel submission={currentSubmission} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8">
          <motion.button
            onClick={() => handleReview('rejected')}
            disabled={reviewing}
            className="group relative w-24 h-24 bg-white rounded-full shadow-xl border-4 border-red-500 hover:bg-red-50 hover:shadow-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-10 h-10 text-red-600 mx-auto" />
            <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm font-bold text-neutral-700 whitespace-nowrap">
              Reject
            </span>
          </motion.button>

          <motion.button
            onClick={() => handleReview('accepted')}
            disabled={reviewing}
            className="group relative w-28 h-28 bg-green-600 rounded-full shadow-2xl hover:bg-green-700 hover:shadow-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Check className="w-12 h-12 text-white mx-auto" />
            <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm font-bold text-neutral-700 whitespace-nowrap">
              Accept
            </span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="mt-20 flex items-center justify-center gap-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm font-medium text-gray-600">Accepted</div>
          </div>
          <div className="w-px h-16 bg-neutral-200"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm font-medium text-gray-600">Rejected</div>
          </div>
          <div className="w-px h-16 bg-neutral-200"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-900">{stats.total - stats.reviewed}</div>
            <div className="text-sm font-medium text-gray-600">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 🆕 Artwork Detail Panel - 完整的作品信息
 */
interface ArtworkDetailPanelProps {
  submission: Submission
}

function ArtworkDetailPanel({ submission }: ArtworkDetailPanelProps) {
  const artwork = typeof submission.artwork === 'object' ? submission.artwork as Artwork : null
  const exhibition = typeof submission.exhibition === 'object' ? submission.exhibition as Exhibition : null
  const artist = typeof submission.artist === 'object' ? submission.artist as PayloadUser : null

  const dimensionsDisplay = artwork?.dimensionsDisplay || 
    (artwork?.dimensions && typeof artwork.dimensions === 'object'
      ? `${artwork.dimensions.width} × ${artwork.dimensions.height}${artwork.dimensions.depth ? ` × ${artwork.dimensions.depth}` : ''} ${artwork.dimensions.unit}`
      : null)

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 mb-1">
          {artwork?.title || 'Untitled'}
        </h2>
        {artwork?.year && (
          <p className="text-lg text-neutral-600">{artwork.year}</p>
        )}
      </div>

      {/* Artist Info */}
      {artist && (
        <div className="pb-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Artist</div>
              <div className="font-semibold text-neutral-900">
                {artist.name || artist.email}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exhibition Info */}
      {exhibition && (
        <div className="pb-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Exhibition</div>
              <div className="font-semibold text-neutral-900">
                {exhibition.title}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {artwork?.description && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-3">
            Description
          </h3>
          <p className="text-neutral-700 leading-relaxed">
            {artwork.description}
          </p>
        </div>
      )}

      {/* Technical Details */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-4">
          Technical Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {artwork?.category && (
            <DetailItem
              icon={Tag}
              label="Category"
              value={artwork.category.replace('_', ' ').toUpperCase()}
            />
          )}
          {artwork?.medium && (
            <DetailItem
              icon={Palette}
              label="Medium"
              value={artwork.medium}
            />
          )}
          {dimensionsDisplay && (
            <DetailItem
              icon={Ruler}
              label="Dimensions"
              value={dimensionsDisplay}
            />
          )}
          {artwork?.edition && (
            <DetailItem
              icon={Package}
              label="Edition"
              value={artwork.edition}
            />
          )}
          {artwork?.price && (
            <DetailItem
              icon={DollarSign}
              label="Price"
              value={`$${artwork.price}`}
            />
          )}
        </div>
      </div>

      {/* Materials (if exists) */}
      {artwork?.materials && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-3">
            Materials
          </h3>
          <p className="text-neutral-700 leading-relaxed">
            {artwork.materials}
          </p>
        </div>
      )}

      {/* Submission Date */}
      <div className="pt-6 border-t border-neutral-200">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Calendar className="w-4 h-4" />
          <span>Submitted on {formatDate(submission.submittedAt)}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Detail Item Component
 */
interface DetailItemProps {
  icon: any
  label: string
  value: string | number
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="bg-neutral-50 rounded-lg p-3">
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
        <Icon className="w-3 h-3" />
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  )
}

/**
 * Swipe Card Component - 🔧 简化版，只显示图片
 */
interface SwipeCardProps {
  submission: Submission
  onAccept: () => void
  onReject: () => void
  disabled: boolean
}

function SwipeCard({ submission, onAccept, onReject, disabled }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-5, 5])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  const artwork = typeof submission.artwork === 'object' ? submission.artwork as Artwork : null

  const handleDragEnd = (_event: any, info: PanInfo) => {
    if (disabled) return

    const threshold = 100
    if (info.offset.x > threshold) {
      onAccept()
    } else if (info.offset.x < -threshold) {
      onReject()
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, opacity }}
      className="relative bg-white rounded-3xl overflow-hidden border-2 border-neutral-200 shadow-2xl cursor-grab active:cursor-grabbing"
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Accept/Reject Indicators */}
      <motion.div
        className="absolute top-8 left-8 z-10 px-6 py-3 bg-green-600 text-white font-bold text-2xl rounded-2xl rotate-[-15deg] border-4 border-white shadow-2xl"
        style={{
          opacity: useTransform(x, [0, 100], [0, 1]),
        }}
      >
        ACCEPT ✓
      </motion.div>

      <motion.div
        className="absolute top-8 right-8 z-10 px-6 py-3 bg-red-600 text-white font-bold text-2xl rounded-2xl rotate-[15deg] border-4 border-white shadow-2xl"
        style={{
          opacity: useTransform(x, [-100, 0], [1, 0]),
        }}
      >
        REJECT ✗
      </motion.div>

      {/* Artwork Image - 保持 A3 比例 */}
      <div className="relative aspect-[1/1.414] bg-neutral-50">
        {artwork && isMedia(artwork.image) ? (
          <img
            src={`${PAYLOAD_URL}${artwork.image.url!}`}
            alt={artwork.title}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Maximize2 className="w-16 h-16 mx-auto mb-4" />
              <p>No Image Available</p>
            </div>
          </div>
        )}

        {/* 🆕 图片底部显示作品标题 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <h3 className="text-white font-bold text-xl">
            {artwork?.title || 'Untitled'}
          </h3>
        </div>
      </div>
    </motion.div>
  )
}