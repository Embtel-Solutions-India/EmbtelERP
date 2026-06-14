import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Close as CloseIcon } from '@mui/icons-material'
import { fetchOrgEmployee, fetchOrgEmployeeTasks, clearOrgEmployee } from '../redux/orgExplorerSlice'

const PERIODS = ['daily', 'weekly', 'monthly']

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">{label}</p>
      <p className={`text-base font-bold ${accent ?? 'text-neutral-800 dark:text-neutral-100'}`}>{value}</p>
    </div>
  )
}
const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
    <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[55%] text-right">{value ?? '—'}</span>
  </div>
)

/**
 * Shared, self-fetching Super-Admin employee overview + task-details drawer.
 * Pass an `employeeId` to open it; it loads the overview and period-filtered
 * tasks from the super-admin endpoints. Reused by the sidebar Organization tree
 * and the Users directory so there is a single source of truth for this view.
 */
export default function OrgEmployeeDrawer({ employeeId, onClose }) {
  const dispatch = useDispatch()
  const { employee: emp, loadingEmployee: loading, tasks, loadingTasks } = useSelector((s) => s.orgExplorer)
  const [period, setPeriod] = useState('daily')

  useEffect(() => {
    if (employeeId) dispatch(fetchOrgEmployee(employeeId))
    setPeriod('daily')
  }, [dispatch, employeeId])

  useEffect(() => {
    if (employeeId) dispatch(fetchOrgEmployeeTasks({ id: employeeId, period }))
  }, [dispatch, employeeId, period])

  const handleClose = () => {
    dispatch(clearOrgEmployee())
    onClose?.()
  }

  return (
    <AnimatePresence>
      {employeeId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="fixed inset-0 bg-black/40 z-[60]" />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-[61] bg-white dark:bg-neutral-900 shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Employee Overview</h3>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
                <CloseIcon style={{ fontSize: 18 }} />
              </button>
            </div>

            {loading && !emp ? (
              <div className="p-5 space-y-3">
                <div className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}</div>
              </div>
            ) : emp ? (
              <div className="p-5 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-neutral-800 dark:text-neutral-100 truncate">{emp.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{emp.designation ?? '—'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Identity</p>
                  <InfoRow label="Role" value={emp.role} />
                  <InfoRow label="Business" value={emp.business} />
                  <InfoRow label="Vertical" value={emp.vertical} />
                  <InfoRow label="Team" value={emp.team} />
                  <InfoRow label="Reporting Manager" value={emp.reportingManager} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Tasks</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Stat label="Total" value={emp.tasks.total} />
                    <Stat label="Completed" value={emp.tasks.completed} accent="text-emerald-600 dark:text-emerald-400" />
                    <Stat label="Pending" value={emp.tasks.pending} accent="text-amber-600 dark:text-amber-400" />
                    <Stat label="Overdue" value={emp.tasks.overdue} accent="text-red-600 dark:text-red-400" />
                    <Stat label="Completion" value={`${emp.tasks.completionRate}%`} />
                  </div>
                </div>

                {emp.domain !== 'IT' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Leads</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Stat label="Assigned" value={emp.leads.total} />
                      <Stat label="Converted" value={emp.leads.converted} accent="text-emerald-600 dark:text-emerald-400" />
                      <Stat label="Conversion" value={`${emp.leads.conversionRate}%`} />
                    </div>
                  </div>
                )}

                {/* Task details — daily / weekly / monthly */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Task Details {tasks?.total != null && <span className="text-neutral-300 dark:text-neutral-600">({tasks.total})</span>}
                    </p>
                    <div className="flex gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                      {PERIODS.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors ${
                            period === p ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                         : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  {loadingTasks ? (
                    <div className="py-4 text-center text-xs text-neutral-400">Loading…</div>
                  ) : (tasks?.tasks?.length ?? 0) === 0 ? (
                    <p className="py-4 text-center text-xs text-neutral-400">No tasks added this {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {tasks.tasks.map((t) => (
                        <div key={t.id} className="rounded-lg border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">{t.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 flex-shrink-0 capitalize">{t.relation}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-neutral-400">
                            {t.taskType && <span className="text-indigo-500 dark:text-indigo-400">{t.taskType}</span>}
                            <span className="capitalize">{String(t.status).replace('_', ' ')}</span>
                            {t.priority && <span className="capitalize">· {t.priority}</span>}
                            {t.dueDate && <span>· due {new Date(t.dueDate).toLocaleDateString()}</span>}
                            <span className="ml-auto">{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 italic">Read-only monitoring · live data</p>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-neutral-400">Employee not found.</div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
