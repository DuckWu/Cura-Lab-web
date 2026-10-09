// src/views/SubmitArtworkModal.tsx
import { useState, useEffect } from 'react'
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Plus,
  Trash2,
  UserCheck,
  Image as ImageIcon
} from 'lucide-react'
import type { Exhibition, User, Artwork, Media } from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

interface SubmitArtworkModalProps {
  exhibition: Exhibition
  currentUser?: User | null
  onClose: () => void
  onSuccess: () => void
}

export default function SubmitArtworkModal({ exhibition, currentUser, onClose, onSuccess }: SubmitArtworkModalProps) {
  const [myArtworks, setMyArtworks] = useState<Artwork[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🎨 署名相关 state
  const [useMyName, setUseMyName] = useState(true)
  const [additionalNames, setAdditionalNames] = useState<string[]>([])
  const [newName, setNewName] = useState('')

  const userName = currentUser?.name || currentUser?.email || ''

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return

      try {
        setLoading(true)
        setError(null)

        const artworksResponse = await fetch(
          `${PAYLOAD_URL}/api/artworks?depth=1&where[owner][equals]=${currentUser.id}&where[status][equals]=published`,
          { credentials: 'include' }
        )

        let allArtworks: Artwork[] = []
        if (artworksResponse.ok) {
          const artworksData = await artworksResponse.json()
          if (Array.isArray(artworksData.docs)) {
            allArtworks = artworksData.docs
          }
        }

        const submissionsResponse = await fetch(
          `${PAYLOAD_URL}/api/submissions?where[artist][equals]=${currentUser.id}&where[exhibition][equals]=${exhibition.id}`,
          { credentials: 'include' }
        )

        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json()
          const submittedIds = new Set(
            submissionsData.docs.map((s: any) =>
              String(typeof s.artwork === 'object' ? s.artwork.id : s.artwork)
            )
          )
          const availableArtworks = allArtworks.filter(
            art => !submittedIds.has(String(art.id))
          )
          setMyArtworks(availableArtworks)
        } else {
          setMyArtworks(allArtworks)
        }
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser, exhibition.id])

  // 计算最终署名数组
  const getDisplayArtists = (): string[] => {
    const names: string[] = []
    if (useMyName && userName) {
      names.push(userName)
    }
    names.push(...additionalNames.filter(n => n.trim()))
    return names
  }

  const handleAddName = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (additionalNames.includes(trimmed)) return
    setAdditionalNames(prev => [...prev, trimmed])
    setNewName('')
  }

  const handleRemoveName = (index: number) => {
    setAdditionalNames(prev => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddName()
    }
  }

  const handleSubmit = async () => {
    if (!selectedArtwork || !currentUser) {
      setError('Please select an artwork')
      return
    }

    const displayArtists = getDisplayArtists()
    if (displayArtists.length === 0) {
      setError('Please add at least one artist name')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${PAYLOAD_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          artist: currentUser.id,
          exhibition: exhibition.id,
          artwork: parseInt(selectedArtwork),
          displayArtists,
          juryStatus: 'pending',
          galleryStatus: 'pending',
          paymentStatus: 'pending',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        let errorMessage = 'Failed to submit artwork'
        if (errorData.message) errorMessage = errorData.message
        else if (errorData.errors?.[0]?.message) errorMessage = errorData.errors[0].message
        throw new Error(errorMessage)
      }

      onSuccess()
    } catch (err: any) {
      console.error('Submission failed:', err)
      setError(err.message || 'Failed to submit artwork')
    } finally {
      setSubmitting(false)
    }
  }

  const displayArtists = getDisplayArtists()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Submit Your Artwork</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Select an artwork to submit to {exhibition.title}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Submission Failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
          ) : myArtworks.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Available Artworks</h3>
              <p className="text-neutral-600 mb-6">
                You have already submitted all your artworks to this exhibition, or you don't have any published artworks yet.
              </p>
              <button onClick={onClose} className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all">
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Step 1: Select Artwork */}
              <div>
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">
                  1. Select Artwork
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {myArtworks.map((artwork) => (
                    <button
                      key={artwork.id}
                      onClick={() => setSelectedArtwork(String(artwork.id))}
                      disabled={submitting}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-4 transition-all disabled:cursor-not-allowed ${
                        selectedArtwork === String(artwork.id)
                          ? 'border-ink shadow-xl scale-[0.98]'
                          : 'border-transparent hover:border-neutral-300 hover:shadow-lg'
                      }`}
                    >
                      {isMedia(artwork.image) ? (
                        <img
                          src={`${PAYLOAD_URL}${artwork.image.url!}`}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-neutral-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h4 className="text-white font-semibold text-xs line-clamp-2">{artwork.title}</h4>
                        </div>
                      </div>
                      {selectedArtwork === String(artwork.id) && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-ink rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Artist Credit */}
              <div>
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">
                  2. Artist Credit (for exhibition tags)
                </h3>

                <div className="bg-neutral-50 rounded-xl p-5 space-y-4">
                  {/* Use my name toggle */}
                  <button
                    type="button"
                    onClick={() => setUseMyName(!useMyName)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      useMyName
                        ? 'border-ink bg-fog'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className={`w-5 h-5 ${useMyName ? 'text-ink' : 'text-neutral-400'}`} />
                      <div className="text-left">
                        <div className="font-semibold text-neutral-900 text-sm">Use my name</div>
                        <div className="text-xs text-neutral-500">{userName}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      useMyName ? 'bg-ink border-ink' : 'border-neutral-300'
                    }`}>
                      {useMyName && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>

                  {/* Additional names */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {useMyName ? 'Add collaborators (optional)' : 'Artist name(s) *'}
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter artist name..."
                        className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ink/30 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddName}
                        disabled={!newName.trim()}
                        className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>

                    {additionalNames.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {additionalNames.map((name, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-200 rounded-lg"
                          >
                            <span className="text-sm font-medium text-neutral-800">{name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveName(index)}
                              className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  {displayArtists.length > 0 && (
                    <div className="pt-3 border-t border-neutral-200">
                      <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                        Tag preview
                      </div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {displayArtists.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {myArtworks.length > 0 && (
          <div className="p-6 border-t border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-neutral-600">Entry Fee</div>
                <div className="text-2xl font-bold text-neutral-900">
                  ${exhibition.submission_fee || 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-600">Credit</div>
                <div className="text-sm font-bold text-neutral-800 max-w-[200px] truncate">
                  {displayArtists.length > 0 ? displayArtists.join(', ') : 'No name set'}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-full hover:bg-neutral-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedArtwork || submitting || displayArtists.length === 0}
                className="flex-1 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit & Pay
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}