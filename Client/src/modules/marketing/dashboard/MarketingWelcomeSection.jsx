import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Add, Email, CloudUpload, TaskAlt } from '@mui/icons-material'
import { format } from 'date-fns'
import { getGreeting, formatCurrency } from '../../../utils'
import { MOTIVATIONAL_QUOTES } from '../../../constants'

const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]

const ACTIONS = [
  { label: 'Create Campaign',  icon: <Add fontSize="small" />,          path: '/marketing/campaigns',        gradient: 'from-violet-600 to-indigo-600' },
  { label: 'Schedule Email',   icon: <Email fontSize="small" />,        path: '/marketing/email-marketing',  gradient: 'from-sky-500 to-cyan-500'      },
  { label: 'Upload Creative',  icon: <CloudUpload fontSize="small" />,  path: '/marketing/assets',           gradient: 'from-emerald-500 to-teal-500'  },
  { label: 'Create Task',      icon: <TaskAlt fontSize="small" />,      path: '/marketing/tasks',            gradient: 'from-orange-500 to-amber-500'  },
]

export default function MarketingWelcomeSection() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { kpiStats } = useSelector((s) => s.marketingDashboard)
  const firstName = user?.name?.split(' ')[0] || 'Marketing Exec'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-indigo-500 to-purple-500 p-6 md:p-8 text-white shadow-brand"
    >
      {/* Background circles */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-8 right-32 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/70 text-sm font-medium mb-1"
          >
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · {getGreeting()},
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl md:text-4xl font-bold mb-1"
          >
            {firstName}!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm italic max-w-xl line-clamp-2 mb-5"
          >
            {quote}
          </motion.p>

          {/* Quick action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            {ACTIONS.map((a) => (
              <motion.button
                key={a.label}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(a.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold transition-all duration-200 border border-white/20`}
              >
                {a.icon}
                {a.label}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Target mini-widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="flex-shrink-0 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 min-w-[200px]"
        >
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Campaign Target</p>
          <p className="text-2xl font-bold mb-1">{kpiStats.targetAchievement}%</p>
          <p className="text-white/60 text-xs mb-3">
            {formatCurrency(kpiStats.monthlyRevenue)} of {formatCurrency(kpiStats.monthlyTarget)}
          </p>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${kpiStats.targetAchievement}%` }}
              transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
              className="h-2 bg-white rounded-full"
            />
          </div>
          <p className="text-white/50 text-xs mt-2">
            {formatCurrency(kpiStats.monthlyTarget - kpiStats.monthlyRevenue)} remaining
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
