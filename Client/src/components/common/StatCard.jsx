import { motion } from 'framer-motion'
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa'
import { formatNumber } from '../../utils'

function MiniSparkline({ data = [], color = '#444CE7' }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const W = 72, H = 32
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polyline
        points={pts}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel,
  icon,
  color = '#444CE7',
  bgColor,
  sparkData,
  delay = 0,
  formatValue = true,
}) {
  const displayVal =
    typeof value === 'number'
      ? formatValue
        ? formatNumber(value)
        : value.toLocaleString()
      : value ?? '—'

  const isPos = change > 0
  const isNeg = change < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className="stat-card group"
    >
      {/* Row 1: icon left, sparkline right */}
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm"
          style={{ backgroundColor: bgColor || color }}
        >
          <span className="text-base leading-none">{icon}</span>
        </div>
        {sparkData && (
          <div className="flex-shrink-0 self-center">
            <MiniSparkline data={sparkData} color={color} />
          </div>
        )}
      </div>

      {/* Row 2: title — full width, wraps freely */}
      <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider leading-tight mb-1">
        {title}
      </p>

      {/* Row 3: value */}
      <div className="flex items-baseline gap-1 mb-2">
        {prefix && (
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{prefix}</span>
        )}
        <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-tight">
          {displayVal}
        </span>
        {suffix && (
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{suffix}</span>
        )}
      </div>

      {/* Row 4: trend badge + label */}
      {change !== undefined && change !== null && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
              isPos
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : isNeg
                ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
            }`}
          >
            {isPos ? <FaArrowUp size={7} /> : isNeg ? <FaArrowDown size={7} /> : <FaMinus size={7} />}
            <span>
              {Math.abs(change)}
              {typeof change === 'number' && Math.abs(change) <= 100 ? '%' : ''}
            </span>
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            {changeLabel || (isPos ? 'increase' : isNeg ? 'decrease' : 'no change')}
          </span>
        </div>
      )}
    </motion.div>
  )
}
