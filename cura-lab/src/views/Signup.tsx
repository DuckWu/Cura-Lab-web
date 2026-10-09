// src/views/Signup.tsx
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Palette, Building } from 'lucide-react'

const PAYLOAD_URL = import.meta.env.VITE_PAYLOAD_URL

type SignupProps = {
  onBack: () => void
  onSignupSuccess: () => void
  onSwitchToLogin: () => void
}

const ROLES = [
  {
    id: 'artist' as const,
    icon: Palette,
    title: "I'm an Artist",
    desc: 'Submit your work to exhibitions, manage your portfolio, and track every application.',
    points: ['Portfolio management', 'Submit to exhibitions', 'Track applications'],
  },
  {
    id: 'gallery' as const,
    icon: Building,
    title: "I'm a Gallery",
    desc: 'Create exhibitions, manage submissions, and curate shows with focused tools.',
    points: ['Create exhibitions', 'Manage submissions', 'Jury review tools'],
  },
]

export default function Signup({ onBack, onSignupSuccess, onSwitchToLogin }: SignupProps) {
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [selectedRole, setSelectedRole] = useState<'artist' | 'gallery' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRoleSelect = (role: 'artist' | 'gallery') => {
    setSelectedRole(role)
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${PAYLOAD_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          appRole: selectedRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      const loginResponse = await fetch(`${PAYLOAD_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      if (loginResponse.ok) {
        onSignupSuccess()
      } else {
        onSwitchToLogin()
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex w-[42%] bg-ink text-paper flex-col justify-between p-12 xl:p-16">
        <button
          onClick={step === 'details' ? () => setStep('role') : onBack}
          className="group inline-flex items-center gap-2 text-[13px] tracking-[0.12em] uppercase text-paper/50 hover:text-paper font-medium transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{step === 'details' ? 'Roles' : 'Home'}</span>
        </button>
        <div>
          <p className="font-display text-xl tracking-[0.18em] uppercase text-paper/40 mb-8">Cura Lab</p>
          <p className="display text-paper text-4xl xl:text-5xl leading-[1.15]">
            Begin your next<br /><span className="italic">exhibition.</span>
          </p>
        </div>
        <p className="text-sm text-paper/40 font-light">Join galleries and artists working with intention.</p>
      </div>

      {/* Right — content */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-xl">
          <button
            onClick={step === 'details' ? () => setStep('role') : onBack}
            className="lg:hidden group inline-flex items-center gap-2 text-[13px] tracking-[0.12em] uppercase text-stone hover:text-ink font-medium mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{step === 'details' ? 'Roles' : 'Home'}</span>
          </button>

          {step === 'role' && (
            <div>
              <p className="eyebrow mb-4">Sign Up</p>
              <h1 className="display text-4xl sm:text-5xl mb-3">Join Cura Lab</h1>
              <p className="text-stone font-light mb-12">Choose your role to get started.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-fog border border-fog mb-10">
                {ROLES.map(role => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className="group bg-paper hover:bg-white text-left p-8 transition-colors duration-300"
                  >
                    <role.icon className="w-6 h-6 text-stone group-hover:text-ink transition-colors mb-8" strokeWidth={1.5} />
                    <h3 className="font-display text-2xl text-ink mb-3">{role.title}</h3>
                    <p className="text-sm text-stone leading-relaxed mb-6">{role.desc}</p>
                    <ul className="space-y-2 mb-8">
                      {role.points.map(pt => (
                        <li key={pt} className="flex items-center gap-2.5 text-[13px] text-stone">
                          <span className="w-1 h-1 bg-stone rounded-full" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <span className="inline-flex items-center gap-2 text-[12px] tracking-[0.12em] uppercase font-medium text-ink">
                      Continue
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-sm text-stone text-center">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-ink font-medium underline underline-offset-4 decoration-ink/30 hover:decoration-ink transition-all"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {step === 'details' && (
            <div className="max-w-md">
              <p className="eyebrow mb-4">
                Signing up as <span className="text-ink capitalize">{selectedRole}</span>
              </p>
              <h1 className="display text-4xl sm:text-5xl mb-3">Create your account</h1>
              <p className="text-stone font-light mb-12">Just a few details to get started.</p>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-8 px-5 py-4 border border-ink/20 bg-ink/[0.03]">
                    <p className="text-sm text-ink">{error}</p>
                  </div>
                )}

                <div className="space-y-8">
                  {[
                    { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Alex Porter', value: formData.name, set: (v: string) => setFormData({ ...formData, name: v }) },
                    { id: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', value: formData.email, set: (v: string) => setFormData({ ...formData, email: v }) },
                    { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••', value: formData.password, set: (v: string) => setFormData({ ...formData, password: v }), hint: 'Must be at least 8 characters' },
                    { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••', value: formData.confirmPassword, set: (v: string) => setFormData({ ...formData, confirmPassword: v }) },
                  ].map(field => (
                    <div key={field.id}>
                      <label htmlFor={field.id} className="eyebrow block mb-3">
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        required
                        placeholder={field.placeholder}
                        minLength={field.id.includes('password') ? 8 : undefined}
                        className="w-full bg-transparent py-3 border-b border-fog focus:border-ink outline-none transition-colors text-[16px] placeholder:text-stone/50"
                      />
                      {field.hint && <p className="mt-2 text-xs text-stone/70">{field.hint}</p>}
                    </div>
                  ))}

                  <button type="submit" disabled={loading} className="btn-solid w-full disabled:opacity-50">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating account
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-10 pt-8 border-t border-fog text-center">
                <p className="text-sm text-stone">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-ink font-medium underline underline-offset-4 decoration-ink/30 hover:decoration-ink transition-all"
                  >
                    Sign in
                  </button>
                </p>
                <p className="mt-4 text-xs text-stone/60">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
