// src/views/Login.tsx
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

type LoginProps = {
  onBack: () => void
  onLoginSuccess: () => void
  onSwitchToSignup?: () => void
}

export default function Login({ onBack, onLoginSuccess, onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${PAYLOAD_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      onLoginSuccess()
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex w-[42%] bg-ink text-paper flex-col justify-between p-12 xl:p-16">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-[13px] tracking-[0.12em] uppercase text-paper/50 hover:text-paper font-medium transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Home</span>
        </button>
        <div>
          <p className="font-display text-xl tracking-[0.18em] uppercase text-paper/40 mb-8">Cura Lab</p>
          <p className="display text-paper text-4xl xl:text-5xl leading-[1.15]">
            Where art meets<br /><span className="italic">its audience.</span>
          </p>
        </div>
        <p className="text-sm text-paper/40 font-light">A considered platform for exhibitions.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="lg:hidden group inline-flex items-center gap-2 text-[13px] tracking-[0.12em] uppercase text-stone hover:text-ink font-medium mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Home</span>
          </button>

          <p className="eyebrow mb-4">Sign In</p>
          <h1 className="display text-4xl sm:text-5xl mb-3">Welcome back</h1>
          <p className="text-stone font-light mb-12">Sign in to access your dashboard.</p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-8 px-5 py-4 border border-ink/20 bg-ink/[0.03]">
                <p className="text-sm text-ink">{error}</p>
              </div>
            )}

            <div className="space-y-8">
              <div>
                <label htmlFor="email" className="eyebrow block mb-3">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-transparent py-3 border-b border-fog focus:border-ink outline-none transition-colors text-[16px] placeholder:text-stone/50"
                />
              </div>

              <div>
                <label htmlFor="password" className="eyebrow block mb-3">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 border-b border-fog focus:border-ink outline-none transition-colors text-[16px] placeholder:text-stone/50"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-solid w-full disabled:opacity-50">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-fog text-center">
            <p className="text-sm text-stone">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="text-ink font-medium underline underline-offset-4 decoration-ink/30 hover:decoration-ink transition-all"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
