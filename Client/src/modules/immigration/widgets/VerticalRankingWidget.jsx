import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import SectionCard from '../../../components/common/SectionCard'
import ImmigrationHealthBadge, { HealthScoreRing } from './ImmigrationHealthBadge'

const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#B45309', '#6B7280']

function RankBadge({ rank }) {
  const color = RANK_COLORS[Math.min(rank - 1, RANK_COLORS.length - 1)]
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {rank}
    </div>
  )
}

function MetricPill({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100">{value}</p>
      <p className="text-[10px] text-neutral-400 leading-tight">{label}</p>
    </div>
  )
}

export default function VerticalRankingWidget({ onDrillDown }) {
  const { verticals, loadingVerticals } = useSelector(s => s.immigration)

  if (loadingVerticals) {
    return (
      <SectionCard title="Vertical Health Rankings" className="h-[420px] flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title="Vertical Health Rankings"
      subtitle={`${verticals.length} verticals — click to drill down`}
      className="h-[420px] flex flex-col"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {verticals.map((v, idx) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            onClick={() => onDrillDown?.(v)}
            className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-700 cursor-pointer transition-colors group"
          >
            <RankBadge rank={v.rank} />

            <HealthScoreRing score={v.healthScore.score} band={v.healthScore.band} size={48} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                  {v.name}
                </span>
                <ImmigrationHealthBadge band={v.healthScore.band} />
              </div>
              <div className="flex items-center gap-4">
                <MetricPill label="Employees"  value={v.employeeCount} />
                <MetricPill label="Active Leads" value={v.activeLeads} />
                <MetricPill label="Tasks Done"
                  value={`${v.taskCompletionRate}%`} />
                <MetricPill label="Conversion"
                  value={`${v.leadConversionRate}%`} />
                <MetricPill label="Revenue"
                  value={v.revenue >= 1000 ? `$${(v.revenue / 1000).toFixed(0)}K` : `$${v.revenue}`} />
              </div>
            </div>

            <span className="text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-400 transition-colors text-lg">›</span>
          </motion.div>
        ))}

        {verticals.length === 0 && (
          <div className="text-center py-12 text-sm text-neutral-400">No verticals found</div>
        )}
      </div>
    </SectionCard>
  )
}
