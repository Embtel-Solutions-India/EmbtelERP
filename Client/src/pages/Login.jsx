import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material'
import { loginAsync, clearError } from '../redux/slices/authSlice'
import { getHomePath } from '../utils/roleRoutes'

export default function Login() {
  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const { loading, error, isAuthenticated, user } = useSelector((s) => s.auth)

  const [showPw, setShowPw] = useState(false)
  const [form,   setForm]   = useState({ email: '', password: '' })

  // Already authenticated — skip login page
  if (isAuthenticated && user) {
    return <Navigate to={getHomePath(user.roleLevel)} replace />
  }

  const handleChange = (e) => {
    dispatch(clearError())
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginAsync({ email: form.email, password: form.password }))
    if (loginAsync.fulfilled.match(result)) {
      const { roleLevel } = result.payload.employee
      navigate(getHomePath(roleLevel), { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-br from-primary-600 to-purple-700 p-8 text-white">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <span className="font-bold text-xl">E</span>
          </div>
          <h1 className="text-2xl font-bold">EmbtelERP</h1>
          <p className="text-white/70 mt-1">Sign in to your workspace</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            Welcome back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Enter your credentials to continue
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Email
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                style={{ fontSize: 20 }}
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Email address"
                required
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                style={{ fontSize: 20 }}
              />
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field pl-10 pr-10"
                placeholder="Password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? (
                  <VisibilityOff style={{ fontSize: 20 }} />
                ) : (
                  <Visibility style={{ fontSize: 20 }} />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                Remember me
              </label>
              <a
                href="#"
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
