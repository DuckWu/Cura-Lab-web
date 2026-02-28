// src/views/ArtistDashboard.tsx
import { useState, useEffect } from 'react'
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  Palette,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  ExternalLink,
  XCircle,
  DollarSign
} from 'lucide-react'
import type { User, Submission, Artwork, Exhibition, Media } from '../../../payload-project/src/payload-types'

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

type ArtistDashboardProps = {
  currentUser: User | null
  onNewSubmission: () => void
  onViewExhibition?: (id: number) => void
  onViewArtwork?: (id: number) => void
  onBrowseExhibitions?: () => void
  onCreateArtwork?: () => void
}

export default function ArtistDashboard({
  currentUser,
  onViewExhibition,
  onViewArtwork,
  onBrowseExhibitions,
  onCreateArtwork
}: ArtistDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'submissions' | 'artworks'>('submissions')

  const [stats, setStats] = useState({
    totalSubmissions: 0,
    accepted: 0,
    underReview: 0,
    totalArtworks: 0,
  })

  const fetchData = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError(null)

      const submissionsResponse = await fetch(
        `${PAYLOAD_URL}/api/submissions?depth=2&where[artist][equals]=${currentUser.id}&sort=-createdAt`,
        { credentials: 'include' }
      )

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        if (Array.isArray(submissionsData.docs)) {
          setSubmissions(submissionsData.docs)

          const accepted = submissionsData.docs.filter((s: Submission) =>
            s.juryStatus === 'accepted' || s.galleryStatus === 'selected'
          ).length

          const underReview = submissionsData.docs.filter((s: Submission) =>
            s.juryStatus === 'pending' && s.galleryStatus === 'pending'
          ).length

          setStats(prev => ({
            ...prev,
            totalSubmissions: submissionsData.docs.length,
            accepted,
            underReview,
          }))
        }
      }

      const artworksResponse = await fetch(
        `${PAYLOAD_URL}/api/artworks?depth=1&where[owner][equals]=${currentUser.id}&sort=-createdAt`,
        { credentials: 'include' }
      )

      if (artworksResponse.ok) {
        const artworksData = await artworksResponse.json()
        if (Array.isArray(artworksData.docs)) {
          setArtworks(artworksData.docs)
          setStats(prev => ({ ...prev, totalArtworks: artworksData.docs.length }))
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [currentUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-lg text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 tracking-tight">
                Artist Dashboard
              </h1>
              <p className="text-lg text-neutral-600">
                Welcome back, {currentUser?.name || currentUser?.email || 'Artist'}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={onCreateArtwork}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Artwork
              </button>
              <button
                onClick={onBrowseExhibitions}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-all shadow-lg"
              >
                <ExternalLink className="w-5 h-5" />
                Browse Exhibitions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Submissions" value={stats.totalSubmissions} color="blue" />
          <StatCard icon={CheckCircle} label="Accepted" value={stats.accepted} color="green" />
          <StatCard icon={Clock} label="Under Review" value={stats.underReview} color="orange" />
          <StatCard icon={Palette} label="Artworks" value={stats.totalArtworks} color="purple" />
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <div className="border-b border-neutral-200 mb-8">
          <div className="flex gap-8">
            {(['submissions', 'artworks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-neutral-900 border-neutral-900'
                    : 'text-neutral-500 border-transparent hover:text-neutral-900'
                }`}
              >
                {tab === 'submissions' ? `Submissions (${stats.totalSubmissions})` : `Artworks (${stats.totalArtworks})`}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'submissions' ? (
          <SubmissionsCards
            submissions={submissions}
            onViewExhibition={onViewExhibition}
            onBrowseExhibitions={onBrowseExhibitions}
          />
        ) : (
          <ArtworksGrid
            artworks={artworks}
            onViewArtwork={onViewArtwork}
            onCreateArtwork={onCreateArtwork}
          />
        )}
      </div>
    </div>
  )
}

// --- Stat Card ---

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: 'blue' | 'green' | 'orange' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-lg transition-shadow">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xs text-neutral-500 mb-0.5">{label}</div>
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
    </div>
  )
}

// --- Submissions Cards (NEW) ---

function SubmissionsCards({ submissions, onViewExhibition, onBrowseExhibitions }: {
  submissions: Submission[]
  onViewExhibition?: (id: number) => void
  onBrowseExhibitions?: () => void
}) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Submissions Yet</h3>
        <p className="text-neutral-600 mb-6">Browse exhibitions and submit your artworks to see them here.</p>
        <button onClick={onBrowseExhibitions} className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all">
          Browse Exhibitions
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {submissions.map((submission, index) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          index={index + 1}
          onViewExhibition={onViewExhibition}
        />
      ))}
    </div>
  )
}

// --- Single Submission Card ---

function SubmissionCard({ submission, index, onViewExhibition }: {
  submission: Submission
  index: number
  onViewExhibition?: (id: number) => void
}) {
  const artwork = typeof submission.artwork === 'object' ? submission.artwork as Artwork : null
  const exhibition = typeof submission.exhibition === 'object' ? submission.exhibition as Exhibition : null

  // Compute final status: gallery overrides jury
  const getFinalStatus = () => {
    if (submission.galleryStatus === 'not_selected') {
      return { label: 'Rejected', icon: XCircle, color: 'bg-red-500 text-white' }
    }
    if (submission.galleryStatus === 'selected') {
      return { label: 'Selected', icon: CheckCircle, color: 'bg-green-500 text-white' }
    }
    if (submission.juryStatus === 'accepted') {
      return { label: 'Jury Accepted', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' }
    }
    if (submission.juryStatus === 'rejected') {
      return { label: 'Jury Rejected', icon: XCircle, color: 'bg-red-100 text-red-700' }
    }
    return { label: 'Under Review', icon: Clock, color: 'bg-yellow-100 text-yellow-700' }
  }

  const getPaymentBadge = () => {
    if (submission.paymentStatus === 'paid') return { label: 'Paid', color: 'text-green-600 bg-green-50' }
    if (submission.paymentStatus === 'waived') return { label: 'Waived', color: 'text-blue-600 bg-blue-50' }
    return { label: 'Unpaid', color: 'text-neutral-500 bg-neutral-100' }
  }

  const status = getFinalStatus()
  const payment = getPaymentBadge()
  const StatusIcon = status.icon

  const handleClick = () => {
    if (exhibition && onViewExhibition) {
      onViewExhibition(exhibition.id)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!exhibition || !onViewExhibition}
      className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all text-left w-full disabled:cursor-default"
    >
      {/* Artwork Image */}
      <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden">
        {artwork && isMedia(artwork.image) ? (
          <img
            src={`${PAYLOAD_URL}${artwork.image.url!}`}
            alt={artwork.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-neutral-300" />
          </div>
        )}

        {/* Index badge */}
        <div className="absolute top-3 left-3 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">{index}</span>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Artwork Title */}
        <h3 className="font-bold text-neutral-900 text-sm mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {artwork?.title || 'Untitled'}
        </h3>

        {/* Exhibition Name */}
        {exhibition && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-3">
            <ExternalLink className="w-3 h-3" />
            <span className="line-clamp-1">{exhibition.title}</span>
          </div>
        )}

        {/* Bottom Row: Payment + Price + Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${payment.color}`}>
              {payment.label}
            </span>
            {artwork?.price && (
              <span className="flex items-center gap-0.5 text-xs text-neutral-500">
                <DollarSign className="w-3 h-3" />
                {artwork.price.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400">
            {formatDate(submission.submittedAt)}
          </span>
        </div>
      </div>
    </button>
  )
}

// --- Artworks Grid ---

function ArtworksGrid({ artworks, onViewArtwork, onCreateArtwork }: {
  artworks: Artwork[]
  onViewArtwork?: (id: number) => void
  onCreateArtwork?: () => void
}) {
  if (artworks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Artworks Yet</h3>
        <p className="text-neutral-600 mb-6">Create your first artwork to start building your portfolio.</p>
        <button onClick={onCreateArtwork} className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all">
          Create Artwork
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {artworks.map((artwork) => (
        <button
          key={artwork.id}
          onClick={() => onViewArtwork && onViewArtwork(artwork.id)}
          className="group bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all text-left"
        >
          <div className="aspect-square bg-neutral-100 relative overflow-hidden">
            {isMedia(artwork.image) ? (
              <img
                src={`${PAYLOAD_URL}${artwork.image.url!}`}
                alt={artwork.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-neutral-300" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
                artwork.sale_status === 'for_sale' ? 'bg-green-500 text-white' :
                artwork.sale_status === 'sold' ? 'bg-blue-500 text-white' :
                artwork.sale_status === 'pending' ? 'bg-yellow-500 text-white' :
                'bg-neutral-500/80 text-white'
              }`}>
                {artwork.sale_status?.replace('_', ' ').toUpperCase() || 'NFS'}
              </span>
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-neutral-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
              {artwork.title}
            </h3>
            {artwork.price && (
              <p className="text-xs text-neutral-500 mt-0.5">${artwork.price.toLocaleString()}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}