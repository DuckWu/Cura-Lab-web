// src/views/GalleryDashboard.tsx
import { useState, useEffect } from 'react'
import {
  Plus,
  Building,
  Calendar,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Edit,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle,
  UserPlus,
  Send,
  XCircle,
  Check
} from 'lucide-react'
import type { User, Gallery, Exhibition, Submission, Media } from '../../../payload-project/src/payload-types'

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

type GalleryDashboardProps = {
  currentUser: User | null
  onCreateExhibition: () => void
  onEditExhibition?: (id: number) => void
  onViewExhibition?: (id: number) => void
}

export default function GalleryDashboard({
  currentUser,
  onCreateExhibition,
  onEditExhibition,
  onViewExhibition
}: GalleryDashboardProps) {
  const [myGallery, setMyGallery] = useState<Gallery | null>(null)
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'exhibitions' | 'submissions'>('exhibitions')
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null)
  const [showJurorModal, setShowJurorModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [stats, setStats] = useState({
    totalExhibitions: 0,
    activeExhibitions: 0,
    totalSubmissions: 0,
    totalRevenue: 0,
  })

  const handleUpdateSubmission = (updated: Submission) => {
    setSubmissions(prev =>
      prev.map(s => (s.id === updated.id ? updated : s))
    )
  }

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return

      try {
        setLoading(true)
        setError(null)

        const galleryResponse = await fetch(
          `${PAYLOAD_URL}/api/galleries?depth=1&where[owner][equals]=${currentUser.id}`,
          { credentials: 'include' }
        )
        
        if (galleryResponse.ok) {
          const galleryData = await galleryResponse.json()
          if (galleryData.docs && galleryData.docs.length > 0) {
            setMyGallery(galleryData.docs[0])

            const exhibitionsResponse = await fetch(
              `${PAYLOAD_URL}/api/exhibitions?depth=2&where[gallery][equals]=${galleryData.docs[0].id}&sort=-createdAt`,
              { credentials: 'include' }
            )
            
            if (exhibitionsResponse.ok) {
              const exhibitionsData = await exhibitionsResponse.json()
              if (Array.isArray(exhibitionsData.docs)) {
                setExhibitions(exhibitionsData.docs)
                
                const active = exhibitionsData.docs.filter((e: Exhibition) => 
                  e.exhibitionStatus === 'open' || e.exhibitionStatus === 'jury_review'
                ).length

                let totalRevenue = 0
                exhibitionsData.docs.forEach((e: Exhibition) => {
                  totalRevenue += (e.totalRevenue || 0)
                })

                setStats({
                  totalExhibitions: exhibitionsData.docs.length,
                  activeExhibitions: active,
                  totalSubmissions: exhibitionsData.docs.reduce((acc: number, e: Exhibition) => 
                    acc + (e.totalSubmissions || 0), 0
                  ),
                  totalRevenue,
                })

                const exhibitionIds = exhibitionsData.docs.map((e: Exhibition) => e.id).join(',')
                if (exhibitionIds) {
                  const submissionsResponse = await fetch(
                    `${PAYLOAD_URL}/api/submissions?depth=3&where[exhibition][in]=${exhibitionIds}&sort=-createdAt`,
                    { credentials: 'include' }
                  )
                  
                  if (submissionsResponse.ok) {
                    const submissionsData = await submissionsResponse.json()
                    if (Array.isArray(submissionsData.docs)) {
                      setSubmissions(submissionsData.docs)
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
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
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Error Loading Dashboard</h2>
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

  if (!myGallery) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-neutral-200">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Create Your Gallery</h2>
          <p className="text-gray-600 mb-6">
            You need to create a gallery profile before managing exhibitions.
          </p>
          <button 
            onClick={() => window.location.href = `${PAYLOAD_URL}/admin/collections/galleries/create`}
            className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all"
          >
            Create Gallery
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isMedia(myGallery.logo) && (
                  <img
                    src={`${PAYLOAD_URL}${myGallery.logo.url!}`}
                    alt={myGallery.name}
                    className="w-12 h-12 rounded-xl object-cover border border-neutral-200"
                  />
                )}
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
                    {myGallery.name}
                  </h1>
                  <p className="text-gray-600">{myGallery.location}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onCreateExhibition}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              New Exhibition
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Calendar}
            label="Total Exhibitions"
            value={stats.totalExhibitions}
            color="primary"
          />
          <StatCard
            icon={TrendingUp}
            label="Active Exhibitions"
            value={stats.activeExhibitions}
            color="success"
          />
          <StatCard
            icon={FileText}
            label="Total Submissions"
            value={stats.totalSubmissions}
            color="accent"
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            color="primary"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-8">
          <div className="flex gap-8 overflow-x-auto">
            {(['exhibitions', 'submissions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-neutral-900 border-neutral-900'
                    : 'text-gray-500 border-transparent hover:text-neutral-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'exhibitions' ? (
          <ExhibitionsGrid
            exhibitions={exhibitions}
            onEdit={onEditExhibition}
            onView={onViewExhibition}
            onManageJurors={(exhibition) => {
              setSelectedExhibition(exhibition)
              setShowJurorModal(true)
            }}
          />
        ) : (
          <SubmissionsTable
            submissions={submissions}
            onAssignJurors={(submission) => {
              setSelectedSubmission(submission)
              setShowAssignModal(true)
            }}
            onUpdateSubmission={handleUpdateSubmission}
          />
        )}
      </div>

      {/* Juror Management Modal */}
      {showJurorModal && selectedExhibition && (
        <ManageJurorsModal
          exhibition={selectedExhibition}
          onClose={() => {
            setShowJurorModal(false)
            setSelectedExhibition(null)
          }}
          onSuccess={(jurorIds) => {
            setShowJurorModal(false)
            setSelectedExhibition(null)
            setExhibitions(prev =>
              prev.map(e =>
                e.id === selectedExhibition.id
                  ? { ...e, jurors: jurorIds as any }
                  : e
              )
            )
          }}
        />
      )}

      {showAssignModal && selectedSubmission && (
        <AssignJurorsModal
          submission={selectedSubmission}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedSubmission(null)
          }}
          onSuccess={(updated) => {
            setShowAssignModal(false)
            setSelectedSubmission(null)
            handleUpdateSubmission(updated)
          }}
        />
      )}
    </div>
  )
}

/**
 * Stat Card
 */
interface StatCardProps {
  icon: any
  label: string
  value: string | number
  color: 'primary' | 'success' | 'accent'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    accent: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-neutral-900">{value}</div>
    </div>
  )
}

/**
 * Exhibitions Grid
 */
interface ExhibitionsGridProps {
  exhibitions: Exhibition[]
  onEdit?: (id: number) => void
  onView?: (id: number) => void
  onManageJurors?: (exhibition: Exhibition) => void
}

function ExhibitionsGrid({ exhibitions, onEdit, onView, onManageJurors }: ExhibitionsGridProps) {
  if (exhibitions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No Exhibitions Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Create your first exhibition to start receiving artwork submissions.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {exhibitions.map((exhibition) => (
        <ExhibitionCard
          key={exhibition.id}
          exhibition={exhibition}
          onEdit={onEdit}
          onView={onView}
          onManageJurors={onManageJurors}
        />
      ))}
    </div>
  )
}

/**
 * Exhibition Card
 */
interface ExhibitionCardProps {
  exhibition: Exhibition
  onEdit?: (id: number) => void
  onView?: (id: number) => void
  onManageJurors?: (exhibition: Exhibition) => void
}

function ExhibitionCard({ exhibition, onEdit, onView, onManageJurors }: ExhibitionCardProps) {
  // 🔧 改用 max_selected
  const selectedCount = (exhibition as any).selectedCount || 0
  const maxSelected = (exhibition as any).max_selected || 50
  const isFull = selectedCount >= maxSelected
  const capacityPercentage = (selectedCount / maxSelected) * 100

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all">
      <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
        {isMedia(exhibition.cover_image) ? (
          <img
            src={`${PAYLOAD_URL}${exhibition.cover_image.url!}`}
            alt={exhibition.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            exhibition.exhibitionStatus === 'open'
              ? 'bg-green-500 text-white'
              : exhibition.exhibitionStatus === 'jury_review'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-500 text-white'
          }`}>
            {exhibition.exhibitionStatus?.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Juror Count Badge */}
        <div className="absolute top-3 right-3">
          <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-neutral-900 flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{exhibition.jurors ? (exhibition.jurors as any[]).length : 0} Jurors</span>
          </div>
        </div>

        {/* 🔧 容量显示 Badge - 改用 max_selected */}
        <div className="absolute bottom-3 right-3">
          <div className={`px-3 py-1 backdrop-blur-sm rounded-full text-xs font-semibold flex items-center gap-1 ${
            isFull 
              ? 'bg-red-500/90 text-white' 
              : capacityPercentage > 80 
              ? 'bg-yellow-500/90 text-white'
              : 'bg-white/90 text-neutral-900'
          }`}>
            <ImageIcon className="w-3 h-3" />
            <span>{selectedCount}/{maxSelected}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-1">
          {exhibition.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {exhibition.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{exhibition.totalSubmissions || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>${exhibition.totalRevenue || 0}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onView && onView(exhibition.id)}
            className="px-4 py-2 text-sm font-semibold text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onEdit && onEdit(exhibition.id)}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onManageJurors && onManageJurors(exhibition)}
            className="col-span-2 px-4 py-2 text-sm font-semibold text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manage Jurors</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Submissions Table
 */
interface SubmissionsTableProps {
  submissions: Submission[]
  onAssignJurors?: (submission: Submission) => void
  onUpdateSubmission?: (updated: Submission) => void
}

function SubmissionsTable({ 
  submissions, 
  onAssignJurors,
  onUpdateSubmission
}: SubmissionsTableProps) {
  const [updating, setUpdating] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

  // 🔧 检查展览容量 - 改用 max_selected
  const checkExhibitionCapacity = async (exhibitionId: number): Promise<{ 
    isFull: boolean; 
    current: number; 
    max: number;
    remaining: number;
  }> => {
    try {
      const res = await fetch(`${PAYLOAD_URL}/api/exhibitions/${exhibitionId}?depth=0`, {
        credentials: 'include'
      })
      
      if (res.ok) {
        const exhibition = await res.json()
        const selectedCount = exhibition.selectedCount || 0
        const maxSelected = exhibition.max_selected || 50
        
        return {
          isFull: selectedCount >= maxSelected,
          current: selectedCount,
          max: maxSelected,
          remaining: Math.max(maxSelected - selectedCount, 0)
        }
      }
    } catch (err) {
      console.error('Failed to check capacity:', err)
    }
    
    return { isFull: false, current: 0, max: 50, remaining: 50 }
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No Submissions Yet
        </h3>
        <p className="text-gray-600">
          Submissions will appear here once artists start submitting to your exhibitions.
        </p>
      </div>
    )
  }

  const handleGalleryDecision = async (
    submissionId: number,
    newStatus: 'selected' | 'not_selected',
    exhibitionId: number
  ) => {
    if (newStatus === 'selected') {
      const capacity = await checkExhibitionCapacity(exhibitionId)
      
      if (capacity.isFull) {
        setToast({
          message: `Exhibition is full! (${capacity.current}/${capacity.max} artworks already selected)`,
          type: 'warning'
        })
        setTimeout(() => setToast(null), 4000)
        return
      }

      if (capacity.remaining <= 3 && capacity.remaining > 0) {
        const proceed = window.confirm(
          `Only ${capacity.remaining} spot${capacity.remaining === 1 ? '' : 's'} remaining in this exhibition (${capacity.current}/${capacity.max}).\n\nDo you want to select this artwork?`
        )
        if (!proceed) return
      }
    }

    setUpdating(submissionId)

    try {
      const res = await fetch(`${PAYLOAD_URL}/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ galleryStatus: newStatus }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || 'Failed to update status')
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      const refreshRes = await fetch(
        `${PAYLOAD_URL}/api/submissions/${submissionId}?depth=3`,
        { credentials: 'include' }
      )

      if (refreshRes.ok) {
        const updated = await refreshRes.json()
        
        if (onUpdateSubmission) {
          onUpdateSubmission(updated as Submission)
        }
        const exhibitionRes = await fetch(
          `${PAYLOAD_URL}/api/exhibitions/${exhibitionId}?depth=0`,
          { credentials: 'include' }
        )
        if (exhibitionRes.ok) {
        const exhibitionData = await exhibitionRes.json()
        console.log('Updated exhibition:', exhibitionData) // 🔍 调试用
        
        if (newStatus === 'selected') {
          setToast({
            message: `✓ Artwork selected! (${exhibitionData.selectedCount || 0}/${exhibitionData.max_selected || 50} spots filled)`,
            type: 'success'
          })
        } else {
          setToast({
            message: `✓ Artwork deselected. (${(exhibitionData.max_selected || 50) - (exhibitionData.selectedCount || 0)} spots available)`,
            type: 'success'
          })
        }
      }
        setTimeout(() => setToast(null), 3000)
      } else {
        throw new Error('Failed to refresh submission data')
      }
    } catch (err: any) {
      console.error('Update gallery status error:', err)
      
      setToast({
        message: err.message || 'Failed to update gallery status',
        type: 'error'
      })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Artwork
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Artist
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Exhibition
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jury Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Gallery Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {submissions.map((submission) => {
                const artist = typeof submission.artist === 'object' ? submission.artist : null
                const artwork = typeof submission.artwork === 'object' ? submission.artwork : null
                const exhibitionData = typeof submission.exhibition === 'object' ? submission.exhibition : null
                const exhibitionId = exhibitionData?.id || 0

                // 🔧 改用 max_selected
                const selectedCount = (exhibitionData as any)?.selectedCount || 0
                const maxSelected = (exhibitionData as any)?.max_selected || 50
                const isFull = selectedCount >= maxSelected
                const isNearlyFull = selectedCount >= maxSelected * 0.8

                const assignedJurors = (((submission as any).assignedJurors) || []) as any[]
                const assignedNames = assignedJurors
                  .map((j: any) =>
                    typeof j === 'object'
                      ? (j.name || j.email || '')
                      : ''
                  )
                  .filter(Boolean)
                  .join(', ')

                const isUpdating = updating === submission.id

                return (
                  <tr key={submission.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-neutral-200 rounded-lg overflow-hidden">
                          {artwork && isMedia((artwork as any).image) && (
                            <img
                              src={`${PAYLOAD_URL}${(artwork as any).image.url!}`}
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium text-neutral-900">
                          {artwork?.title || 'Untitled'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {artist?.name || artist?.email || 'Unknown'}
                    </td>

                    {/* 🔧 Exhibition 列 - 改用 max_selected */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-900">
                          {exhibitionData?.title || 'N/A'}
                        </span>
                        <span className={`text-xs font-medium ${
                          isFull 
                            ? 'text-red-600' 
                            : isNearlyFull 
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                        }`}>
                          {selectedCount}/{maxSelected} selected
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(submission.submittedAt)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          submission.juryStatus === 'accepted'
                            ? 'bg-green-50 text-green-700'
                            : submission.juryStatus === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {submission.juryStatus?.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          submission.galleryStatus === 'selected'
                            ? 'bg-green-50 text-green-700'
                            : submission.galleryStatus === 'not_selected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {submission.galleryStatus?.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-gray-500">
                          {assignedJurors.length
                            ? `Assigned: ${assignedNames}`
                            : 'No juror assigned'}
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          {onAssignJurors && (
                            <button
                              onClick={() => onAssignJurors(submission)}
                              disabled={isUpdating}
                              className="px-2.5 py-1 text-xs font-semibold text-neutral-900 bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Users className="w-3 h-3" />
                              Assign
                            </button>
                          )}

                          {submission.juryStatus === 'accepted' && (
                            <>
                              {(submission.galleryStatus === 'pending' || submission.galleryStatus === 'not_selected') && (
                                <>
                                  <button
                                    onClick={() => handleGalleryDecision(submission.id, 'selected', exhibitionId)}
                                    disabled={isUpdating || isFull}
                                    className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative ${
                                      isFull
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-green-600 hover:bg-green-50'
                                    }`}
                                    title={
                                      isFull 
                                        ? `Exhibition full (${selectedCount}/${maxSelected})` 
                                        : isNearlyFull
                                        ? `Select (${maxSelected - selectedCount} spots left)`
                                        : "Select for exhibition"
                                    }
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </button>

                                  {submission.galleryStatus === 'pending' && (
                                    <button
                                      onClick={() => handleGalleryDecision(submission.id, 'not_selected', exhibitionId)}
                                      disabled={isUpdating}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                                      title="Do not select"
                                    >
                                      {isUpdating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </>
                              )}

                              {submission.galleryStatus === 'selected' && (
                                <button
                                  onClick={() => handleGalleryDecision(submission.id, 'not_selected', exhibitionId)}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Deselect
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* 🔧 容量警告 - 改用 max_selected */}
                        {submission.juryStatus === 'accepted' &&
                          (submission.galleryStatus === 'pending' || submission.galleryStatus === 'not_selected') &&
                          isFull && (
                            <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              Exhibition full ({selectedCount}/{maxSelected})
                            </div>
                          )}

                        {submission.juryStatus === 'accepted' &&
                          (submission.galleryStatus === 'pending' || submission.galleryStatus === 'not_selected') &&
                          !isFull &&
                          isNearlyFull && (
                            <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              {maxSelected - selectedCount} spots left
                            </div>
                          )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div className={`px-6 py-4 rounded-xl shadow-2xl border-2 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-900'
              : toast.type === 'warning'
              ? 'bg-yellow-50 border-yellow-500 text-yellow-900'
              : 'bg-red-50 border-red-500 text-red-900'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Manage Jurors Modal
 */
interface ManageJurorsModalProps {
  exhibition: Exhibition
  onClose: () => void
  onSuccess: (jurorIds: number[]) => void
}

function ManageJurorsModal({ exhibition, onClose, onSuccess }: ManageJurorsModalProps) {
  const [allJurors, setAllJurors] = useState<User[]>([])
  const [selectedJurors, setSelectedJurors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', name: '' })
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    async function fetchJurors() {
      try {
        const response = await fetch(
          `${PAYLOAD_URL}/api/users?where[appRole][equals]=juror`,
          { credentials: 'include' }
        )
        
        if (response.ok) {
          const data = await response.json()
          setAllJurors(data.docs || [])
          
          const currentJurors = new Set(
            (exhibition.jurors as any[] || []).map((j: any) => String(j.id || j))
          )
          setSelectedJurors(currentJurors)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchJurors()
  }, [exhibition])

  const handleInviteJuror = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)

    try {
      const response = await fetch(`${PAYLOAD_URL}/api/invite-juror`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: inviteForm.email,
          name: inviteForm.name,
          exhibitionId: exhibition.id,
          galleryId: typeof exhibition.gallery === 'object' ? exhibition.gallery.id : exhibition.gallery,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to invite juror')
      }

      const result = await response.json()
      
      const jurorResponse = await fetch(
        `${PAYLOAD_URL}/api/users?where[appRole][equals]=juror`,
        { credentials: 'include' }
      )
      
      if (jurorResponse.ok) {
        const data = await jurorResponse.json()
        setAllJurors(data.docs || [])
      }

      setSelectedJurors(prev => new Set([...prev, String(result.juror.id)]))
      
      setInviteForm({ email: '', name: '' })
      setShowInviteForm(false)
      
      alert(result.isNewUser 
        ? `Invitation sent to ${inviteForm.email}!` 
        : `${inviteForm.name} has been added as a juror.`
      )
    } catch (err: any) {
      alert(err.message || 'Failed to invite juror')
    } finally {
      setInviting(false)
    }
  }

  const handleToggleJuror = (jurorId: string) => {
    setSelectedJurors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jurorId)) {
        newSet.delete(jurorId)
      } else {
        newSet.add(jurorId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const jurorIds = Array.from(selectedJurors).map(id => parseInt(id))

      const res = await fetch(`${PAYLOAD_URL}/api/exhibitions/${exhibition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jurors: jurorIds }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update jurors')
      }

      onSuccess(jurorIds)
    } catch (err) {
      console.error(err)
      alert('Failed to update jurors')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Manage Jurors</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Select jurors for {exhibition.title}
              </p>
            </div>
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Invite New Juror
            </button>
          </div>
        </div>

        {showInviteForm && (
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <form onSubmit={handleInviteJuror} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                    placeholder="juror@email.com"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : allJurors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">No jurors yet.</p>
              <p className="text-sm text-gray-500">Click "Invite New Juror" to send an invitation.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allJurors.map((juror) => (
                <button
                  key={juror.id}
                  onClick={() => handleToggleJuror(String(juror.id))}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedJurors.has(String(juror.id))
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedJurors.has(String(juror.id))
                        ? 'bg-blue-600'
                        : 'bg-neutral-200'
                    }`}>
                      <Users className={`w-5 h-5 ${
                        selectedJurors.has(String(juror.id))
                          ? 'text-white'
                          : 'text-neutral-500'
                      }`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-neutral-900">
                        {juror.name || 'Unnamed Juror'}
                      </div>
                      <div className="text-sm text-gray-600">{juror.email}</div>
                    </div>
                  </div>
                  {selectedJurors.has(String(juror.id)) && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {selectedJurors.size} {selectedJurors.size === 1 ? 'juror' : 'jurors'} selected
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-full hover:bg-neutral-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Jurors
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Assign Jurors Modal
 */
interface AssignJurorsModalProps {
  submission: Submission
  onClose: () => void
  onSuccess: (updated: Submission) => void
}

function AssignJurorsModal({ submission, onClose, onSuccess }: AssignJurorsModalProps) {
  const [availableJurors, setAvailableJurors] = useState<User[]>([])
  const [selectedJurors, setSelectedJurors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const exhibitionData = typeof submission.exhibition === 'object'
      ? (submission.exhibition as any)
      : null

    if (!exhibitionData || !exhibitionData.jurors) {
      console.warn('No jurors found in exhibition')
      setAvailableJurors([])
      setLoading(false)
      return
    }

    const jurorsFromExhibition = (exhibitionData.jurors || []) as any[]

    const normalized = jurorsFromExhibition
      .map((j: any) => {
        if (typeof j === 'object' && j !== null) {
          return j as User
        }
        return null
      })
      .filter(Boolean) as User[]

    setAvailableJurors(normalized)

    const assigned = (submission.assignedJurors || []) as any[]
    const assignedIds = assigned.map((j: any) => String(typeof j === 'object' ? j.id : j))
    setSelectedJurors(new Set(assignedIds))

    setLoading(false)
  }, [submission])

  const toggleJuror = (id: string) => {
    setSelectedJurors(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const jurorIds = Array.from(selectedJurors).map(id => parseInt(id, 10))

      const res = await fetch(
        `${PAYLOAD_URL}/api/submissions/${submission.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            assignedJurors: jurorIds,
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Assign jurors error:', err)
        throw new Error(err.message || err.error || 'Failed to assign jurors')
      }

      const refreshRes = await fetch(
        `${PAYLOAD_URL}/api/submissions/${submission.id}?depth=3`,
        { credentials: 'include' }
      )

      if (refreshRes.ok) {
        const updated = await refreshRes.json()
        onSuccess(updated as Submission)
      } else {
        throw new Error('Failed to refresh submission data')
      }
    } catch (err: any) {
      console.error('handleSave error:', err)
      alert(err.message || 'Failed to assign jurors')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">Assign Jurors</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Assign jurors to review "
            {typeof submission.artwork === 'object'
              ? (submission.artwork as any).title || 'Artwork'
              : 'Artwork'}
            "
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : availableJurors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 mb-2">
                No jurors assigned to this exhibition yet.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please add jurors to the exhibition in "Manage Jurors" first.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {availableJurors.map(juror => (
                <button
                  key={juror.id}
                  onClick={() => toggleJuror(String(juror.id))}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedJurors.has(String(juror.id))
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedJurors.has(String(juror.id))
                          ? 'bg-blue-600'
                          : 'bg-neutral-200'
                      }`}
                    >
                      <Users
                        className={`w-5 h-5 ${
                          selectedJurors.has(String(juror.id))
                            ? 'text-white'
                            : 'text-neutral-500'
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-neutral-900">
                        {juror.name || 'Unnamed Juror'}
                      </div>
                      <div className="text-sm text-gray-600">{juror.email}</div>
                    </div>
                  </div>
                  {selectedJurors.has(String(juror.id)) && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            {selectedJurors.size} {selectedJurors.size === 1 ? 'juror' : 'jurors'} assigned
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-full hover:bg-neutral-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || availableJurors.length === 0}
              className="flex-1 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}