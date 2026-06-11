import { useSelector } from 'react-redux'
import {
  FaBuilding,
  FaUsers,
  FaClipboardList,
  FaExclamationTriangle,
  FaChartLine,
  FaMoneyBillWave,
  FaCheckCircle,
  FaBolt,
} from 'react-icons/fa'
import StatCard from '../../../components/common/StatCard'
import ImmigrationHealthBadge from './ImmigrationHealthBadge'

function fmt(v) {
  if (v == null) return '—'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString()
}

export default function ImmigrationKpiSection() {
  const { kpis, loadingKpis } = useSelector(s => s.immigration)

  if (loadingKpis || !kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="stat-card animate-pulse h-28 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      title:       'Total Verticals',
      value:       kpis.totalVerticals,
      icon:        <FaBuilding />,
      color:       '#4F46E5',
      formatValue: false,
    },
    {
      title:       'Total Employees',
      value:       kpis.totalEmployees,
      icon:        <FaUsers />,
      color:       '#7C3AED',
      formatValue: false,
    },
    {
      title:       'Active Cases',
      value:       kpis.activeCases,
      icon:        <FaClipboardList />,
      color:       '#0284C7',
      formatValue: false,
    },
    {
      title:       'Overdue Cases',
      value:       kpis.overdueCases,
      icon:        <FaExclamationTriangle />,
      color:       '#DC2626',
      formatValue: false,
    },
    {
      title:       'New Leads / Month',
      value:       kpis.newLeadsThisMonth,
      icon:        <FaChartLine />,
      color:       '#059669',
      formatValue: false,
    },
    {
      title:       'Revenue This Month',
      value:       kpis.revenueThisMonth,
      icon:        <FaMoneyBillWave />,
      prefix:      '$',
      color:       '#D97706',
      change:      kpis.revenueGrowthPct,
      changeLabel: 'vs last month',
      formatValue: true,
    },
    {
      title:       'Approval Rate',
      value:       kpis.approvalRate,
      suffix:      '%',
      icon:        <FaCheckCircle />,
      color:       '#16A34A',
      formatValue: false,
    },
    {
      title:       'Team Productivity',
      value:       kpis.teamProductivity,
      suffix:      '%',
      icon:        <FaBolt />,
      color:       '#0891B2',
      formatValue: false,
    },
  ]

  return (
    <div>
      {/* Health score callout */}
      {kpis.healthScore && (
        <div className="mb-4 flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-2.5">
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Division Health</span>
          <ImmigrationHealthBadge band={kpis.healthScore.band} score={kpis.healthScore.score} showScore />
          <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
            Rev {kpis.healthScore.components.revenueGrowth}% · Leads {kpis.healthScore.components.leadConversion}% · Tasks {kpis.healthScore.components.taskCompletion}% · OnTime {kpis.healthScore.components.onTimeCompletion}% · Approval {kpis.healthScore.components.approvalRate}%
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <StatCard key={c.title} delay={i * 0.04} {...c} />
        ))}
      </div>
    </div>
  )
}
