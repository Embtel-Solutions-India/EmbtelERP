import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material'
import { loginSuccess } from '../redux/slices/authSlice'

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email: 'ujjwal@crmpro.com', password: 'password' })

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(loginSuccess({
      id: 1, name: 'Ujjwal Sharma', email: form.email,
      role: 'Sales Executive', department: 'Sales',
    }))
    navigate('/dashboard')
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
            <span className="font-bold text-xl">C</span>
          </div>
          <h1 className="text-2xl font-bold">CRM Pro</h1>
          <p className="text-white/70 mt-1">Sales Executive Dashboard</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Welcome back</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Sign in to your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Email className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 20 }} />
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="input-field pl-10" placeholder="Email address" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 20 }} />
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="input-field pl-10 pr-10" placeholder="Password" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <VisibilityOff style={{ fontSize: 20 }} /> : <Visibility style={{ fontSize: 20 }} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked /> Remember me
              </label>
              <a href="#" className="text-sm text-primary-600 hover:underline font-medium">Forgot password?</a>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full btn-primary py-3 text-base"
            >
              Sign In to Dashboard
            </motion.button>
          </form>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-gray-800 text-xs text-slate-500 dark:text-slate-400">
            <strong>Demo credentials:</strong> ujjwal@crmpro.com / password
          </div>
        </div>
      </motion.div>
    </div>
  )
}
