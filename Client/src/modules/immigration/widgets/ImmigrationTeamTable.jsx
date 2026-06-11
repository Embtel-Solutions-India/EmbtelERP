import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { fetchImmigrationTeam } from '../redux/immigrationSlice'
import { HealthScoreRing } from './ImmigrationHealthBadge'
import ImmigrationHealthBadge from './ImmigrationHealthBadge'
import EmployeeDetailView from './EmployeeDetailView'
import { useImmigrationScope } from '../../../hooks/useImmigrationScope'

const PAGE_SIZE = 20

export default function ImmigrationTeamTable() {
  const dispatch = useDispatch()
  const { team, loadingTeam, verticals } = useSelector(s => s.immigration)
  const [verticalFilter, setVerticalFilter] = useState('')
  const [page, setPage]                     = useState(1)
  const [selectedId, setSelectedId]         = useState(null)
  const scope = useImmigrationScope()
  const effectiveVertical = scope.scopeType === 'VERTICAL' ? scope.scopeId : (verticalFilter || undefined)

  useEffect(() => {
    setPage(1)
    dispatch(fetchImmigrationTeam({ verticalId: effectiveVertical, page: 1, limit: PAGE_SIZE }))
  }, [dispatch, effectiveVertical])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    dispatch(fetchImmigrationTeam({ verticalId: effectiveVertical, page: next, limit: PAGE_SIZE }))
  }

  const employees = team?.items ?? []

  return (
    <div className="space-y-4">
      {/* Filter + stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={scope.scopeType === 'VERTICAL' ? scope.scopeId : verticalFilter}
          onChange={e => setVerticalFilter(e.target.value)}
          disabled={scope.scopeType === 'VERTICAL'}
          className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">All Verticals</option>
          {verticals.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <span className="text-xs text-neutral-400 ml-auto">{team?.total ?? 0} employees</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
                {['Employee', 'Designation', 'Vertical', 'Tasks', 'Leads', 'Conversion', 'Health'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingTeam && employees.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-50 dark:border-neutral-800">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-neutral-100 dark:bg-neutral-700 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedId(emp.id)}
                  className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]">
                        {emp.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">{emp.designation ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {emp.vertical ? (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium">
                        {emp.vertical}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{emp.completedTasks}</span>
                      <span className="text-neutral-400">/{emp.taskCount}</span>
                      {emp.overdueTasks > 0 && (
                        <span className="ml-1 text-red-500 text-[10px]">({emp.overdueTasks} late)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                    {emp.leadsAssigned}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {emp.conversionRate}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <HealthScoreRing score={emp.healthScore.score} band={emp.healthScore.band} size={36} />
                      <ImmigrationHealthBadge band={emp.healthScore.band} />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && !loadingTeam && (
          <div className="text-center py-12 text-sm text-neutral-400">No employees found</div>
        )}

        {/* Load more */}
        {team?.totalPages > page && (
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-700 text-center">
            <button
              onClick={loadMore}
              disabled={loadingTeam}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium disabled:opacity-50"
            >
              {loadingTeam ? 'Loading…' : `Load more (${team.total - employees.length} remaining)`}
            </button>
          </div>
        )}
      </div>

      {/* Employee detail drill-down drawer */}
      <EmployeeDetailView employeeId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
