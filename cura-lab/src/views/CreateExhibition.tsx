// src/views/CreateExhibition.tsx
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Upload,
  Loader2,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Award
} from 'lucide-react'
import type { User, Gallery } from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

type CreateExhibitionProps = {
  currentUser: User | null
  exhibitionId?: number // 如果有 ID 就是编辑模式
  onBack: () => void
  onSuccess: () => void
}

export default function CreateExhibition({ currentUser, exhibitionId, onBack, onSuccess }: CreateExhibitionProps) {
  const isEditMode = !!exhibitionId

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    submission_deadline: '',
    submission_fee: '',
    max_selected: '',
    platformFeePercentage: '10',
    exhibitionStatus: 'open',
    status: 'draft',
  })

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [myGallery, setMyGallery] = useState<Gallery | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchingGallery, setFetchingGallery] = useState(true)

  // 获取我的画廊
  useEffect(() => {
    async function fetchMyGallery() {
      if (!currentUser) return

      try {
        const response = await fetch(
          `${PAYLOAD_URL}/api/galleries?where[owner][equals]=${currentUser.id}&limit=1`,
          { credentials: 'include' }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.docs && data.docs.length > 0) {
            setMyGallery(data.docs[0])
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFetchingGallery(false)
      }
    }

    fetchMyGallery()
  }, [currentUser])

  // 如果是编辑模式，获取展览数据
  useEffect(() => {
    async function fetchExhibition() {
      if (!exhibitionId) return

      try {
        setLoading(true)
        const response = await fetch(
          `${PAYLOAD_URL}/api/exhibitions/${exhibitionId}?depth=1`,
          { credentials: 'include' }
        )

        if (response.ok) {
          const data = await response.json()
          
          setFormData({
            title: data.title || '',
            description: data.description || '',
            start_date: data.start_date ? data.start_date.split('T')[0] : '',
            end_date: data.end_date ? data.end_date.split('T')[0] : '',
            submission_deadline: data.submission_deadline ? data.submission_deadline.split('T')[0] : '',
            submission_fee: data.submission_fee?.toString() || '',
            max_selected: data.max_selected?.toString() || '',
            platformFeePercentage: data.platformFeePercentage?.toString() || '10',
            exhibitionStatus: data.exhibitionStatus || 'open',
            status: data.status || 'draft',
          })

          // 如果有封面图，设置预览
          if (data.cover_image && typeof data.cover_image === 'object') {
            setCoverImagePreview(`${PAYLOAD_URL}${data.cover_image.url}`)
          }
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load exhibition data')
      } finally {
        setLoading(false)
      }
    }

    fetchExhibition()
  }, [exhibitionId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!myGallery) {
      setError('You need to create a gallery first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let coverImageId = null

      // 如果上传了新图片
      if (coverImageFile) {
        const formDataMedia = new FormData()
        formDataMedia.append('file', coverImageFile)

        const mediaResponse = await fetch(`${PAYLOAD_URL}/api/media`, {
          method: 'POST',
          credentials: 'include',
          body: formDataMedia,
        })

        if (!mediaResponse.ok) {
          throw new Error('Failed to upload cover image')
        }

        const mediaData = await mediaResponse.json()
        coverImageId = mediaData.doc?.id || mediaData.id
      }

      // 创建或更新展览
      const exhibitionData: any = {
        title: formData.title,
        description: formData.description,
        gallery: myGallery.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        submission_deadline: formData.submission_deadline,
        submission_fee: parseFloat(formData.submission_fee),
        max_selected: parseInt(formData.max_selected),
        platformFeePercentage: parseFloat(formData.platformFeePercentage),
        exhibitionStatus: formData.exhibitionStatus,
        status: formData.status,
      }

      // 如果上传了新图片，添加到数据中
      if (coverImageId) {
        exhibitionData.cover_image = coverImageId
      }

      const url = isEditMode 
        ? `${PAYLOAD_URL}/api/exhibitions/${exhibitionId}`
        : `${PAYLOAD_URL}/api/exhibitions`

      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(exhibitionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save exhibition')
      }

      onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to save exhibition')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingGallery) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-neutral-900" />
      </div>
    )
  }

  if (!myGallery) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-neutral-200">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Gallery Found</h2>
          <p className="text-gray-600 mb-6">
            You need to create a gallery before creating exhibitions.
          </p>
          <button
            onClick={() => window.location.href = `${PAYLOAD_URL}/admin/collections/galleries/create`}
            className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full"
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
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-gray-600 hover:text-neutral-900 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold text-neutral-900">
            {isEditMode ? 'Edit Exhibition' : 'Create New Exhibition'}
          </h1>
          <p className="text-gray-600 mt-2">
            {myGallery.name} · {myGallery.location}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Cover Image */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-neutral-900 mb-3">
                Cover Image *
              </label>

              {coverImagePreview ? (
                <div className="relative aspect-[16/9] bg-neutral-100 rounded-2xl overflow-hidden border-2 border-neutral-200 group">
                  <img
                    src={coverImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageFile(null)
                      setCoverImagePreview(null)
                    }}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5 text-neutral-600" />
                  </button>
                </div>
              ) : (
                <label className="block aspect-[16/9] bg-white border-2 border-dashed border-neutral-300 rounded-2xl hover:border-blue-500 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required={!isEditMode}
                  />
                  <div className="w-full h-full flex flex-col items-center justify-center p-6">
                    <Upload className="w-12 h-12 text-neutral-400 mb-3 group-hover:text-blue-500 transition-colors" />
                    <p className="text-sm font-medium text-neutral-900">Upload cover image</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </label>
              )}
            </div>

            {/* Right: Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-neutral-900 mb-2">
                  Exhibition Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Summer Contemporary Art Show 2025"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-900 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe your exhibition..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-neutral-900 mb-2">
                    Start Date *
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="submission_deadline" className="block text-sm font-medium text-neutral-900 mb-2">
                    Submission Deadline *
                  </label>
                  <input
                    id="submission_deadline"
                    type="date"
                    value={formData.submission_deadline}
                    onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-neutral-900 mb-2">
                    End Date *
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Fees & Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="submission_fee" className="block text-sm font-medium text-neutral-900 mb-2">
                    Entry Fee (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="submission_fee"
                      type="number"
                      step="0.01"
                      value={formData.submission_fee}
                      onChange={(e) => setFormData({ ...formData, submission_fee: e.target.value })}
                      required
                      placeholder="35.00"
                      className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="max_selected" className="block text-sm font-medium text-neutral-900 mb-2">
                    Max Selected *
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="max_selected"
                      type="number"
                      value={formData.max_selected}
                      onChange={(e) => setFormData({ ...formData, max_selected: e.target.value })}
                      required
                      placeholder="60"
                      className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="platformFeePercentage" className="block text-sm font-medium text-neutral-900 mb-2">
                    Platform Fee (%)
                  </label>
                  <input
                    id="platformFeePercentage"
                    type="number"
                    step="0.1"
                    value={formData.platformFeePercentage}
                    onChange={(e) => setFormData({ ...formData, platformFeePercentage: e.target.value })}
                    placeholder="10"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="exhibitionStatus" className="block text-sm font-medium text-neutral-900 mb-2">
                    Exhibition Status
                  </label>
                  <select
                    id="exhibitionStatus"
                    value={formData.exhibitionStatus}
                    onChange={(e) => setFormData({ ...formData, exhibitionStatus: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="open">Open for Submissions</option>
                    <option value="jury_review">In Jury Review</option>
                    <option value="finalized">Finalized</option>
                    <option value="on_display">On Display</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-neutral-900 mb-2">
                    Publish Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-900 font-semibold rounded-full hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {isEditMode ? 'Update Exhibition' : 'Create Exhibition'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}