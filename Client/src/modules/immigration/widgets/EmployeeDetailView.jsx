import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Close as CloseIcon } from '@mui/icons-material'
import { fetchImmigrationEmployeeDetail, clearEmployeeDetail } from '../redux/immigrationSlice'
import ImmigrationHealthBadge, { HealthScoreRing } from './ImmigrationHealthBadge'

function Stat({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${accent ?? 'text-neutral-800 dark:text-neutral-100'}`}>{value}</p>
      {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ComponentBar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

const Chip = ({ children }) =>
  children ? (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
      {children}
    </span>
  ) : null

/**
 * Slide-in drawer showing a single employee's performance dashboard.
 * Uses the existing GET /immigration/team/:id endpoint (real data only).
 * Render always-mounted; pass employeeId=null to close (AnimatePresence handles exit).
 */
export default function EmployeeDetailView({ employeeId, onClose }) {
  const dispatch = useDispatch()
  const { employeeDetail: emp, loadingEmployeeDetail } = useSelector(s => s.immigration)

  useEffect(() => {
    if (employeeId) dispatch(fetchImmigrationEmployeeDetail(employeeId))
    return () => { if (employeeId) dispatch(clearEmployeeDetail()) }
  }, [dispatch, employeeId])

  const comps = emp?.healthScore?.components

  return (
    <AnimatePresence>
      {employeeId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white dark:bg-neutral-900 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Employee Detail</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-500"
              >
                <CloseIcon style={{ fontSize: 18 }} />
              </button>
            </div>

            {loadingEmployeeDetail && !emp ? (
              <div className="p-5 space-y-4">
                <div className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : emp ? (
              <div className="p-5 space-y-6">
                {/* Identity */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-neutral-800 dark:text-neutral-100 truncate">{emp.name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{emp.designation ?? '—'}</p>
                  </div>
                </div>

                {/* Org chips */}
                <div className="flex flex-wrap gap-2">
                  <Chip>{emp.vertical}</Chip>
                  <Chip>{emp.department}</Chip>
                  <Chip>{emp.team}</Chip>
                </div>

                {/* Health score */}
                <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 border border-indigo-100 dark:border-indigo-800 p-4">
                  <HealthScoreRing score={emp.healthScore.score} band={emp.healthScore.band} size={56} />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Overall Health</p>
                    <ImmigrationHealthBadge band={emp.healthScore.band} score={emp.healthScore.score} showScore />
                  </div>
                </div>

                {/* Cases / Tasks */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Cases & Tasks</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Total Tasks"   value={emp.taskCount} />
                    <Stat label="Completed"     value={emp.completedTasks} accent="text-emerald-600 dark:text-emerald-400" />
                    <Stat label="Pending"       value={emp.pendingTasks} accent="text-amber-600 dark:text-amber-400" />
                    <Stat label="Overdue"       value={emp.overdueTasks} accent="text-red-600 dark:text-red-400" />
                    <Stat label="Completion"    value={`${emp.completionRate}%`} />
                  </div>
                </div>

                {/* Leads / Conversion */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Leads & Conversion</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Leads Assigned"  value={emp.leadsAssigned} />
                    <Stat label="Leads Converted" value={emp.leadsConverted} accent="text-emerald-600 dark:text-emerald-400" />
                    <Stat label="Conversion Rate" value={`${emp.conversionRate}%`} />
                  </div>
                </div>

                {/* Health components breakdown */}
                {comps && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Health Breakdown</p>
                    <div className="space-y-3">
                      <ComponentBar label="Revenue Growth"     value={comps.revenueGrowth} />
                      <ComponentBar label="Lead Conversion"    value={comps.leadConversion} />
                      <ComponentBar label="Task Completion"    value={comps.taskCompletion} />
                      <ComponentBar label="On-Time Completion" value={comps.onTimeCompletion} />
                      <ComponentBar label="Approval Rate"      value={comps.approvalRate} />
                    </div>
                  </div>
                )}
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
