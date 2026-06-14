import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FaTasks, FaListUl, FaBolt, FaRegClock } from 'react-icons/fa'

function MetricCard({ label, value, sub, icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className="card p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {icon}
        </span>
        <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider leading-tight">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">{sub}</p>}
    </motion.div>
  )
}

export default function ItKpiSection() {
  const { overview, loadingOverview } = useSelector((s) => s.it)
  const k = overview?.kpis

  if (loadingOverview && !overview) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-4 h-[110px] animate-pulse bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </div>
    )
  }

  const cards = [
    { label: 'Tasks this sprint', value: k?.tasksThisSprint ?? 0, sub: `${k?.tasksCompleted ?? 0} completed`, icon: <FaTasks />,    color: '#4F46E5' },
    { label: 'Open tasks',        value: k?.openTasks ?? 0,        sub: 'not yet done',                       icon: <FaListUl />,   color: '#DC2626' },
    { label: 'Sprint velocity',   value: `${k?.sprintVelocity ?? 0}`, sub: `pts · target ${k?.targetPoints ?? 0}`, icon: <FaBolt />, color: '#7C3AED' },
    { label: 'Sprint days left',  value: k?.sprintDaysLeft ?? 0,   sub: 'until sprint end',                   icon: <FaRegClock />, color: '#D97706' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <MetricCard key={c.label} {...c} delay={i * 0.05} />
      ))}
    </div>
  )
}
