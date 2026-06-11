import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchImmigrationEscalations } from '../redux/immigrationSlice'
import ImmigrationPriorityBadge from './ImmigrationPriorityBadge'
import { useImmigrationScope } from '../../../hooks/useImmigrationScope'

function daysColor(days) {
  if (days >= 14) return 'text-red-600 dark:text-red-400 font-bold'
  if (days >= 7)  return 'text-orange-500 dark:text-orange-400 font-semibold'
  return 'text-amber-600 dark:text-amber-400 font-medium'
}

export default function ImmigrationEscalationList() {
  const dispatch = useDispatch()
  const { escalations, loadingEscalations, verticals } = useSelector(s => s.immigration)
  const [verticalFilter, setVerticalFilter] = useState('')
  const scope = useImmigrationScope()
  const effectiveVertical = scope.scopeType === 'VERTICAL' ? scope.scopeId : (verticalFilter || undefined)

  useEffect(() => {
    dispatch(fetchImmigrationEscalations({ verticalId: effectiveVertical, limit: 50 }))
  }, [dispatch, effectiveVertical])

  const items = escalations?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={scope.scopeType === 'VERTICAL' ? scope.scopeId : verticalFilter}
          onChange={e => setVerticalFilter(e.target.value)}
          disabled={scope.scopeType === 'VERTICAL'}
          className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">All Verticals</option>
          {verticals.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <span className="text-xs text-red-500 font-semibold ml-auto">
          {escalations?.total ?? 0} overdue cases
        </span>
      </div>

      <div className="card p-0 overflow-hidden">
        {loadingEscalations && items.length === 0 ? (
          <div className="space-y-px">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-neutral-50 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
                  {['Case', 'Priority', 'Vertical', 'Assignee', 'Due Date', 'Days Overdue'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-red-50/30 dark:hover:bg-red-900/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200 max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      <ImmigrationPriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {item.vertical?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                      {item.assignee?.name ?? 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={daysColor(item.daysOverdue)}>
                        {item.daysOverdue}d overdue
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl mb-1">🎉</p>
                <p className="text-sm text-neutral-400">No overdue cases</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
