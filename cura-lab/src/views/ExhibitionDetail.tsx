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
  Upload
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

const STATUS_LABEL: Record<string, string> = {
  open: 'Open for Submissions',
  jury_review: 'In Jury Review',
  finalized: 'Selection Finalized',
  on_display: 'On Display',
  closed: 'Closed',
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
      message: 'Submission successful — your artwork is now under review.',
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
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-ink animate-spin mx-auto mb-4" />
          <p className="eyebrow">Loading exhibition</p>
        </div>
      </div>
    )
  }

  if (error || !exhibition) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center py-20">
          <p className="eyebrow mb-4">Not found</p>
          <h2 className="display text-3xl mb-4">Exhibition Not Found</h2>
          <p className="text-stone mb-10">{error || 'This exhibition does not exist.'}</p>
          <button onClick={onBack} className="btn-solid">
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
    <div className="min-h-screen bg-paper">
      {/* Back bar */}
      <div className="sticky top-16 z-40 bg-paper/85 backdrop-blur-xl border-b border-fog">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-4">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-[13px] tracking-[0.1em] uppercase text-stone hover:text-ink font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Exhibitions</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative bg-ink text-paper overflow-hidden">
        {isMedia(exhibition.cover_image) && (
          <div className="absolute inset-0">
            <img
              src={`${PAYLOAD_URL}${exhibition.cover_image.url!}`}
              alt={exhibition.cover_image.alt || exhibition.title}
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
          </div>
        )}

        <div className="relative max-w-screen-2xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 text-[11px] tracking-[0.14em] uppercase font-medium border ${
                isOpen ? 'border-paper/40 text-paper' : 'border-paper/20 text-paper/60'
              }`}>
                {isOpen && <span className="w-1.5 h-1.5 bg-paper rounded-full animate-pulse" />}
                {STATUS_LABEL[backendStatus] || backendStatus}
              </span>
              {isClosingSoon && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] tracking-[0.14em] uppercase font-medium bg-paper text-ink">
                  <Clock className="w-3.5 h-3.5" />
                  Closing in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>

            <h1 className="display text-paper text-5xl sm:text-6xl lg:text-7xl mb-6">
              {exhibition.title}
            </h1>

            <p className="text-lg text-paper/60 leading-relaxed mb-12 max-w-2xl font-light">
              {exhibition.description}
            </p>

            {/* Stats — hairline dividers, no cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-paper/15 pt-8 mb-12">
              {[
                { icon: DollarSign, label: 'Entry Fee', value: exhibition.submission_fee ? `$${exhibition.submission_fee}` : 'Free' },
                { icon: Award, label: 'Max Selected', value: exhibition.max_selected || '—' },
                { icon: FileText, label: 'Submissions', value: exhibition.totalSubmissions || 0 },
                { icon: Users, label: 'Jurors', value: exhibition.jurors ? (exhibition.jurors as any[]).length : 0 },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center gap-2 text-paper/40 mb-2">
                    <s.icon className="w-3.5 h-3.5" />
                    <span className="text-[11px] tracking-[0.14em] uppercase">{s.label}</span>
                  </div>
                  <div className="font-display text-3xl text-paper font-light">{s.value}</div>
                </div>
              ))}
            </div>

            {isOpen && (
              <div>
                {isArtist ? (
                  <button onClick={() => setShowSubmitModal(true)} className="btn-solid bg-paper text-ink hover:bg-white">
                    <Upload className="w-4 h-4" />
                    Submit Your Artwork
                  </button>
                ) : currentUser ? (
                  <p className="font-display italic text-xl text-paper/40">Only artists can submit artworks.</p>
                ) : (
                  <button onClick={() => alert('Please sign in as an artist to submit.')} className="btn-line text-paper border-paper/40 hover:border-paper">
                    Sign In to Submit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main */}
          <div className="lg:col-span-2">
            <div className="border-b border-fog mb-10">
              <div className="flex gap-10">
                {(['overview', 'requirements', 'jurors'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-[13px] tracking-[0.12em] uppercase font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'text-ink border-ink'
                        : 'text-stone border-transparent hover:text-ink'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <div>
                <p className="eyebrow mb-4">About</p>
                <p className="text-lg text-ink-soft leading-relaxed font-light max-w-2xl">{exhibition.description}</p>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div>
                <p className="eyebrow mb-8">Submission Requirements</p>
                <div className="divide-y divide-fog border-y border-fog">
                  {[
                    { icon: CheckCircle, title: 'Entry Fee', desc: exhibition.submission_fee ? `$${exhibition.submission_fee} per submission` : 'Free to enter' },
                    { icon: Award, title: 'Selection', desc: `Up to ${exhibition.max_selected || '—'} artworks will be selected` },
                    { icon: FileText, title: 'Platform Fee', desc: `${exhibition.platformFeePercentage || 10}% platform fee on entry fees` },
                  ].map(r => (
                    <div key={r.title} className="flex items-start gap-5 py-6">
                      <r.icon className="w-5 h-5 text-stone flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-sans text-sm font-medium tracking-[0.06em] uppercase text-ink mb-1">{r.title}</h3>
                        <p className="text-[15px] text-stone">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'jurors' && (
              <div>
                <p className="eyebrow mb-8">Jury Panel</p>
                {exhibition.jurors && (exhibition.jurors as any[]).length > 0 ? (
                  <div className="divide-y divide-fog border-y border-fog">
                    {(exhibition.jurors as any[]).map((juror: any) => (
                      <div key={juror.id} className="flex items-center gap-5 py-5">
                        <div className="w-11 h-11 rounded-full bg-fog flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-stone" />
                        </div>
                        <div>
                          <div className="text-[15px] font-medium text-ink">{juror.name || juror.email}</div>
                          {juror.email && <div className="text-sm text-stone">{juror.email}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-display italic text-xl text-stone">No jurors assigned yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-10">
              {isGallery(exhibition.gallery) && (
                <div className="border-t border-fog pt-8">
                  <p className="eyebrow mb-5">Hosted by</p>
                  <button
                    onClick={() => onGalleryClick && onGalleryClick((exhibition.gallery as Gallery).id)}
                    className="flex items-center gap-4 w-full text-left group"
                  >
                    {isMedia(exhibition.gallery.logo) && (
                      <img
                        src={`${PAYLOAD_URL}${exhibition.gallery.logo.url!}`}
                        alt={exhibition.gallery.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-display text-xl text-ink group-hover:opacity-60 transition-opacity">
                        {exhibition.gallery.name}
                      </div>
                      {exhibition.gallery.location && (
                        <div className="flex items-center gap-1.5 text-sm text-stone mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{exhibition.gallery.location}</span>
                        </div>
                      )}
                    </div>
                    {onGalleryClick && <ExternalLink className="w-4 h-4 text-stone group-hover:text-ink transition-colors" />}
                  </button>

                  {(exhibition.gallery.email || exhibition.gallery.website) && (
                    <div className="mt-5 pt-5 border-t border-fog space-y-2.5">
                      {exhibition.gallery.email && (
                        <a href={`mailto:${exhibition.gallery.email}`} className="flex items-center gap-2.5 text-sm text-stone hover:text-ink transition-colors">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{exhibition.gallery.email}</span>
                        </a>
                      )}
                      {exhibition.gallery.website && (
                        <a href={exhibition.gallery.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-stone hover:text-ink transition-colors">
                          <Globe className="w-4 h-4" />
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-fog pt-8">
                <p className="eyebrow mb-5">Important Dates</p>
                <ul className="space-y-4">
                  {[
                    { icon: Calendar, label: 'Exhibition Opens', value: formatDate(exhibition.start_date) },
                    { icon: Clock, label: 'Submission Deadline', value: formatDate(exhibition.submission_deadline) },
                    { icon: Calendar, label: 'Exhibition Closes', value: formatDate(exhibition.end_date) },
                  ].map(d => (
                    <li key={d.label} className="flex items-start gap-3.5">
                      <d.icon className="w-4 h-4 text-stone flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-[11px] tracking-[0.12em] uppercase text-stone mb-0.5">{d.label}</div>
                        <div className="text-[15px] text-ink">{d.value}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-fog p-7">
                <p className="eyebrow mb-3">Status</p>
                <p className="text-[15px] text-ink-soft leading-relaxed">
                  {isOpen
                    ? `Accepting submissions${daysRemaining !== null ? ` — ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining` : ''}.`
                    : backendStatus === 'jury_review'
                    ? 'Submissions are closed. The jury is currently reviewing artworks.'
                    : backendStatus === 'finalized'
                    ? 'The exhibition selection has been finalized.'
                    : 'This exhibition is closed for submissions.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-6 py-4 shadow-xl border flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-ink text-paper border-ink' : 'bg-white text-ink border-fog'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

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
