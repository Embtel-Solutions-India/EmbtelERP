import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material'
import { loginAsync, clearError } from '../redux/slices/authSlice'
import { getHomePath } from '../utils/roleRoutes'
import { APP_NAME } from '../constants'

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, error, isAuthenticated, user } = useSelector((s) => s.auth)

  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  // Already authenticated — skip login page
  if (isAuthenticated && user) {
    return <Navigate to={getHomePath(user)} replace />
  }

  const handleChange = (e) => {
    dispatch(clearError())
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginAsync({ email: form.email, password: form.password }))
    if (loginAsync.fulfilled.match(result)) {
      navigate(getHomePath(result.payload.employee), { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left decorative panel — hidden on mobile ── */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-white/5" />

        {/* Logo + tagline */}
        <div className="relative z-10 text-white text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-white">C</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">{APP_NAME}</h1>
          <p className="text-white/70 text-base leading-relaxed">
            Enterprise CRM Platform for modern sales &amp; marketing teams
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3 text-left">
            {['Role-based access control', 'Real-time analytics', 'Multi-hierarchy management'].map(
              (text) => (
                <div key={text} className="flex items-center gap-3 text-white/80">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 12 12" fill="white" width="8" height="8">
                      <path
                        d="M1 6l3.5 3.5L11 2"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-900">
        <div className="w-full max-w-md">
          {/* Mobile logo — shown only below lg */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{APP_NAME}</h2>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8 border border-neutral-200 dark:border-neutral-700">
            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                Welcome back
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1.5 text-sm">
                Sign in to your account to continue
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                <span>&#9888;</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Email
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    style={{ fontSize: 18 }}
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field pl-10 h-11"
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    style={{ fontSize: 18 }}
                  />
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field pl-10 pr-11 h-11"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  >
                    {showPw ? (
                      <VisibilityOff style={{ fontSize: 20 }} />
                    ) : (
                      <Visibility style={{ fontSize: 20 }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                  <input type="checkbox" className="rounded" defaultChecked />
                  Remember me
                </label>
                <a
                  href="#"
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-semibold rounded-xl transition-all duration-200 shadow-brand flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
              {APP_NAME} — Enterprise CRM Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
