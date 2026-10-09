// src/views/JurorReview.tsx
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Loader2,
  AlertCircle,
  Save,
  ListFilter,
  User,
  Calendar,
  Tag,
  Palette,
  Ruler,
  DollarSign,
  Maximize2,
  Building,
  LayoutGrid,
  CheckCircle,
  AlertTriangle // New icon for limit warning
} from 'lucide-react'
import type { 
  User as PayloadUser, 
  Submission, 
  Artwork, 
  Media,
  Exhibition,
  Gallery
} from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

export default function JurorReview({ currentUser, exhibitionId, onBack, onLogout }: { currentUser: PayloadUser | null, exhibitionId?: number, onBack?: () => void, onLogout?: () => void }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Local state for decisions
  const [decisions, setDecisions] = useState<Record<string, 'accepted' | 'rejected'>>({})
  const [showSummary, setShowSummary] = useState(false)
  
  // Filter state
  const [selectedExhibitionFilter, setSelectedExhibitionFilter] = useState<string>('all')

  // 🚀 New: Store exhibition details (specifically limits)
  const [exhibitionLimits, setExhibitionLimits] = useState<Record<number, { max: number, currentDbCount: number }>>({})

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return
      try {
        setLoading(true)
        
        // 1. Fetch Submissions
        let url = `${PAYLOAD_URL}/api/submissions?depth=2&limit=500`
        if (exhibitionId) {
          url += `&where[exhibition][equals]=${exhibitionId}`
        } else {
          url += `&where[exhibition.jurors][contains]=${currentUser.id}`
        }

        const subRes = await fetch(url, { credentials: 'include' })
        if (!subRes.ok) throw new Error('Failed to fetch submissions')
        const subData = await subRes.json()
        
        if (Array.isArray(subData.docs)) {
          setSubmissions(subData.docs)
          
          // Sync existing backend status
          const initialDecisions: Record<string, 'accepted' | 'rejected'> = {}
          subData.docs.forEach((s: Submission) => {
            if (s.juryStatus === 'accepted' || s.juryStatus === 'rejected') {
              initialDecisions[String(s.id)] = s.juryStatus
            }
          })
          setDecisions(initialDecisions)

          // 2. 🚀 Fetch Exhibition Limits logic
          // We need to know the max_selected for relevant exhibitions
          const uniqueExIds = new Set<number>()
          const exhibitionCounts: Record<number, number> = {}

          subData.docs.forEach((s: Submission) => {
            const ex = s.exhibition as Exhibition
            if (ex?.id) {
              uniqueExIds.add(ex.id)
              // Count how many are ALREADY accepted in DB
              if (s.juryStatus === 'accepted') {
                exhibitionCounts[ex.id] = (exhibitionCounts[ex.id] || 0) + 1
              }
            }
          })

          // Fetch details for these exhibitions to get max_selected
          const limitsMap: Record<number, { max: number, currentDbCount: number }> = {}
          
          await Promise.all(Array.from(uniqueExIds).map(async (id) => {
            try {
              const exRes = await fetch(`${PAYLOAD_URL}/api/exhibitions/${id}?depth=0`, { credentials: 'include' })
              if (exRes.ok) {
                const ex = await exRes.json()
                limitsMap[id] = {
                  max: ex.max_selected || 50, // Default to 50 if not set
                  currentDbCount: exhibitionCounts[id] || 0
                }
              }
            } catch (e) {
              console.error(`Failed to fetch limit for exhibition ${id}`, e)
            }
          }))
          
          setExhibitionLimits(limitsMap)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentUser, exhibitionId])

  // Extract unique exhibitions for sidebar
  const uniqueExhibitions = useMemo(() => {
    const map = new Map<number, { id: number; title: string; galleryName: string }>()
    submissions.forEach(sub => {
      const ex = sub.exhibition as Exhibition
      if (ex && typeof ex === 'object' && !map.has(ex.id)) {
        const gallery = ex.gallery as Gallery
        const galleryName = (typeof gallery === 'object' && gallery?.name) ? gallery.name : 'Gallery'
        map.set(ex.id, { id: ex.id, title: ex.title, galleryName })
      }
    })
    return Array.from(map.values())
  }, [submissions])

  const filteredSubmissions = useMemo(() => {
    if (selectedExhibitionFilter === 'all') return submissions
    return submissions.filter(s => {
      const ex = s.exhibition as Exhibition
      return String(ex?.id) === selectedExhibitionFilter
    })
  }, [submissions, selectedExhibitionFilter])

  useEffect(() => {
    setCurrentIndex(0)
  }, [selectedExhibitionFilter])

  // 🚀 Logic to calculate live count based on user decisions
  const getLiveStats = (exId: number) => {
    const limitInfo = exhibitionLimits[exId]
    if (!limitInfo) return { count: 0, max: 50, isFull: false }

    // Count accepts in current session state (decisions)
    // We filter all submissions belonging to this exhibition
    const relevantSubmissions = submissions.filter(s => (s.exhibition as Exhibition).id === exId)
    
    let liveCount = 0
    relevantSubmissions.forEach(s => {
      // If locally decided as accepted, count it
      if (decisions[String(s.id)] === 'accepted') {
        liveCount++
      } 
      // If locally undecided, but DB has it as accepted, DO NOT count it yet? 
      // Actually, 'decisions' state is initialized with DB state, so we just trust 'decisions'.
      // However, for items we haven't touched or loaded into decisions map?
      // The useEffect initializes 'decisions' with ALL accepted/rejected statuses from DB.
      // So 'decisions' is the source of truth for the UI.
    })

    return {
      count: liveCount,
      max: limitInfo.max,
      isFull: liveCount >= limitInfo.max
    }
  }

  const makeDecision = (id: string | number, type: 'accepted' | 'rejected') => {
    const stringId = String(id)
    setDecisions(prev => ({ ...prev, [stringId]: type }))
    
    if (currentIndex < filteredSubmissions.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300)
    } else {
      setShowSummary(true)
    }
  }

  const submitAllReviews = async () => {
    setIsSubmitting(true)
    try {
      const entries = Object.entries(decisions)
      const results = await Promise.all(
        entries.map(([id, status]) => 
          fetch(`${PAYLOAD_URL}/api/submissions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              juryStatus: status,
              reviewedAt: new Date().toISOString(),
            }),
          })
        )
      )

      if (results.every(r => r.ok)) {
        alert('Reviews submitted successfully!')
        window.location.reload()
      } else {
        throw new Error('Some submissions failed to update.')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><Loader2 className="w-10 h-10 animate-spin text-neutral-900" /></div>
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>

  const currentSubmission = filteredSubmissions[currentIndex]
  
  // 🚀 Get stats for current submission's exhibition
  const currentExhibitionId = (currentSubmission?.exhibition as Exhibition)?.id
  const liveStats = currentExhibitionId ? getLiveStats(currentExhibitionId) : { count: 0, max: 50, isFull: false }
  
  // Progress bar logic
  const currentViewAnsweredCount = filteredSubmissions.filter(s => decisions[String(s.id)]).length
  const progress = filteredSubmissions.length > 0 ? (currentViewAnsweredCount / filteredSubmissions.length) * 100 : 0

  if (showSummary) {
    return (
      <div className="min-h-screen bg-paper sans-headings p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <h1 className="text-3xl font-black text-neutral-900">Final Review</h1>
            <button onClick={() => setShowSummary(false)} className="text-sm font-bold text-ink hover:bg-fog px-4 py-2 rounded-lg">Continue Grading</button>
          </div>
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase text-gray-400">Artwork</th>
                  <th className="p-4 text-xs font-bold uppercase text-gray-400 text-center">Decision</th>
                  <th className="p-4 text-xs font-bold uppercase text-gray-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((s, idx) => ( // Use filteredSubmissions here
                  <tr key={s.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                    <td className="p-4 flex items-center gap-4">
                      <span className="text-xs font-bold text-neutral-300 w-4">{idx + 1}</span>
                      <span className="font-semibold text-neutral-800">{(s.artwork as Artwork)?.title}</span>
                    </td>
                    <td className="p-4 text-center">
                      {decisions[String(s.id)] ? (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${decisions[String(s.id)] === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {decisions[String(s.id)]}
                        </span>
                      ) : <span className="text-neutral-300 text-xs italic">Pending</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setCurrentIndex(idx); setShowSummary(false); }} className="text-ink font-bold text-sm hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-12">
            <button onClick={submitAllReviews} disabled={isSubmitting} className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="w-6 h-6" />} Submit
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Handle empty state if filter returns nothing
  if (!currentSubmission) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">No submissions found in this category.</p>
        <button onClick={() => setSelectedExhibitionFilter('all')} className="mt-4 text-ink font-bold">View All</button>
      </div>
    </div>
  )

  const artwork = currentSubmission.artwork as Artwork

  return (
    <div className="min-h-screen bg-paper sans-headings flex">
      {/* Sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-neutral-200 flex-col sticky top-0 h-screen z-20">
        <div className="p-8 font-black text-xl tracking-tighter border-b flex items-center gap-2">
          <Check className="w-6 h-6 text-green-600" /> JURY ROOM
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto">
          <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filters</div>
          <button 
            onClick={() => setSelectedExhibitionFilter('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedExhibitionFilter === 'all' ? 'bg-neutral-900 text-white shadow-lg' : 'text-gray-600 hover:bg-neutral-100'}`}
          >
            <LayoutGrid className="w-5 h-5" /> All Submissions
          </button>
          {uniqueExhibitions.length > 0 && (
            <>
              <div className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-2">Exhibitions</div>
              {uniqueExhibitions.map(ex => (
                <button 
                  key={ex.id}
                  onClick={() => setSelectedExhibitionFilter(String(ex.id))}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all group ${selectedExhibitionFilter === String(ex.id) ? 'bg-white border-2 border-neutral-900 shadow-md' : 'text-gray-600 hover:bg-neutral-100 border-2 border-transparent'}`}
                >
                  <div className={`font-bold mb-0.5 ${selectedExhibitionFilter === String(ex.id) ? 'text-neutral-900' : 'text-gray-700'}`}>{ex.title}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-500">
                    <Building className="w-3 h-3" /> {ex.galleryName}
                  </div>
                </button>
              ))}
            </>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-lg font-black tracking-tighter">JURY PANEL</h1>
              <div className="flex items-center gap-3">
                <div className="w-32 md:w-64 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-neutral-900" animate={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] font-black text-neutral-400">{currentViewAnsweredCount} / {filteredSubmissions.length}</span>
              </div>
            </div>
            
            {/* 🚀 Capacity Indicator */}
            {currentExhibitionId && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                liveStats.isFull ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {liveStats.isFull ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                <span>Selected: {liveStats.count} / {liveStats.max}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button onClick={() => setShowSummary(true)} className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-full text-xs font-black hover:bg-neutral-800 shadow-lg">
                <ListFilter className="w-3 h-3" /> REVIEW
              </button>
              {onBack && (
                <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2 text-neutral-500 hover:text-neutral-900 rounded-full text-xs font-bold transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
                </button>
              )}
              {onLogout && (
                <button onClick={onLogout} className="flex items-center gap-1.5 px-4 py-2 text-neutral-400 hover:text-neutral-900 rounded-full text-xs font-bold transition-colors">
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image */}
          <div className="space-y-6">
            <div className="aspect-[1/1.414] bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden relative group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSubmission.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  {isMedia(artwork.image) ? (
                    <img src={`${PAYLOAD_URL}${artwork.image.url}`} className="w-full h-full object-contain p-6" alt={artwork.title} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                      <Maximize2 className="w-12 h-12 mb-2" />
                      <p className="text-xs font-bold">IMAGE NOT AVAILABLE</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              {decisions[String(currentSubmission.id)] && (
                <div className={`absolute top-8 left-8 px-6 py-2 rounded-xl text-white font-black shadow-2xl z-10 scale-110 border-2 border-white/20 ${decisions[String(currentSubmission.id)] === 'accepted' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {decisions[String(currentSubmission.id)].toUpperCase()}
                </div>
              )}
            </div>
            {/* Nav */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
              <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="p-3 hover:bg-neutral-50 rounded-full disabled:opacity-10 text-neutral-900"><ChevronLeft className="w-8 h-8" /></button>
              <div className="text-center">
                <span className="text-xs font-black text-neutral-300 block mb-1 uppercase tracking-widest">Artwork</span>
                <span className="text-xl font-black text-neutral-900">{currentIndex + 1} of {filteredSubmissions.length}</span>
              </div>
              <button onClick={() => setCurrentIndex(prev => Math.min(filteredSubmissions.length - 1, prev + 1))} disabled={currentIndex === filteredSubmissions.length - 1} className="p-3 hover:bg-neutral-50 rounded-full disabled:opacity-10 text-neutral-900"><ChevronRight className="w-8 h-8" /></button>
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <header className="mb-10">
                <h2 className="text-5xl font-black text-neutral-900 tracking-tighter leading-none mb-4 uppercase">{artwork.title || 'Untitled'}</h2>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-600"><User className="w-3 h-3" /> {(currentSubmission.artist as PayloadUser).name}</span>
                  <span className="flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-600"><Calendar className="w-3 h-3" /> {artwork.year}</span>
                </div>
              </header>
              <div className="grid grid-cols-2 gap-4 mb-10">
                <DetailBox icon={Palette} label="Medium" value={artwork.medium || 'N/A'} />
                <DetailBox icon={Tag} label="Category" value={artwork.category?.replace('_', ' ') || 'N/A'} />
                <DetailBox icon={Ruler} label="Dimensions" value={artwork.dimensionsDisplay || 'N/A'} />
                <DetailBox icon={DollarSign} label="Price" value={artwork.price ? `$${artwork.price}` : 'N/A'} />
              </div>
              <section className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-6">Artist Statement</h3>
                <p className="text-lg text-neutral-700 leading-relaxed font-serif italic line-clamp-6">"{artwork.description || 'No statement provided.'}"</p>
              </section>
            </div>

            {/* 🚀 Action Buttons with Blocking Logic */}
            <div className="mt-12 flex gap-6">
              <button
                onClick={() => makeDecision(currentSubmission.id, 'rejected')}
                className={`flex-1 py-8 rounded-3xl border-4 transition-all flex flex-col items-center gap-2 group ${
                  decisions[String(currentSubmission.id)] === 'rejected' 
                  ? 'bg-red-500 border-red-200 text-white shadow-inner scale-[0.98]' 
                  : 'bg-white border-neutral-100 text-red-500 hover:border-red-500 hover:shadow-2xl'
                }`}
              >
                <X className={`w-10 h-10 transition-transform ${decisions[String(currentSubmission.id)] !== 'rejected' && 'group-hover:scale-125'}`} />
                <span className="font-black text-xs uppercase tracking-widest">REJECT</span>
              </button>

              <button
                onClick={() => makeDecision(currentSubmission.id, 'accepted')}
                // 🛑 Block accept if full, BUT allow changing mind if already accepted
                disabled={liveStats.isFull && decisions[String(currentSubmission.id)] !== 'accepted'}
                className={`flex-1 py-8 rounded-3xl border-4 transition-all flex flex-col items-center gap-2 group ${
                  liveStats.isFull && decisions[String(currentSubmission.id)] !== 'accepted'
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50' // Disabled State
                    : decisions[String(currentSubmission.id)] === 'accepted' 
                    ? 'bg-green-500 border-green-200 text-white shadow-inner scale-[0.98]' 
                    : 'bg-white border-neutral-100 text-green-500 hover:border-green-500 hover:shadow-2xl'
                }`}
              >
                {liveStats.isFull && decisions[String(currentSubmission.id)] !== 'accepted' ? (
                  <>
                    <AlertCircle className="w-10 h-10" />
                    <span className="font-black text-xs uppercase tracking-widest">LIMIT REACHED</span>
                  </>
                ) : (
                  <>
                    <Check className={`w-10 h-10 transition-transform ${decisions[String(currentSubmission.id)] !== 'accepted' && 'group-hover:scale-125'}`} />
                    <span className="font-black text-xs uppercase tracking-widest">ACCEPT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailBox({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 mb-1 uppercase tracking-widest">
        <Icon className="w-3 h-3" /> <span>{label}</span>
      </div>
      <div className="font-bold text-neutral-900 truncate">{value}</div>
    </div>
  )
}