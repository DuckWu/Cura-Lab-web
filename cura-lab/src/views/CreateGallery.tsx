// src/views/CreateGallery.tsx
import { useState, useEffect } from 'react'
import { 
  Building, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Upload, 
  Loader2, 
  ArrowLeft,
  AlertCircle,
  X 
} from 'lucide-react'
import type { User } from '../../../payload-project/src/payload-types'
// 1. 引入压缩库
import imageCompression from 'browser-image-compression'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

type CreateGalleryProps = {
  currentUser: User | null
  onBack: () => void
  onSuccess: () => void
}

export default function CreateGallery({ currentUser, onBack, onSuccess }: CreateGalleryProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    bio: '',
    email: '',
    phone: '',
    website: '',
    commissionRate: 0,
  })

  // Logo 图片状态
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  // 2. 压缩状态
  const [compressing, setCompressing] = useState(false)

  // 处理图片选择 (带压缩)
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }

    setCompressing(true)
    setError(null)

    try {
      console.log(`Original Logo size: ${file.size / 1024 / 1024} MB`)

      // 3. Logo 专用压缩配置 (比艺术品更小)
      const options = {
        maxSizeMB: 0.5,          // Logo 限制在 0.5MB 以内
        maxWidthOrHeight: 800,   // 尺寸限制在 800px，足够清晰了
        useWebWorker: true,
        fileType: file.type
      }

      const compressedFile = await imageCompression(file, options)
      console.log(`Compressed Logo size: ${compressedFile.size / 1024 / 1024} MB`)

      setLogoFile(compressedFile)
      
      // 使用 URL.createObjectURL 预览
      const previewUrl = URL.createObjectURL(compressedFile)
      setLogoPreview(previewUrl)

    } catch (err) {
      console.error('Compression error:', err)
      setError('Failed to process image. Please try another one.')
    } finally {
      setCompressing(false)
    }
  }

  // 清理预览 URL
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (compressing) return // 防止还在压缩时提交

    setLoading(true)
    setError(null)

    try {
      let logoId = null

      // 1. 上传 Logo (使用压缩后的 logoFile)
      if (logoFile) {
        const formDataMedia = new FormData()
        formDataMedia.append('file', logoFile)

        const mediaResponse = await fetch(`${PAYLOAD_URL}/api/media`, {
          method: 'POST',
          credentials: 'include',
          body: formDataMedia,
        })

        if (!mediaResponse.ok) {
          const errData = await mediaResponse.json().catch(() => null)
          throw new Error(errData?.errors?.[0]?.message || 'Failed to upload logo')
        }
        
        const mediaData = await mediaResponse.json()
        logoId = mediaData.doc.id
      }

      // 2. 创建 Gallery 数据
      const galleryPayload = {
        name: formData.name,
        location: formData.location,
        bio: formData.bio,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        commissionRate: Number(formData.commissionRate),
        owner: currentUser?.id, 
        status: 'published',
        ...(logoId && { logo: logoId }),
      }

      const response = await fetch(`${PAYLOAD_URL}/api/galleries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(galleryPayload),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.errors?.[0]?.message || 'Failed to create gallery')
      }

      onSuccess()

    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 p-6 flex justify-center">
      <div className="w-full max-w-3xl">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-gray-600 hover:text-neutral-900 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
          <div className="p-8 border-b border-neutral-100 bg-neutral-50">
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
              <Building className="w-8 h-8 text-blue-600" />
              Create Your Gallery Profile
            </h1>
            <p className="text-gray-600 mt-2">
              Set up your gallery's presence. This information will be visible to artists and visitors.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* --- Logo Upload Section --- */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Gallery Logo</label>
              <div className="flex items-center gap-6">
                <div className={`relative w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 transition-colors ${
                  logoPreview ? 'border-blue-500' : 'border-gray-300'
                }`}>
                  {logoPreview ? (
                    <>
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        className={`w-full h-full object-cover transition-opacity ${compressing ? 'opacity-50' : 'opacity-100'}`} 
                      />
                      
                      {/* 压缩 Loading 指示器 */}
                      {compressing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}

                      {!compressing && (
                        <button 
                          type="button"
                          onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                          className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-red-50"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                      {compressing ? (
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoChange} 
                        disabled={compressing}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    {compressing ? 'Optimizing image...' : 'Upload Gallery Logo'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Recommended: 400x400px. <br/>
                    Will be auto-compressed to &lt;500KB.
                  </p>
                </div>
              </div>
            </div>

            {/* --- Basic Info --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Gallery Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Modern Art Space"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    required
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="City, Country"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Bio / Description</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell us about your gallery..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* --- Contact Info --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={e => setFormData({...formData, website: e.target.value})}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="contact@gallery.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Commission Rate (%)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={e => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* --- Actions --- */}
            <div className="pt-6 border-t border-neutral-100 flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || compressing} // 压缩时也禁用提交
                className="flex-1 px-6 py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : compressing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Compressing Logo...
                  </>
                ) : (
                  'Create Gallery'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}