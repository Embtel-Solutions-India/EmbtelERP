import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Search, Edit, Delete, CallSplit, History as HistoryIcon, SwapHoriz } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import PageHeader from '../../../../components/common/PageHeader'
import StatCard from '../../../../components/common/StatCard'
import SchemaForm from '../../../../components/common/SchemaForm'
import { FaBullseye, FaCheckCircle, FaHourglassHalf, FaPercent } from 'react-icons/fa'
import {
  fetchSalesTargets, fetchTargetSummary, fetchAssignableUsers, fetchTargetHistory,
  createTarget, updateTarget, cancelTarget,
} from '../../../../redux/slices/salesTargetSlice'
import {
  targetFormSections, targetFormSchema, targetDefaultValues, buildTargetInitialValues, toTargetPayload,
  ALL_METRICS, METRIC_LABELS, CATEGORY_LABELS, TARGET_CATEGORIES, TARGET_STATUSES, TARGET_STATUS_COLORS,
  isCurrencyMetric,
} from '../targetFormConfig'
import { formatCurrency } from '../../../../utils'

const fmtValue = (metric, v) => (isCurrencyMetric(metric) ? formatCurrency(v) : Number(v).toLocaleString())

function ProgressBar({ pct }) {
  const color = pct >= 100 ? 'from-emerald-500 to-green-500' : pct >= 50 ? 'from-primary-500 to-purple-500' : 'from-amber-500 to-orange-500'
  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}

export default function TargetPerformance() {
  const dispatch = useDispatch()
  const { list, summary, assignable, history, loading, error } = useSelector((s) => s.salesTargets)
  const { user } = useSelector((s) => s.auth)
  const activePerspective = useSelector((s) => s.perspective?.current)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [breakdownParent, setBreakdownParent] = useState(null)
  const [historyFor, setHistoryFor] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')

  useEffect(() => {
    dispatch(fetchSalesTargets())
    dispatch(fetchTargetSummary())
    dispatch(fetchAssignableUsers())
  }, [dispatch, activePerspective])

  const salesRole = summary?.salesRole
  const canCreateTopLevel = salesRole === 'VERTICAL_MANAGER' || salesRole === 'HEAD_PLUS'
  const isSalesHead = salesRole === 'SALES_HEAD'

  const assignableOptions = useMemo(
    () => assignable.map((u) => ({ value: u.id, label: `${u.name}${u.designation ? ` (${u.designation})` : ''}` })),
    [assignable],
  )

  const filtered = useMemo(() => {
    let rows = [...list]
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter((t) => [t.name, t.targetCode, t.assigneeName].some((f) => f?.toLowerCase().includes(q)))
    if (categoryFilter) rows = rows.filter((t) => t.category === categoryFilter)
    if (statusFilter) rows = rows.filter((t) => t.effectiveStatus === statusFilter)
    rows.sort((a, b) => {
      if (sortBy === 'progress') return b.progressPct - a.progressPct
      if (sortBy === 'endDate') return new Date(a.endDate) - new Date(b.endDate)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
    return rows
  }, [list, search, categoryFilter, statusFilter, sortBy])

  const openCreate = () => { setEditing(null); setBreakdownParent(null); setFormOpen(true) }
  const openBreakdown = (parent) => { setEditing(null); setBreakdownParent(parent); setFormOpen(true) }
  const openEdit = (t) => { setEditing(t); setBreakdownParent(null); setFormOpen(true) }
  const openHistory = (t) => { setHistoryFor(t); dispatch(fetchTargetHistory(t.id)) }

  const initialValues = useMemo(() => {
    if (editing) return buildTargetInitialValues(editing)
    if (breakdownParent) {
      return {
        ...targetDefaultValues,
        name: `${breakdownParent.name} — split`,
        category: breakdownParent.category,
        metric: breakdownParent.metric,
        startDate: String(breakdownParent.startDate).slice(0, 10),
        endDate: String(breakdownParent.endDate).slice(0, 10),
      }
    }
    return { ...targetDefaultValues }
  }, [editing, breakdownParent])

  const handleSubmit = async (values) => {
    if (editing) {
      await dispatch(updateTarget({ id: editing.id, ...toTargetPayload(values) }))
    } else {
      await dispatch(createTarget(toTargetPayload(values, { parentTargetId: breakdownParent?.id })))
    }
    dispatch(fetchTargetSummary())
    setFormOpen(false); setEditing(null); setBreakdownParent(null)
  }

  const handleCancel = (t) => {
    if (window.confirm(`Cancel target "${t.name}"?`)) {
      dispatch(cancelTarget(t.id)).then(() => dispatch(fetchTargetSummary()))
    }
  }

  const totals = summary?.totals
  const cards = [
    { label: 'Total Targets', value: totals?.count ?? 0, Icon: FaBullseye, color: 'text-primary-600' },
    { label: 'Avg Achievement', value: `${totals?.avgProgressPct ?? 0}%`, Icon: FaPercent, color: 'text-purple-600' },
    { label: 'Completed', value: totals?.completed ?? 0, Icon: FaCheckCircle, color: 'text-emerald-600' },
    { label: 'Overdue', value: totals?.overdue ?? 0, Icon: FaHourglassHalf, color: 'text-red-500' },
  ]

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Target Performance"
        subtitle="Track sales targets and achievement"
        breadcrumbs={['Dashboard', 'Targets']}
        actions={canCreateTopLevel ? (
          <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Create Target
          </button>
        ) : null}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card p-4 text-center">
            <div className={`flex justify-center mb-2 ${c.color}`}><c.Icon size={20} /></div>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style={{ fontSize: 18 }} />
          <input type="text" placeholder="Search targets…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
          <option value="">All Types</option>
          {TARGET_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
          <option value="">All Status</option>
          {TARGET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field w-auto min-w-[150px]">
          <option value="createdAt">Newest</option>
          <option value="progress">Progress</option>
          <option value="endDate">Due date</option>
          <option value="name">Name</option>
        </select>
      </div>

      {loading && list.length === 0 ? (
        <div className="card p-10 text-center text-sm text-neutral-500">Loading targets…</div>
      ) : error ? (
        <div className="card p-10 text-center text-sm text-red-500">Failed to load targets: {String(error)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No targets yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            {canCreateTopLevel ? 'Create a target to start tracking achievement.' : 'Targets assigned to you will appear here.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                  {['Target', 'Type / Metric', 'Assignee', 'Progress', 'Achievement', 'Status', 'Period', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
                <AnimatePresence>
                  {filtered.map((t, i) => {
                    const mine = t.assignedToId === user?.id
                    const manageable = t.assignedById === user?.id
                    return (
                      <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 group">
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{t.name}</p>
                          <p className="text-xs font-mono text-neutral-400">{t.targetCode}{t.parentTargetId ? ' • split' : ''}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs text-neutral-600 dark:text-neutral-300">{CATEGORY_LABELS[t.category]}</p>
                          <p className="text-xs text-neutral-400">{METRIC_LABELS[t.metric] || t.metric}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-neutral-500">{t.assigneeName}</td>
                        <td className="px-5 py-3 w-44">
                          <div className="flex items-center gap-2">
                            <ProgressBar pct={t.progressPct} />
                            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 w-9 text-right">{t.progressPct}%</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1">{fmtValue(t.metric, t.currentValue)} / {fmtValue(t.metric, t.targetValue)}</p>
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200">{fmtValue(t.metric, t.currentValue)}</td>
                        <td className="px-5 py-3"><span className={TARGET_STATUS_COLORS[t.effectiveStatus] || 'badge-neutral'}>{t.effectiveStatus}</span></td>
                        <td className="px-5 py-3 text-xs text-neutral-500 whitespace-nowrap">
                          {String(t.startDate).slice(0, 10)} → {String(t.endDate).slice(0, 10)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isSalesHead && mine && t.effectiveStatus !== 'CANCELLED' && (
                              <Tooltip title="Break down to team">
                                <button onClick={() => openBreakdown(t)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-neutral-700">
                                  <CallSplit style={{ fontSize: 15 }} />
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip title="History">
                              <button onClick={() => openHistory(t)} className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                                <HistoryIcon style={{ fontSize: 15 }} />
                              </button>
                            </Tooltip>
                            {manageable && t.effectiveStatus !== 'CANCELLED' && (
                              <>
                                <Tooltip title="Edit">
                                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-neutral-700">
                                    <Edit style={{ fontSize: 15 }} />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Cancel target">
                                  <button onClick={() => handleCancel(t)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-neutral-700">
                                    <Delete style={{ fontSize: 15 }} />
                                  </button>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit / Breakdown modal */}
      <SchemaForm
        open={formOpen}
        title={editing ? 'Edit Target' : breakdownParent ? 'Break Down Target' : 'Create Target'}
        subtitle={editing ? 'Update target details' : breakdownParent ? `Distribute "${breakdownParent.name}" to your team` : 'Define and assign a new sales target'}
        sections={targetFormSections(ALL_METRICS)}
        schema={targetFormSchema}
        defaultValues={initialValues}
        mode={editing ? 'edit' : 'create'}
        submitLabel={editing ? 'Save Changes' : breakdownParent ? 'Assign' : 'Create Target'}
        searchOptionsByField={{ assignedToId: assignableOptions }}
        onClose={() => { setFormOpen(false); setEditing(null); setBreakdownParent(null) }}
        onSubmit={handleSubmit}
      />

      {/* History drawer */}
      <AnimatePresence>
        {historyFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 px-4 backdrop-blur-sm"
            onClick={() => setHistoryFor(null)}>
            <motion.div initial={{ scale: 0.97, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 16 }}
              onClick={(e) => e.stopPropagation()} className="card w-full max-w-lg max-h-[80vh] overflow-y-auto p-5">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1">Target History</h3>
              <p className="text-xs text-neutral-400 mb-4">{historyFor.name} • {historyFor.targetCode}</p>
              {history.length === 0 ? (
                <p className="text-sm text-neutral-400">No history yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-neutral-700 dark:text-neutral-200">
                          {h.action.replace(/_/g, ' ')}
                          {h.actor ? ` — ${h.actor.firstName} ${h.actor.lastName}` : ''}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {new Date(h.createdAt).toLocaleString()}
                          {h.previousValue != null && h.newValue != null ? ` • ${h.previousValue} → ${h.newValue}` : h.newValue != null ? ` • ${h.newValue}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 text-right">
                <button onClick={() => setHistoryFor(null)} className="btn-secondary text-sm">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
