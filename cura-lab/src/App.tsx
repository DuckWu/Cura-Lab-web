// File: src/App.tsx
import { useState, useEffect } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
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

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch(`${PAYLOAD_URL}/api/users/me`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          if (data.user) setCurrentUser(data.user)
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err)
      } finally {
        setLoadingUser(false)
      }
    }
    fetchCurrentUser()
  }, [])

  const handleLogin = () => setView('login')

  const handleLoginSuccess = () => {
    fetch(`${PAYLOAD_URL}/api/users/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user)
          switch (data.user.appRole) {
            case 'artist': setView('artistDashboard'); break
            case 'gallery': setView('galleryDashboard'); break
            case 'juror': setView('jurorReview'); break
            default: setView('landing')
          }
        }
      })
      .catch(() => setView('landing'))
  }

  const handleLogout = async () => {
    try {
      await fetch(`${PAYLOAD_URL}/api/users/logout`, { method: 'POST', credentials: 'include' })
      setCurrentUser(null)
      setView('landing')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleDashboardClick = () => {
    if (!currentUser) { handleLogin(); return }
    switch (currentUser.appRole) {
      case 'artist': setView('artistDashboard'); break
      case 'gallery': setView('galleryDashboard'); break
      case 'juror': setView('jurorReview'); break
      case 'admin': window.location.href = `${PAYLOAD_URL}/admin`; break
      default: setView('landing')
    }
  }

  // Pages that should NOT show the global nav
  const hideNav = view === 'login' || view === 'signup' || view === 'jurorReview'

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {!hideNav && (
        <Nav
          view={view}
          setView={setView}
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onDashboard={handleDashboardClick}
        />
      )}

      {view === 'landing' && (
        <Landing
          onBrowse={() => setView('exhibitions')}
          onArtistPortal={handleDashboardClick}
        />
      )}

      {view === 'login' && (
        <Login onBack={() => setView('landing')} onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => setView('signup')} />
      )}
      {view === 'signup' && (
        <Signup onBack={() => setView('landing')} onSignupSuccess={handleLoginSuccess} onSwitchToLogin={() => setView('login')} />
      )}

      {view === 'exhibitions' && (
        <Exhibitions onViewDetail={(id) => { setSelectedExhibitionId(id); setView('exhibitionDetail') }} />
      )}
      {view === 'exhibitionDetail' && selectedExhibitionId && (
        <ExhibitionDetail
          id={selectedExhibitionId}
          currentUser={currentUser}
          onBack={() => { setView('exhibitions'); setSelectedExhibitionId(null) }}
          onGalleryClick={(id) => { setSelectedGalleryId(id); setView('galleryDetail') }}
        />
      )}

      {view === 'gallery' && (
        <Gallery onViewDetail={(id) => { setSelectedGalleryId(id); setView('galleryDetail') }} />
      )}
      {view === 'galleryDetail' && selectedGalleryId && (
        <GalleryDetail
          id={selectedGalleryId}
          onBack={() => { setView('gallery'); setSelectedGalleryId(null) }}
          onViewExhibition={(id) => { setSelectedExhibitionId(id); setView('exhibitionDetail') }}
        />
      )}

      {view === 'artwork-detail' && selectedArtworkId && (
        <ArtworkDetail
          artworkId={selectedArtworkId}
          currentUser={currentUser}
          onBack={() => { setView('artistDashboard'); setSelectedArtworkId(null) }}
        />
      )}

      {view === 'artistDashboard' && (
        <ArtistDashboard
          currentUser={currentUser}
          onNewSubmission={() => setView('exhibitions')}
          onViewExhibition={(id) => { setSelectedExhibitionId(id); setView('exhibitionDetail') }}
          onViewArtwork={(id) => { setSelectedArtworkId(id); setView('artwork-detail') }}
          onBrowseExhibitions={() => setView('exhibitions')}
          onCreateArtwork={() => setView('createArtwork')}
        />
      )}
      {view === 'createArtwork' && (
        <CreateArtwork
          currentUser={currentUser}
          onBack={() => setView('artistDashboard')}
          onSuccess={() => { setView('artistDashboard') }}
        />
      )}

      {view === 'galleryDashboard' && (
        <GalleryDashboard
          currentUser={currentUser}
          onCreateExhibition={() => setView('createExhibition')}
          onEditExhibition={(id) => { setEditingExhibitionId(id); setView('editExhibition') }}
          onViewExhibition={(id) => { setSelectedExhibitionId(id); setView('exhibitionDetail') }}
          onEnterJuryMode={() => setView('jurorReview')}
        />
      )}
      {view === 'createExhibition' && (
        <CreateExhibition
          currentUser={currentUser}
          onBack={() => setView('galleryDashboard')}
          onSuccess={() => setView('galleryDashboard')}
        />
      )}
      {view === 'editExhibition' && editingExhibitionId && (
        <CreateExhibition
          currentUser={currentUser}
          exhibitionId={editingExhibitionId}
          onBack={() => { setView('galleryDashboard'); setEditingExhibitionId(null) }}
          onSuccess={() => { setView('galleryDashboard'); setEditingExhibitionId(null) }}
        />
      )}

      {view === 'jurorReview' && (
        <JurorReview currentUser={currentUser} exhibitionId={selectedExhibitionId || undefined} />
      )}
    </div>
  )
}

// ─── Navigation ─────────────────────────────────────────────
// Gagosian-inspired: ultra-minimal, serif wordmark, restrained palette

interface NavProps {
  view: View
  setView: (v: View) => void
  currentUser: User | null
  onLogin: () => void
  onLogout: () => void
  onDashboard: () => void
}

function Nav({ view, setView, currentUser, onLogin, onLogout, onDashboard }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLanding = view === 'landing'

  const link = (v: View, label: string) => (
    <button
      onClick={() => { setView(v); setMobileOpen(false) }}
      className={`text-[13px] tracking-[0.08em] uppercase transition-colors ${
        view === v
          ? 'text-neutral-900'
          : 'text-neutral-400 hover:text-neutral-900'
      }`}
    >
      {label}
    </button>
  )

  return (
    <header className={`sticky top-0 z-50 transition-colors ${
      isLanding ? 'bg-white/80 backdrop-blur-xl' : 'bg-white border-b border-neutral-100'
    }`}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Wordmark */}
          <button
            onClick={() => setView('landing')}
            className="text-xl tracking-[0.15em] font-light uppercase text-neutral-900 hover:opacity-60 transition-opacity"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Cura Lab
          </button>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-8">
            {link('exhibitions', 'Exhibitions')}
            {link('gallery', 'Galleries')}

            {currentUser ? (
              <>
                <button
                  onClick={onDashboard}
                  className="text-[13px] tracking-[0.08em] uppercase text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  Dashboard
                </button>
                <div className="w-px h-4 bg-neutral-200" />
                <button
                  onClick={onLogout}
                  className="text-[13px] tracking-[0.08em] uppercase text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="w-px h-4 bg-neutral-200" />
                <button
                  onClick={onLogin}
                  className="text-[13px] tracking-[0.08em] uppercase text-neutral-900 hover:opacity-60 transition-opacity"
                >
                  Sign In
                </button>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-neutral-900">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-6 pt-2 border-t border-neutral-100 space-y-4">
            {link('exhibitions', 'Exhibitions')}
            {link('gallery', 'Galleries')}
            {currentUser ? (
              <>
                <button
                  onClick={() => { onDashboard(); setMobileOpen(false) }}
                  className="block text-[13px] tracking-[0.08em] uppercase text-neutral-400 hover:text-neutral-900"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { onLogout(); setMobileOpen(false) }}
                  className="block text-[13px] tracking-[0.08em] uppercase text-neutral-400 hover:text-neutral-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => { onLogin(); setMobileOpen(false) }}
                className="block text-[13px] tracking-[0.08em] uppercase text-neutral-900"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}