import { useState, useEffect, useRef } from 'react'
import { 
  Palette, 
  Gavel, 
  Building, 
  Calendar, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  Zap,
  Wand2,
  Upload,
  Users,
  Award,
  Eye,
  X,
  Check
} from 'lucide-react'
import type { Exhibition, Media } from '../../../payload-project/src/payload-types'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL
import art1 from '../assets/artworks/art1.jpg'
import art2 from '../assets/artworks/art2.jpg'
import art3 from '../assets/artworks/art3.jpg'
import art4 from '../assets/artworks/art4.jpg'
import art5 from '../assets/artworks/art5.jpg'
import art6 from '../assets/artworks/art6.jpg'
import art7 from '../assets/artworks/art7.jpg'
import art8 from '../assets/artworks/art8.jpg'
import art9 from '../assets/artworks/art9.jpg'
function isMedia(img: string | number | Media | null | undefined): img is Media {
  return typeof img === 'object' && img !== null && 'url' in img
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type LandingProps = {
  onBrowse: () => void
  onArtistPortal: () => void
}

export default function Landing({ onBrowse, onArtistPortal }: LandingProps) {
  return (
    <main className="overflow-hidden bg-gallery-lighter">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-white to-gallery-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gallery-line shadow-sm">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gallery-black">
                  Platform for modern galleries
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gallery-black tracking-tight leading-[1.1]">
                The modern way to{' '}
                <span className="text-primary-500">curate</span>{' '}
                exhibitions.
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Manage artists, submissions, and jurors — all in one elegant platform.
              </p>

             <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {/* Get Started - 黑底白字 */}
                <button
                  onClick={onArtistPortal}
                  className="group px-8 py-4 text-base font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] inline-flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                {/* Browse Exhibitions - 白底黑字黑边框 */}
                <button
                  onClick={onBrowse}
                  className="group px-8 py-4 text-base font-semibold text-neutral-900 bg-white border-2 border-neutral-900 hover:border-blue-500 rounded-full transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] inline-flex items-center justify-center gap-2"
                >
                  Browse Exhibitions
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right: 3D Gallery Space */}
            <div className="relative lg:block hidden">
              <GallerySpace3D />
            </div>
          </div>
        </div>
      </section>

      {/* 保留其他 sections... */}
      {/* Core Value Props */}
      <section className="py-24 bg-white border-y border-gallery-line">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gallery-black mb-4">
              Everything you need to run exhibitions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed for the modern art world
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueCard
              icon={Palette}
              title="Curate with Confidence"
              description="Manage exhibitions, submissions, and artist calls in one workspace. No spreadsheets, no chaos."
              color="primary"
            />
            <ValueCard
              icon={Zap}
              title="Streamlined Review"
              description="Let jurors review and vote seamlessly with our intuitive swipe interface. Fast, fair, efficient."
              color="accent"
            />
            <ValueCard
              icon={Wand2}
              title="Artist-Friendly"
              description="Beautiful dashboards for artists to track submissions and sales. A portfolio they'll love."
              color="success"
            />
          </div>
        </div>
      </section>

      {/* For Artists Section */}
      <section className="py-32 bg-gallery-lighter">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 bg-primary-500/10 text-primary-500 text-sm font-semibold rounded-full">
                For Artists
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold text-gallery-black tracking-tight">
                Your portfolio,{' '}
                <span className="text-primary-500">elevated</span>
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Track every submission, manage your artworks, and get discovered by galleries worldwide.
              </p>

              <ul className="space-y-4 pt-4">
                {[
                  'Real-time submission status tracking',
                  'Centralized portfolio management',
                  'Direct exhibition discovery',
                  'Simple submission process'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onArtistPortal}
                className="group inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-primary-500 hover:text-primary-600 transition-colors mt-4"
              >
                Explore Artist Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* For Galleries Section */}
      <section className="py-32 bg-white border-y border-gallery-line">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <JuryInterfaceMockup />

            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-block px-3 py-1 bg-accent-500/10 text-accent-500 text-sm font-semibold rounded-full">
                For Galleries
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold text-gallery-black tracking-tight">
                Powerful curation,{' '}
                <span className="text-accent-500">simplified</span>
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                From open calls to final selection, manage your entire exhibition workflow in one place.
              </p>

              <ul className="space-y-4 pt-4">
                {[
                  'Tinder-style jury review interface',
                  'Automated submission management',
                  'Exhibition timeline tracking',
                  'Integrated analytics'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 bg-accent-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-accent-500" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="group inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-accent-500 hover:text-accent-600 transition-colors mt-4">
                See Gallery Features
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gallery-lighter">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-gallery-black mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Launch your exhibition in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-accent-200 to-success/20"></div>

            {[
              {
                number: '01',
                title: 'Create a Call for Art',
                desc: 'Set up your exhibition details, deadlines, and submission requirements in minutes.',
                icon: Upload,
                color: 'primary'
              },
              {
                number: '02',
                title: 'Invite Jurors',
                desc: 'Add your jury panel and let them review submissions independently with our swipe interface.',
                icon: Users,
                color: 'accent'
              },
              {
                number: '03',
                title: 'Publish the Exhibition',
                desc: 'Finalize your selection, notify artists, and showcase the chosen artworks to the world.',
                icon: Award,
                color: 'success'
              }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-6 font-bold text-white ${
                  step.color === 'primary' ? 'bg-primary-500' :
                  step.color === 'accent' ? 'bg-accent-500' :
                  'bg-success'
                }`}>
                  {step.number}
                </div>

                <div className="mb-6">
                  <div className="w-16 h-16 bg-white rounded-2xl border border-gallery-line flex items-center justify-center">
                    <step.icon className={`w-8 h-8 ${
                      step.color === 'primary' ? 'text-primary-500' :
                      step.color === 'accent' ? 'text-accent-500' :
                      'text-success'
                    }`} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gallery-black mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Exhibitions */}
      <section className="py-24 bg-white border-y border-gallery-line">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gallery-black mb-3">
                Open Calls
              </h2>
              <p className="text-lg text-gray-600">
                Current opportunities for artists
              </p>
            </div>
            <button 
              onClick={onBrowse}
              className="hidden sm:flex items-center gap-2 text-gallery-black font-medium hover:gap-3 transition-all group"
            >
              View All
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <FeaturedExhibitionGrid onCardClick={onBrowse} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 bg-gallery-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Start curating your next exhibition today
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join galleries and artists who are reimagining how exhibitions work.
          </p>
          
          <button
            onClick={onArtistPortal}
            className="group inline-flex items-center gap-2 px-10 py-5 text-lg font-semibold text-neutral-900 bg-white hover:bg-neutral-100 rounded-full transition-all transform hover:scale-105 shadow-2xl"
          >
            Get Started
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </main>
  )
}

/**
 * 3D Gallery Space Component
 */
function GallerySpace3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const artworks = [art1, art2, art3, art4, art5, art6, art7, art8, art9]

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const cards = container.querySelectorAll('.gallery-frame')
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5

      cards.forEach((card, i) => {
        const element = card as HTMLElement
        const depth = (i % 3) + 1
        const moveX = x * (depth * 15)
        const moveY = y * (depth * 15)
        
        element.style.transform = `translate(${moveX}px, ${moveY}px)`
      })
    }

    const handleMouseLeave = () => {
      console.log('Mouse left!') // 调试用
      cards.forEach((card) => {
        const element = card as HTMLElement
        element.style.transform = 'translate(0px, 0px)'
      })
    }

    // 🔧 关键：同时监听两个元素
    const innerContainer = container.querySelector('.absolute.inset-0') as HTMLElement
    
    if (innerContainer) {
      innerContainer.addEventListener('mousemove', handleMouseMove)
      innerContainer.addEventListener('mouseleave', handleMouseLeave)
      
      return () => {
        innerContainer.removeEventListener('mousemove', handleMouseMove)
        innerContainer.removeEventListener('mouseleave', handleMouseLeave)
      }
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="relative aspect-square"
      onMouseLeave={() => {
        // 🆕 作为备份，直接在 React 中也处理
        const cards = containerRef.current?.querySelectorAll('.gallery-frame')
        cards?.forEach((card) => {
          const element = card as HTMLElement
          element.style.transform = 'translate(0px, 0px)'
        })
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gallery-white via-white to-gallery-lighter rounded-3xl border border-gallery-line shadow-2xl overflow-hidden">
        <div className="absolute inset-0 p-6 py-3 grid grid-cols-3 gap-4 content-center" >
          {artworks.map((artwork, i) => (
            <div
              key={i}
              className="gallery-frame bg-white border-2 border-neutral-200 rounded-lg shadow-md hover:shadow-2xl hover:border-neutral-300 aspect-[3/4] relative overflow-hidden group cursor-pointer"
              style={{
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease-out, border-color 0.3s ease-out'
              }}
            >
              <img
                src={artwork}
                alt={`Artwork ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              
              <div className="absolute inset-0 border-[8px] border-white/90 pointer-events-none"></div>

              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                i % 3 === 0 ? 'bg-blue-500/10' :
                i % 3 === 1 ? 'bg-purple-500/10' :
                'bg-green-500/10'
              }`}></div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none"></div>
            </div>
          ))}
        </div>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      </div>
    </div>
  )
}

/**
 * Value Card Component
 */
interface ValueCardProps {
  icon: any
  title: string
  description: string
  color: 'primary' | 'accent' | 'success'
}

function ValueCard({ icon: Icon, title, description, color }: ValueCardProps) {
  const colorClasses = {
    primary: 'from-blue-500 to-blue-700',
    accent: 'from-purple-500 to-purple-700',
    success: 'from-green-500 to-green-700'
  }

  return (
    <div className="group bg-white hover:bg-white rounded-2xl p-8 border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all">
      <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 mb-3">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

/**
 * Dashboard Mockup Component
 */
function DashboardMockup() {
  return (
    <div className="relative">
      <div className="bg-white rounded-2xl border border-gallery-line shadow-2xl overflow-hidden">
        {/* Browser Chrome */}
        <div className="bg-gallery-white border-b border-gallery-line p-4 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-success"></div>
        </div>
        
        {/* Dashboard Content */}
        <div className="p-6 space-y-4 bg-gallery-lighter">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-32 bg-gallery-line rounded mb-2"></div>
              <div className="h-3 w-24 bg-gallery-line/50 rounded"></div>
            </div>
            <div className="h-10 w-32 bg-primary-500/20 rounded-lg"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="aspect-square bg-white rounded-lg border border-gallery-line hover:border-primary-500/30 transition-colors"
              ></div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gallery-line">
                <div className="h-8 w-8 bg-gallery-line rounded-lg mb-3"></div>
                <div className="h-2 w-16 bg-gallery-line rounded mb-1"></div>
                <div className="h-4 w-12 bg-primary-500/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Stats */}
      <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 border border-gallery-line shadow-xl">
        <div className="text-3xl font-bold text-gallery-black">24</div>
        <div className="text-sm text-gray-600">Active Works</div>
      </div>
    </div>
  )
}

/**
 * Jury Interface Mockup
 */
function JuryInterfaceMockup() {
  return (
    <div className="relative order-2 lg:order-1">
      <div className="relative bg-white rounded-2xl border border-gallery-line shadow-2xl overflow-hidden">
        <div className="aspect-[4/3] bg-gallery-white flex items-center justify-center relative p-8">
          {/* Artwork Card */}
          <div className="absolute inset-8 border-4 border-gallery-line rounded-xl bg-white shadow-lg flex items-center justify-center">
            <Gavel className="w-20 h-20 text-gallery-line" />
          </div>
          
          {/* Swipe Indicators */}
          <div className="absolute top-6 left-6 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg rotate-[-12deg] shadow-lg">
            REJECT
          </div>
          <div className="absolute top-6 right-6 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg rotate-[12deg] shadow-lg">
            ACCEPT
          </div>
        </div>
        
         {/* Bottom Buttons - 修复这里 */}
        <div className="p-6 border-t border-gallery-line bg-gallery-lighter">
          <div className="flex items-center justify-center gap-6">
            {/* Reject Button - 白底红色X */}
            <div className="w-16 h-16 bg-white border-2 border-neutral-200 hover:border-red-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all">
              <X className="w-7 h-7 text-red-500" />
            </div>
            
            {/* Accept Button - 蓝底白色勾 */}
            <div className="w-20 h-20 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
              <Check className="w-9 h-9 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge */}
      <div className="absolute -top-8 -left-8 bg-white rounded-xl p-4 border border-gallery-line shadow-lg">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-semibold text-gallery-black">156 Reviewed</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Featured Exhibition Grid Component
 */
function FeaturedExhibitionGrid({ onCardClick }: { onCardClick: () => void }) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedExhibitions() {
      try {
        setLoading(true)
        const apiUrl = `${PAYLOAD_URL}/api/exhibitions?depth=1&where[status][equals]=published&where[exhibitionStatus][equals]=open&limit=3`
        const response = await fetch(apiUrl)
        
        if (!response.ok) throw new Error('Failed to fetch exhibitions')
        
        const data = await response.json()
        
        if (Array.isArray(data.docs)) {
          setExhibitions(data.docs)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeaturedExhibitions()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gallery-line animate-pulse">
            <div className="aspect-[4/3] bg-gallery-white"></div>
            <div className="p-6 space-y-3">
              <div className="h-6 bg-gallery-line rounded w-3/4"></div>
              <div className="h-4 bg-gallery-line rounded w-full"></div>
              <div className="h-4 bg-gallery-line rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (exhibitions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No open exhibitions at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {exhibitions.map((exhibition) => (
        <button
          key={exhibition.id}
          onClick={onCardClick}
          className="group bg-white rounded-2xl overflow-hidden border border-gallery-line hover:border-gallery-divider hover:shadow-xl transition-all text-left"
        >
          {/* Image */}
          <div className="aspect-[4/3] bg-gallery-white relative overflow-hidden">
            {isMedia(exhibition.cover_image) ? (
              <img
                src={`${PAYLOAD_URL}${exhibition.cover_image.url!}`}
                alt={exhibition.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Palette className="w-16 h-16 text-gallery-line" />
              </div>
            )}
            
            {/* Open Badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-success rounded-full shadow-lg backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Open
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gallery-black mb-2 group-hover:text-primary-500 transition-colors line-clamp-1">
              {exhibition.title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {exhibition.description || 'No description'}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gallery-line">
              <div>
                <div className="text-xs text-gray-500 mb-1">Entry Fee</div>
                <div className="text-xl font-bold text-gallery-black">
                  ${exhibition.submission_fee || 0}
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary-500 font-medium text-sm">
                <span>View</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}