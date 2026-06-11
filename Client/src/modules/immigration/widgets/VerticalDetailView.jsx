import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import SectionCard from '../../../components/common/SectionCard'
import StatCard from '../../../components/common/StatCard'
import ImmigrationHealthBadge, { HealthScoreRing } from './ImmigrationHealthBadge'

function TableRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
      <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{label}</span>
      <div className="text-right ml-4 flex-shrink-0">
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{value}</span>
        {sub && <span className="text-[10px] text-neutral-400 block">{sub}</span>}
      </div>
    </div>
  )
}

export default function VerticalDetailView() {
  const { verticalDetail, loadingVerticalDetail } = useSelector(s => s.immigration)

  if (loadingVerticalDetail) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-[420px] rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-[420px] rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>
    )
  }

  if (!verticalDetail) return null

  const v = verticalDetail

  const kpiCards = [
    { title: 'Employees',     value: v.employeeCount,        icon: '👥', color: '#4F46E5', formatValue: false },
    { title: 'Active Leads',  value: v.activeLeads,          icon: '📈', color: '#0284C7', formatValue: false },
    { title: 'Revenue',       value: v.revenue, prefix: '$', icon: '💰', color: '#D97706', formatValue: true  },
    { title: 'Cases Done',    value: `${v.taskCompletionRate}%`, icon: '✅', color: '#16A34A', formatValue: false },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800"
      >
        <HealthScoreRing score={v.healthScore.score} band={v.healthScore.band} size={64} />
        <div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{v.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <ImmigrationHealthBadge band={v.healthScore.band} score={v.healthScore.score} showScore />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{v.teamCount} teams · {v.departments?.length ?? 0} departments</span>
          </div>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.map((c, i) => <StatCard key={c.title} delay={i * 0.05} {...c} />)}
      </div>

      {/* Departments | Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Departments" className="h-[420px] flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            {(v.departments ?? []).map(d => (
              <TableRow
                key={d.id}
                label={d.name}
                value={`${d.taskCompletionRate}% done`}
                sub={`${d.employeeCount} employees · ${d.overdueTasks} overdue`}
              />
            ))}
            {(!v.departments || v.departments.length === 0) && (
              <p className="text-sm text-neutral-400 py-8 text-center">No departments</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Teams" className="h-[420px] flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            {(v.teams ?? []).map(t => (
              <TableRow
                key={t.id}
                label={t.name}
                value={`${t.completionRate}% done`}
                sub={`${t.memberCount} members · ${t.overdueTasks} overdue`}
              />
            ))}
            {(!v.teams || v.teams.length === 0) && (
              <p className="text-sm text-neutral-400 py-8 text-center">No teams</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent Leads */}
      {v.recentLeads?.length > 0 && (
        <SectionCard title="Recent Leads" className="h-[420px] flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-700">
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Assignee</th>
                  <th className="text-right py-2">Value</th>
                  <th className="text-right py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {v.recentLeads.map(l => (
                  <tr key={l.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2 text-neutral-600 dark:text-neutral-400">
                      {l.assignee?.name ?? '—'}
                    </td>
                    <td className="py-2 text-right font-semibold text-neutral-800 dark:text-neutral-100">
                      ${l.estimatedValue.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-neutral-400 text-[11px]">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
