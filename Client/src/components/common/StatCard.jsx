import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material'
import { formatNumber } from '../../utils'

const sparkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 1.2, ease: 'easeInOut' } },
}

function MiniSparkline({ data = [], color = '#6366f1' }) {
  if (!data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80; const h = 32
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <motion.polyline
        points={pts}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial="hidden"
        animate="visible"
        variants={sparkVariants}
      />
    </svg>
  )
}

export default function StatCard({
  title, value, prefix = '', suffix = '',
  change, changeLabel, icon, color = '#6366f1',
  bgColor, sparkData, delay = 0, formatValue = true,
}) {
  const numVal = typeof value === 'number'
    ? (formatValue ? formatNumber(value) : value.toLocaleString())
    : value
  const isPositive = change > 0
  const isNeutral  = change === 0
  const TrendIcon  = isNeutral ? TrendingFlat : isPositive ? TrendingUp : TrendingDown
  const trendColor = isNeutral ? 'text-slate-400' : isPositive ? 'text-emerald-500' : 'text-red-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{prefix}</span>}
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{numVal}</span>
            {suffix && <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{suffix}</span>}
          </div>
        </div>

        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300"
          style={{ background: bgColor || `linear-gradient(135deg, ${color}dd, ${color}88)` }}
        >
          <span className="text-lg leading-none">{icon}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon style={{ fontSize: 14 }} />
          <span>{Math.abs(change)}% {changeLabel || (isPositive ? 'increase' : 'decrease')}</span>
        </div>
        {sparkData && <MiniSparkline data={sparkData} color={color} />}
      </div>
    </motion.div>
  )
}
