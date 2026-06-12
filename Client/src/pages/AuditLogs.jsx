import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Search, FilterAltOff, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import PageHeader from '../components/common/PageHeader'
import { fetchAuditLogs, setAuditFilter, resetAuditFilters } from '../redux/slices/auditSlice'
import { formatDate } from '../utils'

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PAYMENT_STATUS_CHANGE',
  'ASSIGNMENT_CHANGE', 'PERSPECTIVE_SWITCH', 'LOGIN', 'LOGOUT',
]

const ENTITY_TYPES = ['SalesLead', 'Task', 'Employee']

const ACTION_COLORS = {
  CREATE: 'badge-success',
  UPDATE: 'badge-info',
  DELETE: 'badge-error',
  STATUS_CHANGE: 'badge-warning',
  PAYMENT_STATUS_CHANGE: 'badge-purple',
  ASSIGNMENT_CHANGE: 'badge-primary',
  PERSPECTIVE_SWITCH: 'badge-neutral',
  LOGIN: 'badge-neutral',
  LOGOUT: 'badge-neutral',
}

const SORTABLE = [
  { key: 'createdAt', label: 'Timestamp' },
  { key: 'action', label: 'Action' },
  { key: 'entityType', label: 'Entity Type' },
  { key: 'entityName', label: 'Entity Name' },
]

function snippet(value) {
  if (value === null || value === undefined) return '—'
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  return str.length > 80 ? `${str.slice(0, 80)}…` : str
}

export default function AuditLogs() {
  const dispatch = useDispatch()
  const { logs, total, page, pageSize, filters, loading, error } = useSelector((s) => s.audit)

  useEffect(() => {
    dispatch(fetchAuditLogs(filters))
  }, [dispatch, filters])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const setFilter = (patch) => dispatch(setAuditFilter(patch))

  const toggleSort = (key) => {
    if (filters.sort === key) {
      setFilter({ sort: key, order: filters.order === 'asc' ? 'desc' : 'asc' })
    } else {
      setFilter({ sort: key, order: 'desc' })
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Audit Logs"
        subtitle={`${total} recorded ${total === 1 ? 'event' : 'events'}`}
        breadcrumbs={['Dashboard', 'Audit Logs']}
        actions={
          <button
            onClick={() => dispatch(resetAuditFilters())}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <FilterAltOff fontSize="small" /> Reset
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search user, entity, ID…"
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            className="input-field pl-9"
          />
        </div>
        <select value={filters.action} onChange={(e) => setFilter({ action: e.target.value })} className="input-field w-auto min-w-[150px]">
          <option value="">All Actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filters.entityType} onChange={(e) => setFilter({ entityType: e.target.value })} className="input-field w-auto min-w-[140px]">
          <option value="">All Entities</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="text"
          placeholder="Department"
          value={filters.department}
          onChange={(e) => setFilter({ department: e.target.value })}
          className="input-field w-auto min-w-[130px]"
        />
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilter({ dateFrom: e.target.value })} className="input-field w-auto" title="From date" />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilter({ dateTo: e.target.value })} className="input-field w-auto" title="To date" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                {['User', 'Role', 'Department'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
                {SORTABLE.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap cursor-pointer select-none hover:text-primary-600"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {filters.sort === key && (filters.order === 'asc'
                        ? <ArrowUpward style={{ fontSize: 12 }} />
                        : <ArrowDownward style={{ fontSize: 12 }} />)}
                    </span>
                  </th>
                ))}
                {['Entity ID', 'Previous Value', 'New Value'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{log.user}</p>
                    {log.userEmail && <p className="text-xs text-neutral-400">{log.userEmail}</p>}
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{log.role || '—'}</td>
                  <td className="px-5 py-3 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{log.department || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={ACTION_COLORS[log.action] || 'badge-neutral'}>{String(log.action).replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-neutral-600 dark:text-neutral-300 whitespace-nowrap">{log.entityType}</td>
                  <td className="px-5 py-3 text-xs text-neutral-700 dark:text-neutral-200 whitespace-nowrap">{log.entityName || '—'}</td>
                  <td className="px-5 py-3 text-xs text-neutral-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-5 py-3 text-xs text-neutral-400 font-mono">{log.entityId ? String(log.entityId).slice(0, 10) : '—'}</td>
                  <td className="px-5 py-3 text-xs text-neutral-500 dark:text-neutral-400 max-w-[200px] truncate" title={log.before ? JSON.stringify(log.before, null, 2) : ''}>{snippet(log.before)}</td>
                  <td className="px-5 py-3 text-xs text-neutral-500 dark:text-neutral-400 max-w-[200px] truncate" title={log.after ? JSON.stringify(log.after, null, 2) : ''}>{snippet(log.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="text-center py-12 text-neutral-400 bg-white dark:bg-neutral-800">Loading audit logs…</div>
        )}
        {!loading && error && (
          <div className="text-center py-12 text-red-500 bg-white dark:bg-neutral-800">Failed to load audit logs: {String(error)}</div>
        )}
        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-12 text-neutral-400 bg-white dark:bg-neutral-800">No audit events match the active filters.</div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Page {page} of {totalPages} · {total} events
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setFilter({ page: page - 1 })}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setFilter({ page: page + 1 })}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
