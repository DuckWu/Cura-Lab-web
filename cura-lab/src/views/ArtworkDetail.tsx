// src/views/ArtworkDetail.tsx
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Ruler,
  Calendar,
  Package,
  Save,
  X
} from 'lucide-react'
import type { User, Artwork, Media } from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type ArtworkDetailProps = {
  artworkId: number
  currentUser: User | null
  onBack: () => void
}

export default function ArtworkDetail({
  artworkId,
  onBack
}: ArtworkDetailProps) {
  const [artwork, setArtwork] = useState<Artwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchArtwork() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `${PAYLOAD_URL}/api/artworks/${artworkId}?depth=2`,
          { credentials: 'include' }
        )

        if (response.ok) {
          const data = await response.json()
          setArtwork(data)
          
          // 🔧 正确初始化编辑表单
          setEditForm({
            title: data.title,
            description: data.description,
            medium: data.medium,
            year: data.year,
            price: data.price,
            sale_status: data.sale_status,
            edition: data.edition,
            category: data.category,
            // 🔧 正确处理 dimensions group
            dimensions: {
              width: data.dimensions?.width || '',
              height: data.dimensions?.height || '',
              depth: data.dimensions?.depth || '',
              unit: data.dimensions?.unit || 'in',
            },
          })
        } else {
          throw new Error('Failed to fetch artwork')
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchArtwork()
  }, [artworkId])

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch(
        `${PAYLOAD_URL}/api/artworks/${artworkId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(editForm),
        }
      )

      if (response.ok) {
        const updated = await response.json()
        setArtwork(updated)
        setIsEditing(false)
        alert('Artwork updated successfully!')
      } else {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update artwork')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update artwork')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this artwork? This action cannot be undone.'
    )

    if (!confirmed) return

    setDeleting(true)

    try {
      const response = await fetch(
        `${PAYLOAD_URL}/api/artworks/${artworkId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (response.ok) {
        alert('Artwork deleted successfully!')
        onBack()
      } else {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete artwork')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete artwork')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-900 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading artwork...</p>
        </div>
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-neutral-200">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Error Loading Artwork</h2>
          <p className="text-gray-600 mb-6">{error || 'Artwork not found'}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // 🔧 格式化 dimensions 显示
  const dimensionsDisplay = artwork.dimensionsDisplay || 
    (artwork.dimensions 
      ? `${artwork.dimensions.width} × ${artwork.dimensions.height}${artwork.dimensions.depth ? ` × ${artwork.dimensions.depth}` : ''} ${artwork.dimensions.unit}`
      : 'N/A')

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Artworks</span>
            </button>

            <div className="flex items-center gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      // 重置表单
                      setEditForm({
                        title: artwork.title,
                        description: artwork.description,
                        medium: artwork.medium,
                        year: artwork.year,
                        price: artwork.price,
                        sale_status: artwork.sale_status,
                        edition: artwork.edition,
                        category: artwork.category,
                        dimensions: {
                          width: artwork.dimensions?.width || '',
                          height: artwork.dimensions?.height || '',
                          depth: artwork.dimensions?.depth || '',
                          unit: artwork.dimensions?.unit || 'in',
                        },
                      })
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
            <div className="aspect-square bg-neutral-100 relative">
              {isMedia(artwork.image) ? (
                <img
                  src={`${PAYLOAD_URL}${artwork.image.url!}`}
                  alt={artwork.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-24 h-24 text-neutral-300" />
                </div>
              )}

              {/* Sale Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
                  artwork.sale_status === 'for_sale'
                    ? 'bg-green-500 text-white'
                    : artwork.sale_status === 'sold'
                    ? 'bg-blue-500 text-white'
                    : 'bg-neutral-500 text-white'
                }`}>
                  {artwork.sale_status?.replace('_', ' ').toUpperCase() || 'NOT FOR SALE'}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-8">
            {!isEditing ? (
              <>
                {/* Title */}
                <div>
                  <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                    {artwork.title}
                  </h1>
                  {artwork.year && (
                    <p className="text-lg text-neutral-600">{artwork.year}</p>
                  )}
                </div>

                {/* Description */}
                {artwork.description && (
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-2">
                      Description
                    </h2>
                    <p className="text-neutral-700 leading-relaxed">
                      {artwork.description}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {artwork.category && (
                    <DetailItem
                      icon={Tag}
                      label="Category"
                      value={artwork.category.replace('_', ' ').toUpperCase()}
                    />
                  )}
                  {artwork.medium && (
                    <DetailItem
                      icon={Tag}
                      label="Medium"
                      value={artwork.medium}
                    />
                  )}
                  {dimensionsDisplay !== 'N/A' && (
                    <DetailItem
                      icon={Ruler}
                      label="Dimensions"
                      value={dimensionsDisplay}
                    />
                  )}
                  {artwork.price && (
                    <DetailItem
                      icon={DollarSign}
                      label="Price"
                      value={`$${artwork.price}`}
                    />
                  )}
                  {artwork.edition && (
                    <DetailItem
                      icon={Package}
                      label="Edition"
                      value={artwork.edition}
                    />
                  )}
                </div>

                {/* Metadata */}
                <div className="pt-6 border-t border-neutral-200">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar className="w-4 h-4" />
                    <span>Created on {formatDate(artwork.createdAt)}</span>
                  </div>
                </div>
              </>
            ) : (
              /* Edit Form */
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Category *
                  </label>
                  <select
                    value={editForm.category || 'painting'}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="painting">Painting</option>
                    <option value="sculpture">Sculpture</option>
                    <option value="photography">Photography</option>
                    <option value="digital">Digital Art</option>
                    <option value="mixed_media">Mixed Media</option>
                    <option value="print">Print</option>
                    <option value="drawing">Drawing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Medium
                    </label>
                    <input
                      type="text"
                      value={editForm.medium || ''}
                      onChange={(e) => setEditForm({ ...editForm, medium: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      value={editForm.year || ''}
                      onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                {/* 🔧 Dimensions 编辑 */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Dimensions *
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.dimensions?.width || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        dimensions: { ...editForm.dimensions, width: parseFloat(e.target.value) }
                      })}
                      placeholder="Width"
                      className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.dimensions?.height || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        dimensions: { ...editForm.dimensions, height: parseFloat(e.target.value) }
                      })}
                      placeholder="Height"
                      className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.dimensions?.depth || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        dimensions: { ...editForm.dimensions, depth: e.target.value ? parseFloat(e.target.value) : undefined }
                      })}
                      placeholder="Depth"
                      className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <select
                      value={editForm.dimensions?.unit || 'in'}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        dimensions: { ...editForm.dimensions, unit: e.target.value }
                      })}
                      className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="in">Inches</option>
                      <option value="cm">CM</option>
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Width × Height × Depth (optional)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={editForm.price || ''}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Sale Status
                    </label>
                    <select
                      value={editForm.sale_status || 'not_for_sale'}
                      onChange={(e) => setEditForm({ ...editForm, sale_status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="not_for_sale">Not For Sale</option>
                      <option value="for_sale">For Sale</option>
                      <option value="pending">Sale Pending</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Edition
                  </label>
                  <input
                    type="text"
                    value={editForm.edition || ''}
                    onChange={(e) => setEditForm({ ...editForm, edition: e.target.value })}
                    placeholder="e.g., 1/100"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
            )}
          </div>
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
    <div>
      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold text-neutral-900">{value}</div>
    </div>
  )
}