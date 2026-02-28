// src/views/ExhibitionDetail.tsx
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Clock,
  MapPin,
  Mail,
  Globe,
  Award,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import SubmitArtworkModal from './SubmitArtworkModal'
import type { Exhibition, Media, Gallery, User } from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

function isGallery(gal: string | number | Gallery | null | undefined): gal is Gallery {
  return typeof gal === 'object' && gal !== null && 'name' in gal
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
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

type ExhibitionDetailProps = {
  id: number
  onBack: () => void
  onGalleryClick?: (id: number) => void
  currentUser?: User | null
}

export default function ExhibitionDetail({ id, onBack, onGalleryClick, currentUser }: ExhibitionDetailProps) {
  const [exhibition, setExhibition] = useState<Exhibition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'jurors'>('overview')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    async function fetchExhibition() {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${PAYLOAD_URL}/api/exhibitions/${id}?depth=2`, {
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error('Failed to fetch exhibition details')
        }
        const data: Exhibition = await response.json()
        setExhibition(data)
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchExhibition()
  }, [id])

  const handleSubmissionSuccess = async () => {
    setShowSubmitModal(false)

    setToast({
      message: '✓ Submission successful! Your artwork has been submitted for review.',
      type: 'success'
    })

    setTimeout(() => setToast(null), 4000)

    try {
      const response = await fetch(`${PAYLOAD_URL}/api/exhibitions/${id}?depth=2`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data: Exhibition = await response.json()
        setExhibition(data)
      }
    } catch (err) {
      console.error('Failed to refresh exhibition:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-lg text-neutral-600">Loading exhibition...</p>
        </div>
      </div>
    )
  }

  if (error || !exhibition) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Exhibition Not Found</h2>
          <p className="text-neutral-600 mb-6">{error || 'This exhibition does not exist.'}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all"
          >
            Back to Exhibitions
          </button>
        </div>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(exhibition.submission_deadline)
  const backendStatus = exhibition.exhibitionStatus || 'draft'
  const isOpen = backendStatus === 'open' && (daysRemaining === null || daysRemaining > 0)
  const isClosingSoon = isOpen && daysRemaining !== null && daysRemaining <= 7
  const isArtist = currentUser?.appRole === 'artist'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Exhibitions</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-neutral-900 text-white overflow-hidden">
        {isMedia(exhibition.cover_image) && (
          <div className="absolute inset-0">
            <img
              src={`${PAYLOAD_URL}${exhibition.cover_image.url!}`}
              alt={exhibition.cover_image.alt || exhibition.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 via-neutral-900/90 to-neutral-900"></div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="max-w-4xl">
            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-6">
              {isOpen ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Open for Submissions
                </span>
              ) : (
                <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-full shadow-lg ${
                  backendStatus === 'jury_review' ? 'bg-purple-600' :
                  backendStatus === 'finalized' ? 'bg-blue-600' :
                  backendStatus === 'on_display' ? 'bg-indigo-600' :
                  'bg-neutral-600'
                }`}>
                  {backendStatus === 'jury_review' ? 'In Jury Review' :
                   backendStatus === 'finalized' ? 'Selection Finalized' :
                   backendStatus === 'on_display' ? 'On Display' :
                   'Closed'}
                </span>
              )}

              {isClosingSoon && (
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-400 to-red-500 rounded-full shadow-lg">
                  <Clock className="w-4 h-4" />
                  Closing in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              {exhibition.title}
            </h1>

            <p className="text-lg text-white/90 leading-relaxed mb-8">
              {exhibition.description}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Entry Fee</span>
                </div>
                <div className="text-2xl font-bold">${exhibition.submission_fee || 0}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-sm">Max Selected</span>
                </div>
                <div className="text-2xl font-bold">{exhibition.max_selected || 'N/A'}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Submissions</span>
                </div>
                <div className="text-2xl font-bold">{exhibition.totalSubmissions || 0}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Jurors</span>
                </div>
                <div className="text-2xl font-bold">
                  {exhibition.jurors ? (exhibition.jurors as any[]).length : 0}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            {isOpen && (
              <div className="mt-8">
                {isArtist ? (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-neutral-900 bg-white hover:bg-neutral-100 rounded-full transition-all transform hover:scale-105 shadow-xl"
                  >
                    <Upload className="w-5 h-5" />
                    Submit Your Artwork
                  </button>
                ) : currentUser ? (
                  <div className="px-8 py-4 bg-white/20 backdrop-blur-sm rounded-full text-white inline-block">
                    Only artists can submit artworks
                  </div>
                ) : (
                  <button
                    onClick={() => alert('Please login as an artist to submit')}
                    className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-neutral-900 bg-white hover:bg-neutral-100 rounded-full transition-all transform hover:scale-105 shadow-xl"
                  >
                    Login to Submit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="border-b border-neutral-200">
              <div className="flex gap-8 overflow-x-auto">
                {(['overview', 'requirements', 'jurors'] as const).map((tab) => (
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
            <div className="bg-white rounded-2xl border border-neutral-200 p-8">
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">About this Exhibition</h2>
                  <div className="prose prose-neutral max-w-none">
                    <p className="text-neutral-700 leading-relaxed">{exhibition.description}</p>
                  </div>
                </div>
              )}

              {activeTab === 'requirements' && (
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">Submission Requirements</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-2">Entry Fee</h3>
                        <p className="text-neutral-600">${exhibition.submission_fee || 0} per submission</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-2">Selection Process</h3>
                        <p className="text-neutral-600">Up to {exhibition.max_selected || 'N/A'} artworks will be selected for the exhibition</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-2">Platform Fee</h3>
                        <p className="text-neutral-600">{exhibition.platformFeePercentage || 10}% platform fee on entry fees</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'jurors' && (
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">Jury Panel</h2>
                  {exhibition.jurors && (exhibition.jurors as any[]).length > 0 ? (
                    <div className="space-y-4">
                      {(exhibition.jurors as any[]).map((juror: any) => (
                        <div key={juror.id} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
                          <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-neutral-500" />
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900">{juror.name || juror.email}</div>
                            {juror.email && <div className="text-sm text-neutral-600">{juror.email}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-600">No jurors assigned yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Gallery Card */}
              {isGallery(exhibition.gallery) && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Hosted by</h3>
                  <button
                    onClick={() => onGalleryClick && onGalleryClick((exhibition.gallery as Gallery).id)}
                    className="flex items-center gap-4 w-full text-left group"
                  >
                    {isMedia(exhibition.gallery.logo) && (
                      <img
                        src={`${PAYLOAD_URL}${exhibition.gallery.logo.url!}`}
                        alt={exhibition.gallery.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                        {exhibition.gallery.name}
                      </div>
                      {exhibition.gallery.location && (
                        <div className="flex items-center gap-1 text-sm text-neutral-600 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{exhibition.gallery.location}</span>
                        </div>
                      )}
                    </div>
                    {onGalleryClick && (
                      <ExternalLink className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                    )}
                  </button>

                  {(exhibition.gallery.email || exhibition.gallery.website) && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                      {exhibition.gallery.email && (
                        <a href={`mailto:${exhibition.gallery.email}`} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{exhibition.gallery.email}</span>
                        </a>
                      )}
                      {exhibition.gallery.website && (
                        <a href={exhibition.gallery.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                          <Globe className="w-4 h-4" />
                          <span className="truncate">Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Important Dates */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Important Dates</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Exhibition Opens</div>
                      <div className="text-sm text-neutral-600">{formatDate(exhibition.start_date)}</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Submission Deadline</div>
                      <div className="text-sm text-neutral-600">{formatDate(exhibition.submission_deadline)}</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Exhibition Closes</div>
                      <div className="text-sm text-neutral-600">{formatDate(exhibition.end_date)}</div>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Status Card */}
              <div className={`rounded-2xl border p-6 ${
                isOpen
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                  : 'bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200'
              }`}>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Status</h3>
                <p className={`text-sm ${isOpen ? 'text-green-700' : 'text-neutral-600'}`}>
                  {isOpen
                    ? `This exhibition is accepting submissions. ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining.`
                    : backendStatus === 'jury_review'
                    ? 'Submissions are closed. The jury is currently reviewing artworks.'
                    : backendStatus === 'finalized'
                    ? 'The exhibition selection has been finalized.'
                    : 'This exhibition is closed for submissions.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div className={`px-6 py-4 rounded-xl shadow-2xl border-2 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-900'
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

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitArtworkModal
          exhibition={exhibition}
          currentUser={currentUser}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={handleSubmissionSuccess}
        />
      )}
    </div>
  )
}