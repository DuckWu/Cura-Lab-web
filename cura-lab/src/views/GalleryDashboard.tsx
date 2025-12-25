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
  Check,
  ListFilter,
  Briefcase
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
  onEnterJuryMode?: () => void
}

export default function GalleryDashboard({
  currentUser,
  onCreateExhibition,
  onEditExhibition,
  onViewExhibition,
  onEnterJuryMode
}: GalleryDashboardProps) {
  const [myGallery, setMyGallery] = useState<Gallery | null>(null)
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState<'exhibitions' | 'submissions'>('exhibitions')
  const [filterExhibitionId, setFilterExhibitionId] = useState<string | 'all'>('all')

  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null)
  const [showJurorModal, setShowJurorModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false)
  
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

  const handleManageSubmissions = (exhibitionId: number) => {
    setFilterExhibitionId(String(exhibitionId))
    setActiveTab('submissions')
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
    <div className="min-h-screen bg-neutral-50 flex">
      {/* 🚀 左侧固定侧边栏 */}
      <div className="hidden lg:flex w-64 bg-white border-r border-neutral-200 flex-col sticky top-0 h-screen z-20">
        <div className="p-8 font-black text-2xl tracking-tighter border-b">ADMIN PANEL</div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('exhibitions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'exhibitions' ? 'bg-neutral-900 text-white shadow-lg' : 'text-gray-500 hover:bg-neutral-100'}`}
          >
            <Calendar className="w-5 h-5" /> Exhibitions
          </button>
          <button 
            onClick={() => { setActiveTab('submissions'); setFilterExhibitionId('all'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'submissions' ? 'bg-neutral-900 text-white shadow-lg' : 'text-gray-500 hover:bg-neutral-100'}`}
          >
            <FileText className="w-5 h-5" /> All Submissions
          </button>

          <div className="pt-6 mt-6 border-t border-neutral-100">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tools</p>
            <button 
              onClick={onEnterJuryMode}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-purple-600 hover:bg-purple-50 transition-all"
            >
              <Briefcase className="w-5 h-5" />
              Enter Jury Mode
            </button>
          </div>
        </nav>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1 overflow-x-hidden">
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
            <StatCard icon={Calendar} label="Total Exhibitions" value={stats.totalExhibitions} color="primary" />
            <StatCard icon={TrendingUp} label="Active Exhibitions" value={stats.activeExhibitions} color="success" />
            <StatCard icon={FileText} label="Total Submissions" value={stats.totalSubmissions} color="accent" />
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} color="primary" />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
          {activeTab === 'exhibitions' ? (
            <ExhibitionsGrid
              exhibitions={exhibitions}
              onEdit={onEditExhibition}
              onView={onViewExhibition}
              onManageJurors={(exhibition) => {
                setSelectedExhibition(exhibition)
                setShowJurorModal(true)
              }}
              onManageSubmissions={handleManageSubmissions}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <ListFilter className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Viewing:</span>
                  <select 
                    value={filterExhibitionId}
                    onChange={(e) => setFilterExhibitionId(e.target.value)}
                    className="bg-neutral-50 border-none text-sm font-bold rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-neutral-900"
                  >
                    <option value="all">All Exhibitions</option>
                    {exhibitions.map(ex => (
                      <option key={ex.id} value={String(ex.id)}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                {filterExhibitionId !== 'all' && (
                  <button
                    onClick={() => setShowBatchAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-md"
                  >
                    <Users className="w-4 h-4" />
                    Assign All to Jurors
                  </button>
                )}
              </div>

              {/* 🔧 Gallery Status Removed */}
              <SubmissionsTable
                submissions={filterExhibitionId === 'all' 
                  ? submissions 
                  : submissions.filter(s => String((s.exhibition as any).id || s.exhibition) === filterExhibitionId)
                }
                onAssignJurors={(submission) => {
                  setSelectedSubmission(submission)
                  setShowAssignModal(true)
                }}
                onUpdateSubmission={handleUpdateSubmission}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showJurorModal && selectedExhibition && (
        <ManageJurorsModal
          exhibition={selectedExhibition}
          currentUser={currentUser}
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
          currentUser={currentUser}
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

      {showBatchAssignModal && filterExhibitionId !== 'all' && (
        <BatchAssignModal
          exhibitionId={parseInt(filterExhibitionId)}
          currentUser={currentUser}
          onClose={() => setShowBatchAssignModal(false)}
          onSuccess={() => {
            setShowBatchAssignModal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

// --- Sub Components ---

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

interface ExhibitionsGridProps {
  exhibitions: Exhibition[]
  onEdit?: (id: number) => void
  onView?: (id: number) => void
  onManageJurors?: (exhibition: Exhibition) => void
  onManageSubmissions?: (id: number) => void
}

function ExhibitionsGrid({ exhibitions, onEdit, onView, onManageJurors, onManageSubmissions }: ExhibitionsGridProps) {
  if (exhibitions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Exhibitions Yet</h3>
        <p className="text-gray-600 mb-6">Create your first exhibition to start receiving artwork submissions.</p>
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
          onManageSubmissions={onManageSubmissions}
        />
      ))}
    </div>
  )
}

interface ExhibitionCardProps {
  exhibition: Exhibition
  onEdit?: (id: number) => void
  onView?: (id: number) => void
  onManageJurors?: (exhibition: Exhibition) => void
  onManageSubmissions?: (id: number) => void
}

function ExhibitionCard({ exhibition, onEdit, onView, onManageJurors, onManageSubmissions }: ExhibitionCardProps) {
  // 🔧 移除了 Selected Count / Capacity 逻辑
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all flex flex-col h-full">
      <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden shrink-0">
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

        <div className="absolute top-3 right-3">
          <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-neutral-900 flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{exhibition.jurors ? (exhibition.jurors as any[]).length : 0} Jurors</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-1">{exhibition.title}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{exhibition.description}</p>
        
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
          <button
            onClick={() => onManageSubmissions && onManageSubmissions(exhibition.id)}
            className="col-span-2 px-4 py-2 text-sm font-bold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Manage Submissions</span>
          </button>
        </div>
      </div>
    </div>
  )
}

interface SubmissionsTableProps {
  submissions: Submission[]
  onAssignJurors?: (submission: Submission) => void
  onUpdateSubmission?: (updated: Submission) => void
}

function SubmissionsTable({ 
  submissions, 
  onAssignJurors
}: SubmissionsTableProps) {
  const [updating] = useState<number | null>(null)

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Submissions Found</h3>
        <p className="text-gray-600">Try changing the exhibition filter or wait for new submissions.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Artwork</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Artist</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Exhibition</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jury Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {submissions.map((submission) => {
                const artist = typeof submission.artist === 'object' ? submission.artist : null
                const artwork = typeof submission.artwork === 'object' ? submission.artwork : null
                const exhibitionData = typeof submission.exhibition === 'object' ? submission.exhibition : null

                const assignedJurors = (((submission as any).assignedJurors) || []) as any[]
                const assignedNames = assignedJurors
                  .map((j: any) => typeof j === 'object' ? (j.name || j.email || '') : '')
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
                              src={`${PAYLOAD_URL}${(artwork as any).image.url}`}
                              alt={artwork.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium text-neutral-900">{artwork?.title || 'Untitled'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {artist?.name || artist?.email || 'Unknown'}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{exhibitionData?.title || 'N/A'}</span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(submission.submittedAt)}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        submission.juryStatus === 'accepted' ? 'bg-green-50 text-green-700' : 
                        submission.juryStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {submission.juryStatus?.toUpperCase()}
                      </span>
                    </td>

                    {/* 🔧 Gallery Status Removed from Table */}

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-gray-500">
                          {assignedJurors.length ? `Assigned: ${assignedNames}` : 'No juror assigned'}
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          {onAssignJurors && (
                            <button
                              onClick={() => onAssignJurors(submission)}
                              disabled={isUpdating}
                              className="px-2.5 py-1 text-xs font-semibold text-neutral-900 bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Users className="w-3 h-3" /> Assign
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// --- Manage Jurors Modal ---

interface ManageJurorsModalProps {
  exhibition: Exhibition
  currentUser: User | null
  onClose: () => void
  onSuccess: (jurorIds: number[]) => void
}

function ManageJurorsModal({ exhibition, currentUser, onClose, onSuccess }: ManageJurorsModalProps) {
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
          `${PAYLOAD_URL}/api/users?where[or][0][appRole][equals]=juror&where[or][1][appRole][equals]=gallery&limit=100`,
          { credentials: 'include' }
        )
        if (response.ok) {
          const data = await response.json()
          let users = data.docs || []
          
          if (currentUser && !users.find((u: any) => u.id === currentUser.id)) {
            users = [currentUser, ...users]
          }
          
          setAllJurors(users)
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
  }, [exhibition, currentUser])

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
      
      const listResponse = await fetch(
        `${PAYLOAD_URL}/api/users?where[or][0][appRole][equals]=juror&where[or][1][appRole][equals]=gallery&limit=100`,
        { credentials: 'include' }
      )
      if (listResponse.ok) {
        const data = await listResponse.json()
        setAllJurors(data.docs || [])
      }
      
      const result = await response.json()
      setSelectedJurors(prev => new Set([...prev, String(result.juror.id)]))
      setInviteForm({ email: '', name: '' })
      setShowInviteForm(false)
      alert(result.isNewUser ? `Invitation sent to ${inviteForm.email}!` : `${inviteForm.name} has been added as a juror.`)
    } catch (err: any) {
      alert(err.message || 'Failed to invite juror')
    } finally {
      setInviting(false)
    }
  }

  const handleToggleJuror = (jurorId: string) => {
    setSelectedJurors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jurorId)) newSet.delete(jurorId)
      else newSet.add(jurorId)
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
      if (!res.ok) throw new Error('Failed to update jurors')
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
              <p className="text-sm text-neutral-600 mt-1">Select jurors for {exhibition.title}</p>
            </div>
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Invite New Juror
            </button>
          </div>
        </div>
        {showInviteForm && (
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <form onSubmit={handleInviteJuror} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">Name *</label>
                  <input type="text" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} required placeholder="John Doe" className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">Email *</label>
                  <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required placeholder="juror@email.com" className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInviteForm(false)} className="px-4 py-2 border border-neutral-300 text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium">Cancel</button>
                <button type="submit" disabled={inviting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                  {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Invitation</>}
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>
          ) : allJurors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">No jurors yet.</p>
              <p className="text-sm text-gray-500">Click "Invite New Juror" to send an invitation.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allJurors.map((juror) => (
                <button key={juror.id} onClick={() => handleToggleJuror(String(juror.id))} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedJurors.has(String(juror.id)) ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedJurors.has(String(juror.id)) ? 'bg-blue-600' : 'bg-neutral-200'}`}>
                      <Users className={`w-5 h-5 ${selectedJurors.has(String(juror.id)) ? 'text-white' : 'text-neutral-500'}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-neutral-900">
                        {juror.name || 'Unnamed Juror'}
                        {juror.id === currentUser?.id && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">YOU</span>}
                      </div>
                      <div className="text-sm text-gray-600">{juror.email}</div>
                    </div>
                  </div>
                  {selectedJurors.has(String(juror.id)) && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">{selectedJurors.size} {selectedJurors.size === 1 ? 'juror' : 'jurors'} assigned</div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-full hover:bg-neutral-100 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={saving || allJurors.length === 0} className="flex-1 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Check className="w-5 h-5" /> Save Jurors</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AssignJurorsModalProps {
  submission: Submission
  currentUser: User | null
  onClose: () => void
  onSuccess: (updated: Submission) => void
}

function AssignJurorsModal({ submission, currentUser, onClose, onSuccess }: AssignJurorsModalProps) {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedJurors, setSelectedJurors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch(
          `${PAYLOAD_URL}/api/users?where[or][0][appRole][equals]=juror&where[or][1][appRole][equals]=gallery&limit=100`, 
          { credentials: 'include' }
        )

        if (response.ok) {
          const data = await response.json()
          let users = (data.docs || []) as User[]

          if (currentUser) {
            const meIndex = users.findIndex(u => u.id === currentUser.id)
            if (meIndex > -1) {
              const [me] = users.splice(meIndex, 1)
              users = [me, ...users]
            } else {
              users = [currentUser, ...users]
            }
          }

          setAllUsers(users)

          const assigned = (submission.assignedJurors || []) as any[]
          const assignedIds = assigned.map((j: any) => String(typeof j === 'object' ? j.id : j))
          setSelectedJurors(new Set(assignedIds))
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [submission, currentUser])

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
      
      const res = await fetch(`${PAYLOAD_URL}/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignedJurors: jurorIds }),
      })

      if (!res.ok) throw new Error('Failed to assign jurors')

      const refreshRes = await fetch(`${PAYLOAD_URL}/api/submissions/${submission.id}?depth=3`, { credentials: 'include' })
      
      if (refreshRes.ok) {
        const updated = await refreshRes.json()
        onSuccess(updated as Submission)
      } else {
        throw new Error('Failed to refresh submission data')
      }
    } catch (err: any) {
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
            Assign jurors to review "{typeof submission.artwork === 'object' ? (submission.artwork as any).title || 'Artwork' : 'Artwork'}"
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : allUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 mb-2">No eligible users found.</p>
              <button onClick={onClose} className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-semibold">Close</button>
            </div>
          ) : (
            <div className="space-y-2">
              {allUsers.map(user => (
                <button 
                  key={user.id} 
                  onClick={() => toggleJuror(String(user.id))} 
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedJurors.has(String(user.id)) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedJurors.has(String(user.id)) ? 'bg-blue-600' : 'bg-neutral-200'}`}>
                      <Users className={`w-5 h-5 ${selectedJurors.has(String(user.id)) ? 'text-white' : 'text-neutral-500'}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-neutral-900 flex items-center gap-2">
                        {user.name || 'Unnamed User'}
                        {/* 标记自己 */}
                        {user.id === currentUser?.id && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-bold">YOU</span>
                        )}
                        {/* 标记是否是 Gallery 角色 */}
                        {user.appRole === 'gallery' && user.id !== currentUser?.id && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-bold">GALLERY</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                  {selectedJurors.has(String(user.id)) && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            {selectedJurors.size} {selectedJurors.size === 1 ? 'user' : 'users'} assigned
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-full hover:bg-neutral-100 transition-all">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Check className="w-5 h-5" /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface BatchAssignModalProps {
  exhibitionId: number
  currentUser: User | null
  onClose: () => void
  onSuccess: () => void
}

function BatchAssignModal({ exhibitionId, currentUser, onClose, onSuccess }: BatchAssignModalProps) {
  const [jurors, setJurors] = useState<User[]>([])
  const [selectedJurors, setSelectedJurors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState({ submissionCount: 0 })

  useEffect(() => {
    async function init() {
      try {
        const exRes = await fetch(`${PAYLOAD_URL}/api/exhibitions/${exhibitionId}?depth=1`, { credentials: 'include' })
        const exData = await exRes.json()
        
        let availableJurors: User[] = []
        if (Array.isArray(exData.jurors)) {
          availableJurors = exData.jurors
        }

        if (currentUser) {
          const isOwnerInList = availableJurors.some((j: any) => j.id === currentUser.id)
          if (!isOwnerInList) {
            availableJurors = [currentUser, ...availableJurors]
          }
        }

        setJurors(availableJurors)

        const subRes = await fetch(`${PAYLOAD_URL}/api/submissions?where[exhibition][equals]=${exhibitionId}&depth=0`, { credentials: 'include' })
        const subData = await subRes.json()
        setStats({ submissionCount: subData.totalDocs || 0 })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [exhibitionId, currentUser])

  const toggleJuror = (id: string) => {
    setSelectedJurors(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBatchAssign = async () => {
    if (selectedJurors.size === 0) return
    setProcessing(true)

    try {
      const subRes = await fetch(`${PAYLOAD_URL}/api/submissions?where[exhibition][equals]=${exhibitionId}&limit=1000&depth=0`, { credentials: 'include' })
      const subData = await subRes.json()
      const submissions = subData.docs || []
      const jurorIds = Array.from(selectedJurors).map(id => parseInt(id))

      const updatePromises = submissions.map((sub: any) => 
        fetch(`${PAYLOAD_URL}/api/submissions/${sub.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ assignedJurors: jurorIds }),
        })
      )

      await Promise.all(updatePromises)
      alert(`Successfully assigned jurors to ${submissions.length} submissions!`)
      onSuccess()

    } catch (err: any) {
      alert('Batch assign failed: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">Batch Assign Jurors</h2>
          <p className="text-sm text-neutral-500 mt-1">Assigning to <span className="font-bold text-neutral-900">{stats.submissionCount}</span> submissions</p>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
             <div className="flex justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>
          ) : jurors.length === 0 ? (
             <p className="text-center text-gray-500">No jurors found.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Jurors</p>
              {jurors.map(juror => (
                <button
                  key={juror.id}
                  onClick={() => toggleJuror(String(juror.id))}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    selectedJurors.has(String(juror.id)) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-neutral-100 hover:border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                       selectedJurors.has(String(juror.id)) ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {juror.name?.[0] || 'U'}
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-sm block">
                        {juror.id === currentUser?.id ? `${juror.name} (Me)` : juror.name}
                      </span>
                      {juror.id === currentUser?.id && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded">GALLERY</span>
                      )}
                    </div>
                  </div>
                  {selectedJurors.has(String(juror.id)) && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 font-semibold text-gray-600 hover:bg-neutral-200 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={handleBatchAssign}
            disabled={processing || selectedJurors.size === 0}
            className="flex-1 py-2.5 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="animate-spin w-4 h-4" /> : <Users className="w-4 h-4" />}
            {processing ? 'Assigning...' : 'Assign to All'}
          </button>
        </div>
      </div>
    </div>
  )
}