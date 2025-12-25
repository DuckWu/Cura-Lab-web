// src/views/CreateArtwork.tsx
import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Upload, 
  Loader2, 
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import type { User } from '../../../payload-project/src/payload-types'
// 1. 引入压缩库
import imageCompression from 'browser-image-compression'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

type CreateArtworkProps = {
  currentUser: User | null
  onBack: () => void
  onSuccess: () => void
}

export default function CreateArtwork({ currentUser, onBack, onSuccess }: CreateArtworkProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    medium: '',
    year: new Date().getFullYear(),
    category: 'painting',
    price: '',
    sale_status: 'not_for_sale',
    width: '',
    height: '',
    depth: '',
    unit: 'in',
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // 2. 新增压缩状态，防止压缩还没完成就提交
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // 3. 改进后的图片处理函数
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 如果文件不是图片，直接报错
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }

    setCompressing(true)
    setError(null)

    try {
      console.log(`Original size: ${file.size / 1024 / 1024} MB`)

      // 4. 配置压缩选项
      const options = {
        maxSizeMB: 1,          // 限制最大为 1MB (Vercel 限制通常是 4.5MB，留足余量)
        maxWidthOrHeight: 1920, // 限制最大宽高，适合网页展示
        useWebWorker: true,     // 使用多线程防止页面卡顿
        fileType: file.type     // 保持原格式
      }

      // 执行压缩
      const compressedFile = await imageCompression(file, options)
      
      console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`)

      setImageFile(compressedFile)
      
      // 使用更高效的方式生成预览
      const previewUrl = URL.createObjectURL(compressedFile)
      setImagePreview(previewUrl)

    } catch (err) {
      console.error('Compression error:', err)
      setError('Failed to compress image. Please try a different file.')
    } finally {
      setCompressing(false)
    }
  }

  // 清理预览 URL 以防内存泄漏
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!imageFile) {
      setError('Please upload an image')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Upload image to Media collection
      setUploadProgress(30)
      const formDataMedia = new FormData()
      formDataMedia.append('file', imageFile)
      
      const mediaResponse = await fetch(`${PAYLOAD_URL}/api/media`, {
        method: 'POST',
        credentials: 'include',
        body: formDataMedia,
      })

      if (!mediaResponse.ok) {
        // 尝试解析后端返回的详细错误
        const errData = await mediaResponse.json().catch(() => null)
        throw new Error(errData?.errors?.[0]?.message || 'Failed to upload image (File might be too large)')
      }

      const mediaData = await mediaResponse.json()
      const imageId = mediaData.doc.id

      // Step 2: Create artwork
      setUploadProgress(60)
      const artworkData = {
        title: formData.title,
        description: formData.description,
        medium: formData.medium,
        year: formData.year,
        category: formData.category,
        image: imageId,
        owner: currentUser?.id,
        price: formData.price ? parseFloat(formData.price) : undefined,
        sale_status: formData.sale_status,
        dimensions: {
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          depth: formData.depth ? parseFloat(formData.depth) : undefined,
          unit: formData.unit,
        },
        status: 'published',
      }

      const artworkResponse = await fetch(`${PAYLOAD_URL}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(artworkData),
      })

      if (!artworkResponse.ok) {
        const errorData = await artworkResponse.json()
        throw new Error(errorData.message || 'Failed to create artwork')
      }

      setUploadProgress(100)
      
      // Success!
      setTimeout(() => {
        onSuccess()
      }, 500)
    } catch (err: any) {
      console.error('Create artwork error:', err)
      setError(err.message || 'Failed to create artwork')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-gray-600 hover:text-neutral-900 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-3xl font-bold text-neutral-900">
            Create New Artwork
          </h1>
          <p className="text-gray-600 mt-2">
            Add a new piece to your portfolio
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image Upload */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <label className="block text-sm font-medium text-neutral-900 mb-3">
                  Artwork Image *
                </label>
                
                {imagePreview ? (
                  <div className="relative aspect-[3/4] bg-neutral-100 rounded-2xl overflow-hidden border-2 border-neutral-200 group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className={`w-full h-full object-cover transition-opacity ${compressing ? 'opacity-50' : 'opacity-100'}`}
                    />
                    
                    {/* 5. 压缩状态 Loading */}
                    {compressing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                        <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                        <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">Optimizing...</span>
                      </div>
                    )}

                    {!compressing && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5 text-neutral-600" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className={`block aspect-[3/4] bg-white border-2 border-dashed rounded-2xl transition-all cursor-pointer group ${compressing ? 'border-gray-200 bg-gray-50' : 'border-neutral-300 hover:border-blue-500'}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={compressing}
                      className="hidden"
                    />
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                      {compressing ? (
                        <>
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                          <p className="text-sm font-medium text-neutral-900">Processing...</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                            <Upload className="w-8 h-8 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <p className="text-sm font-medium text-neutral-900 mb-1">
                            Click to upload
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG (Auto-optimized)
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-neutral-900 mb-2">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Sunset Over Mountains"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  placeholder="Describe your artwork..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Category & Medium */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-neutral-900 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

                <div>
                  <label htmlFor="medium" className="block text-sm font-medium text-neutral-900 mb-2">
                    Medium
                  </label>
                  <input
                    id="medium"
                    type="text"
                    value={formData.medium}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                    placeholder="Oil on canvas"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Dimensions *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    required
                    placeholder="Width"
                    className="px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    required
                    placeholder="Height"
                    className="px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={formData.depth}
                    onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                    placeholder="Depth"
                    className="px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="in">Inches</option>
                    <option value="cm">CM</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Width × Height × Depth (optional)
                </p>
              </div>

              {/* Year */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-neutral-900 mb-2">
                  Year Created
                </label>
                <input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Price & Sale Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sale_status" className="block text-sm font-medium text-neutral-900 mb-2">
                    Sale Status
                  </label>
                  <select
                    id="sale_status"
                    value={formData.sale_status}
                    onChange={(e) => setFormData({ ...formData, sale_status: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="not_for_sale">Not for Sale</option>
                    <option value="for_sale">For Sale</option>
                  </select>
                </div>

                {formData.sale_status === 'for_sale' && (
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-neutral-900 mb-2">
                      Price (USD)
                    </label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="1000.00"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}
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
                  // 6. 如果正在压缩或正在提交，禁止点击
                  disabled={loading || compressing}
                  className="flex-1 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-full hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating... {uploadProgress}%
                    </>
                  ) : compressing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Create Artwork
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