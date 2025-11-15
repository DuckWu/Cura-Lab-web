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
  RefreshCw
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
  onNewSubmission,
  onViewExhibition,
  onViewArtwork,
  onBrowseExhibitions,
  onCreateArtwork 
}: ArtistDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'submissions' | 'artworks'>('submissions')

  const [stats, setStats] = useState({
    totalSubmissions: 0,
    accepted: 0,
    underReview: 0,
    totalArtworks: 0,
  })

  // 🆕 统一的数据获取函数
  const fetchData = async (showRefreshing = false) => {
    if (!currentUser) return

    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Fetch submissions
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
            s.juryStatus === 'pending' || s.galleryStatus === 'pending'
          ).length

          setStats(prev => ({
            ...prev,
            totalSubmissions: submissionsData.docs.length,
            accepted,
            underReview,
          }))
        }
      }

      // Fetch artworks
      const artworksResponse = await fetch(
        `${PAYLOAD_URL}/api/artworks?depth=1&where[owner][equals]=${currentUser.id}&sort=-createdAt`,
        { credentials: 'include' }
      )
      
      if (artworksResponse.ok) {
        const artworksData = await artworksResponse.json()
        if (Array.isArray(artworksData.docs)) {
          setArtworks(artworksData.docs)
          setStats(prev => ({
            ...prev,
            totalArtworks: artworksData.docs.length,
          }))
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentUser])

  // 🆕 手动刷新函数
  const handleRefresh = () => {
    fetchData(true)
  }

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
      {/* Header - 🔧 改进按钮布局 */}
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
            
            {/* 🆕 改进的按钮组 */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Refresh 按钮 */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {/* 🆕 Create Artwork 按钮 */}
              <button
                onClick={onCreateArtwork}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Artwork
              </button>

              {/* New Submission 按钮 */}
              <button
                onClick={onNewSubmission}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Submission
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FileText}
            label="Total Submissions"
            value={stats.totalSubmissions}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Accepted"
            value={stats.accepted}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Under Review"
            value={stats.underReview}
            color="orange"
          />
          <StatCard
            icon={Palette}
            label="Total Artworks"
            value={stats.totalArtworks}
            color="purple"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-8">
          <div className="flex gap-8 overflow-x-auto">
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
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'submissions' ? (
          <SubmissionsTable
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

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: any
  label: string
  value: string | number
  color: 'blue' | 'green' | 'orange' | 'purple'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-sm text-neutral-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-neutral-900">{value}</div>
    </div>
  )
}

/**
 * Submissions Table Component
 */
interface SubmissionsTableProps {
  submissions: Submission[]
  onViewExhibition?: (id: number) => void
  onBrowseExhibitions?: () => void
}

function SubmissionsTable({ submissions, onViewExhibition, onBrowseExhibitions }: SubmissionsTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No Submissions Yet
        </h3>
        <p className="text-neutral-600 mb-6">
          Start submitting your artworks to exhibitions to see them here.
        </p>
        <button 
          onClick={onBrowseExhibitions}
          className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all"
        >
          Browse Exhibitions
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Artwork
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Exhibition
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Jury Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Gallery Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Payment
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {submissions.map((submission) => (
              <SubmissionRow
                key={submission.id}
                submission={submission}
                onViewExhibition={onViewExhibition}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Submission Row Component
 */
interface SubmissionRowProps {
  submission: Submission
  onViewExhibition?: (id: number) => void
}

function SubmissionRow({ submission, onViewExhibition }: SubmissionRowProps) {
  const artwork = typeof submission.artwork === 'object' ? submission.artwork as Artwork : null
  const exhibition = typeof submission.exhibition === 'object' ? submission.exhibition as Exhibition : null

  const getStatusBadge = (status: string, type: 'jury' | 'gallery' | 'payment') => {
    const configs = {
      jury: {
        pending: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
        accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
        rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
      },
      gallery: {
        pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
        selected: { label: 'Selected', color: 'bg-green-100 text-green-700' },
        not_selected: { label: 'Not Selected', color: 'bg-red-100 text-red-700' },
      },
      payment: {
        pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
        paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
        waived: { label: 'Waived', color: 'bg-blue-100 text-blue-700' },
      },
    }

    const config = configs[type][status as keyof typeof configs[typeof type]]
    if (!config) return null

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <tr className="hover:bg-neutral-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
            {artwork && isMedia(artwork.image) ? (
              <img
                src={`${PAYLOAD_URL}${artwork.image.url!}`}
                alt={artwork.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-neutral-400" />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-neutral-900 text-sm">
              {artwork?.title || 'Untitled'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {exhibition ? (
          <button
            onClick={() => onViewExhibition && onViewExhibition(exhibition.id)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
          >
            <span>{exhibition.title}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <span className="text-sm text-neutral-500">N/A</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-neutral-600">
          {formatDate(submission.submittedAt)}
        </div>
      </td>
      <td className="px-6 py-4">
        {getStatusBadge(submission.juryStatus || 'pending', 'jury')}
      </td>
      <td className="px-6 py-4">
        {getStatusBadge(submission.galleryStatus || 'pending', 'gallery')}
      </td>
      <td className="px-6 py-4">
        {getStatusBadge(submission.paymentStatus || 'pending', 'payment')}
      </td>
    </tr>
  )
}

/**
 * Artworks Grid Component
 */
interface ArtworksGridProps {
  artworks: Artwork[]
  onViewArtwork?: (id: number) => void
  onCreateArtwork?: () => void
}

function ArtworksGrid({ artworks, onViewArtwork, onCreateArtwork }: ArtworksGridProps) {
  if (artworks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No Artworks Yet
        </h3>
        <p className="text-neutral-600 mb-6">
          Create your first artwork to start building your portfolio.
        </p>
        <button 
          onClick={onCreateArtwork}
          className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all"
        >
          Create Artwork
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          onView={onViewArtwork}
        />
      ))}
    </div>
  )
}

/**
 * Artwork Card Component
 */
interface ArtworkCardProps {
  artwork: Artwork
  onView?: (id: number) => void
}

function ArtworkCard({ artwork, onView }: ArtworkCardProps) {
  return (
    <button
      onClick={() => onView && onView(artwork.id)}
      className="group bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all text-left"
    >
      <div className="aspect-square bg-neutral-200 relative overflow-hidden">
        {isMedia(artwork.image) ? (
          <img
            src={`${PAYLOAD_URL}${artwork.image.url!}`}
            alt={artwork.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-neutral-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-lg ${
            artwork.sale_status === 'for_sale'
              ? 'bg-green-500 text-white'
              : artwork.sale_status === 'sold'
              ? 'bg-blue-500 text-white'
              : artwork.sale_status === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-neutral-500 text-white'
          }`}>
            {artwork.sale_status?.replace('_', ' ').toUpperCase() || 'NOT FOR SALE'}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {artwork.title}
        </h3>
        {artwork.price && (
          <p className="text-sm font-medium text-neutral-600">
            ${artwork.price}
          </p>
        )}
      </div>
    </button>
  )
}