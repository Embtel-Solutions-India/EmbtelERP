import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchImmigrationLeads } from '../redux/immigrationSlice'
import ImmigrationPriorityBadge from './ImmigrationPriorityBadge'
import { useImmigrationScope } from '../../../hooks/useImmigrationScope'

const STATUS_COLORS = {
  NEW:         'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  CONTACTED:   'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
  QUALIFIED:   'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  PROPOSAL:    'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
  NEGOTIATION: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  WON:         'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  LOST:        'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
}

const PAGE_SIZE = 20

export default function ImmigrationLeadTable() {
  const dispatch = useDispatch()
  const { leads, loadingLeads, verticals } = useSelector(s => s.immigration)
  const [verticalFilter, setVerticalFilter] = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const [page, setPage]                     = useState(1)
  const scope = useImmigrationScope()
  const effectiveVertical = scope.scopeType === 'VERTICAL' ? scope.scopeId : (verticalFilter || undefined)

  useEffect(() => {
    setPage(1)
    dispatch(fetchImmigrationLeads({
      verticalId: effectiveVertical,
      status:     statusFilter || undefined,
      page: 1,
      limit: PAGE_SIZE,
    }))
  }, [dispatch, effectiveVertical, statusFilter])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    dispatch(fetchImmigrationLeads({
      verticalId: verticalFilter || undefined,
      status:     statusFilter   || undefined,
      page: next,
      limit: PAGE_SIZE,
    }))
  }

  const items = leads?.items ?? []

  return (
    <div className="space-y-4">
      {/* Filters */}
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
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-xs text-neutral-400 ml-auto">{leads?.total ?? 0} leads</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
                {['Status', 'Priority', 'Vertical', 'Assignee', 'Value', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingLeads && items.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-50 dark:border-neutral-800">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-neutral-100 dark:bg-neutral-700 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.map(lead => (
                <tr
                  key={lead.id}
                  className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[lead.status] ?? ''}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ImmigrationPriorityBadge priority={lead.priority} />
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                    {lead.vertical?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                    {lead.assignee?.name ?? 'Unassigned'}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                    ${lead.estimatedValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && !loadingLeads && (
          <div className="text-center py-12 text-sm text-neutral-400">No leads found</div>
        )}

        {leads?.totalPages > page && (
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-700 text-center">
            <button
              onClick={loadMore}
              disabled={loadingLeads}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium disabled:opacity-50"
            >
              {loadingLeads ? 'Loading…' : `Load more (${leads.total - items.length} remaining)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
