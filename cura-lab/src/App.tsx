// File: src/App.tsx
import { useState, useEffect } from 'react'
import { LogIn, LogOut, User as UserIcon, Menu, X } from 'lucide-react'
import Landing from './views/Landing.tsx'
import Exhibitions from './views/Exhibitions.tsx'
import ExhibitionDetail from './views/ExhibitionDetail.tsx'
import ArtistDashboard from './views/ArtistDashboard.tsx'
import Gallery from './views/Gallery.tsx'
import GalleryDetail from './views/GalleryDetail.tsx'
import GalleryDashboard from './views/GalleryDashboard.tsx'
import JurorReview from './views/JurorReview.tsx'
import type { User } from '../../payload-project/src/payload-types'
import Login from './views/Login.tsx'
import Signup from './views/Signup.tsx'
import CreateArtwork from './views/CreateArtwork.tsx'
import CreateExhibition from './views/CreateExhibition.tsx'
import ArtworkDetail from './views/ArtworkDetail'
import "./index.css"

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

export type View = 
  | 'landing' 
  | 'exhibitions' 
  | 'exhibitionDetail' 
  | 'gallery' 
  | 'galleryDetail'
  | 'artistDashboard'
  | 'galleryDashboard'
  | 'jurorReview'
  | 'login'
  | 'signup'
  | 'createArtwork'
  | 'createExhibition'  
  | 'editExhibition'
  | 'artwork-detail'
export default function App() {
  const [view, setView] = useState<View>('landing')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [_loadingUser, setLoadingUser] = useState(true)
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null)
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<number | null>(null)
  const [editingExhibitionId, setEditingExhibitionId] = useState<number | null>(null)
  const [selectedArtworkId, setSelectedArtworkId] = useState<number | null>(null)
  // Fetch current user on mount
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch(`${PAYLOAD_URL}/api/users/me`, {
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setCurrentUser(data.user)
          }
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err)
      } finally {
        setLoadingUser(false)
      }
    }

    fetchCurrentUser()
  }, [])

  const handleLogin = () => {
    setView('login') // 改成跳转到前端登录页面，而不是后端
  }
  // const handleSignup = () => {
  //   setView('signup') // 🆕 跳转到注册页
  // }
  const handleLoginSuccess = () => {
  // 重新获取用户
    fetch(`${PAYLOAD_URL}/api/users/me`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user)
          // 根据角色跳转
          switch (data.user.appRole) {
            case 'artist':
              setView('artistDashboard')
              break
            case 'gallery':
              setView('galleryDashboard')
              break
            case 'juror':
              setView('jurorReview')
              break
            default:
              setView('landing')
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch user:', err)
        setView('landing')
      })
  }
  const handleLogout = async () => {
    try {
      await fetch(`${PAYLOAD_URL}/api/users/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      setCurrentUser(null)
      setView('landing')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  // Route to appropriate dashboard based on user role
  const handleDashboardClick = () => {
    if (!currentUser) {
      handleLogin()
      return
    }

    switch (currentUser.appRole) {
      case 'artist':
        setView('artistDashboard')
        break
      case 'gallery':
        setView('galleryDashboard')
        break
      case 'juror':
        setView('jurorReview')
        break
      case 'admin':
        window.location.href = `${PAYLOAD_URL}/admin`
        break
      default:
        setView('landing')
    }
  }

  return (
    
    <div className="min-h-screen bg-gallery-lighter text-gallery-black">
      <Nav 
        view={view} 
        setView={setView}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onDashboard={handleDashboardClick}
      />
      {view === 'landing' && (
        <Landing 
          onBrowse={() => setView('exhibitions')} 
          onArtistPortal={handleDashboardClick}
        />
      )}

      {view === 'login' && (
        <Login
          onBack={() => setView('landing')}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={() => setView('signup')}
        />
      )}

      {view === 'signup' && (
        <Signup
          onBack={() => setView('landing')}
          onSignupSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setView('login')}
        />
      )}

      {view === 'exhibitions' && (
        <Exhibitions 
          onViewDetail={(id) => {
            setSelectedExhibitionId(id)
            setView('exhibitionDetail')
          }} 
        />
      )}

      {view === 'exhibitionDetail' && selectedExhibitionId && (
        <ExhibitionDetail
          id={selectedExhibitionId}
          currentUser={currentUser}
          onBack={() => {
            setView('exhibitions')
            setSelectedExhibitionId(null)
          }}
          onGalleryClick={(id) => {
            setSelectedGalleryId(id)
            setView('galleryDetail')
          }}
        />
      )}

      {view === 'gallery' && (
        <Gallery 
          onViewDetail={(id) => {
            setSelectedGalleryId(id)
            setView('galleryDetail')
          }} 
        />
      )}
      {view === 'artwork-detail' && selectedArtworkId && (
        <ArtworkDetail
          artworkId={selectedArtworkId}
          currentUser={currentUser}
          onBack={() => {
            setView('artistDashboard')
            setSelectedArtworkId(null)
          }}
        />
      )}
      
      {view === 'galleryDetail' && selectedGalleryId && (
        <GalleryDetail 
          id={selectedGalleryId}
          onBack={() => {
            setView('gallery')
            setSelectedGalleryId(null)
          }}
          onViewExhibition={(id) => {
            setSelectedExhibitionId(id)
            setView('exhibitionDetail')
          }}
        />
      )}

      {view === 'artistDashboard' && (
        <ArtistDashboard 
          currentUser={currentUser}
          onNewSubmission={() => setView('exhibitions')}
          onViewExhibition={(id) => {
            setSelectedExhibitionId(id)
            setView('exhibitionDetail')
          }}
          onViewArtwork={(id) => {  // 🔍 确保这个回调存在
            setSelectedArtworkId(id)
            setView('artwork-detail')
          }}
          onBrowseExhibitions={() => setView('exhibitions')}
          onCreateArtwork={() => setView('createArtwork')}
        />
      )}

      {view === 'createArtwork' && (
        <CreateArtwork
          currentUser={currentUser}
          onBack={() => setView('artistDashboard')}
          onSuccess={() => {
            setView('artistDashboard')
            alert('Artwork created successfully!')
          }}
        />
      )}
      {view === 'galleryDashboard' && (
        <GalleryDashboard
          currentUser={currentUser}
          onCreateExhibition={() => setView('createExhibition')}
          onEditExhibition={(id) => {
            setEditingExhibitionId(id)
            setView('editExhibition')
          }}
          onViewExhibition={(id) => {
            setSelectedExhibitionId(id)
            setView('exhibitionDetail')
          }}
          onEnterJuryMode={() => setView('jurorReview')}
        />
      )}

      {view === 'createExhibition' && (
        <CreateExhibition
          currentUser={currentUser}
          onBack={() => setView('galleryDashboard')}
          onSuccess={() => {
            setView('galleryDashboard')
            alert('Exhibition created successfully!')
          }}
        />
      )}

      {view === 'editExhibition' && editingExhibitionId && (
        <CreateExhibition
          currentUser={currentUser}
          exhibitionId={editingExhibitionId}
          onBack={() => {
            setView('galleryDashboard')
            setEditingExhibitionId(null)
          }}
          onSuccess={() => {
            setView('galleryDashboard')
            setEditingExhibitionId(null)
            alert('Exhibition updated successfully!')
          }}
        />
      )}

      {view === 'jurorReview' && (
        <JurorReview
          currentUser={currentUser}
          exhibitionId={selectedExhibitionId || undefined}
        />
      )}
    </div>
  )
}

/**
 * Navigation Component
 */
interface NavProps {
  view: View
  setView: (v: View) => void
  currentUser: User | null
  onLogin: () => void
  onLogout: () => void
  onDashboard: () => void
}

function Nav({ view, setView, currentUser, onLogin, onLogout, onDashboard }: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const NavItem = ({ v, label }: { v: View; label: string }) => (
    <button
      onClick={() => {
        setView(v)
        setMobileMenuOpen(false)
      }}
      className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
        view === v 
          ? 'text-white bg-gallery-black' 
          : 'text-gray-600 hover:text-gallery-black hover:bg-gallery-white'
      }`}
    >
      {label}
    </button>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gallery-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gallery-black text-white grid place-items-center text-sm font-bold group-hover:bg-primary-500 transition-colors">
              CL
            </div>
            <span className="text-lg font-bold text-gallery-black tracking-tight hidden sm:block">
              CURA LAB
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItem v="landing" label="Home" />
            <NavItem v="exhibitions" label="Exhibitions" />
            <NavItem v="gallery" label="Galleries" />
            
            {/* Divider */}
            <div className="w-px h-6 bg-gallery-line mx-2"></div>

            {/* User Menu */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onDashboard}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gallery-black hover:bg-gallery-white rounded-full transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{currentUser.name || 'Dashboard'}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-error hover:bg-red-50 rounded-full transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-neutral-900 hover:bg-blue-600 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gallery-black"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col gap-2">
              <NavItem v="landing" label="Home" />
              <NavItem v="exhibitions" label="Exhibitions" />
              <NavItem v="gallery" label="Galleries" />
              
              <div className="h-px bg-neutral-200 my-2"></div>
              
              {currentUser ? (
                <>
                  <button
                    onClick={() => {
                      onDashboard()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-all"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{currentUser.name || 'Dashboard'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onLogin()
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-neutral-900 hover:bg-blue-600 rounded-full transition-all duration-300 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
