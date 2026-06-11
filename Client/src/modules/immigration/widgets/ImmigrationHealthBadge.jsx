const BAND_CFG = {
  EXCELLENT:       { label: 'Excellent',        ring: '#10b981', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  AVERAGE:         { label: 'Average',          ring: '#f59e0b', text: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20'   },
  NEEDS_ATTENTION: { label: 'Needs Attention',  ring: '#ef4444', text: 'text-red-700 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20'       },
}

function ScoreRing({ score, color, size = 56 }) {
  const R  = (size - 6) / 2
  const C  = 2 * Math.PI * R
  const pct = Math.max(0, Math.min(100, score)) / 100
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={R} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${C * pct} ${C}`}
        strokeDashoffset={C / 4}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size < 50 ? 9 : 11} fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  )
}

export function HealthScoreRing({ score, band, size }) {
  const cfg = BAND_CFG[band] ?? BAND_CFG.NEEDS_ATTENTION
  return <ScoreRing score={score} color={cfg.ring} size={size} />
}

export default function ImmigrationHealthBadge({ band, score, showScore = false, className = '' }) {
  const cfg = BAND_CFG[band] ?? BAND_CFG.NEEDS_ATTENTION
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ${className}`}>
      {showScore && <span className="font-bold">{score}</span>}
      {cfg.label}
    </span>
  )
}
