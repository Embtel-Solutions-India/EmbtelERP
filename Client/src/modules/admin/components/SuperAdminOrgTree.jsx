import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Business as BusinessIcon,
  AccountTree as VerticalIcon,
  Group as TeamIcon,
  Person as PersonIcon,
  ExpandMore,
  ChevronRight,
  Close as CloseIcon,
  AccountTreeOutlined as OrgIcon,
} from '@mui/icons-material'
import { fetchOrgTree, fetchOrgEmployee, fetchOrgEmployeeTasks, clearOrgEmployee } from '../redux/orgExplorerSlice'

// ─── Generic expandable branch (business / vertical / team) ───────────────────
function Branch({ label, sublabel, icon, depth, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 py-1.5 rounded-lg text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300 transition-colors"
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: '8px' }}
      >
        <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
          {open ? <ExpandMore style={{ fontSize: 13 }} /> : <ChevronRight style={{ fontSize: 13 }} />}
        </span>
        {icon}
        <span className="truncate font-semibold leading-none flex-1 text-left">{label}</span>
        {sublabel != null && (
          <span className="text-[9px] text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {sublabel}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Employee leaf (clickable → drill-down) ───────────────────────────────────
function EmpRow({ emp, depth, activeId, onSelect }) {
  if (!emp) return null
  const isActive = activeId === emp.id
  return (
    <button
      onClick={() => onSelect(emp.id)}
      className={`w-full flex items-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors ${
        isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                 : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
      }`}
      style={{ paddingLeft: `${8 + depth * 12 + 18}px`, paddingRight: '8px' }}
    >
      <PersonIcon style={{ fontSize: 13 }} className="text-purple-500 flex-shrink-0" />
      <span className="truncate leading-none flex-1 text-left">{emp.name}</span>
      {emp.designation && (
        <span className="text-[9px] text-neutral-400 truncate max-w-[80px] flex-shrink-0">{emp.designation}</span>
      )}
    </button>
  )
}

// ─── Employee drill-down drawer (read-only, real data) ────────────────────────
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

const PERIODS = ['daily', 'weekly', 'monthly']

function EmployeeDrawer({ open, emp, loading, onClose, tasks, loadingTasks, period, onPeriodChange }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 z-[60]" />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-[61] bg-white dark:bg-neutral-900 shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Employee Overview</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
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

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Leads</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Stat label="Assigned" value={emp.leads.total} />
                    <Stat label="Converted" value={emp.leads.converted} accent="text-emerald-600 dark:text-emerald-400" />
                    <Stat label="Conversion" value={`${emp.leads.conversionRate}%`} />
                  </div>
                </div>

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
                          onClick={() => onPeriodChange(p)}
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

/**
 * Super-Admin-only collapsible Organization Explorer for the sidebar.
 * Real org tree (Business → Vertical → Team → Employee) from the backend;
 * clicking an employee opens a read-only overview drawer. Renders nothing when
 * the sidebar is collapsed to icons.
 */
export default function SuperAdminOrgTree({ collapsed }) {
  const dispatch = useDispatch()
  const { tree, loadingTree, employee, loadingEmployee, tasks, loadingTasks } = useSelector((s) => s.orgExplorer)
  const [open, setOpen] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [period, setPeriod] = useState('daily')

  useEffect(() => { dispatch(fetchOrgTree()) }, [dispatch])

  // Fetch the selected employee's task details whenever the employee or period changes.
  useEffect(() => {
    if (selectedId) dispatch(fetchOrgEmployeeTasks({ id: selectedId, period }))
  }, [dispatch, selectedId, period])

  const handleSelect = (id) => {
    setSelectedId(id)
    setPeriod('daily')
    dispatch(fetchOrgEmployee(id))
  }
  const closeDrawer = () => {
    setSelectedId(null)
    setPeriod('daily')
    dispatch(clearOrgEmployee())
  }

  if (collapsed) return null

  const businesses = tree?.businesses ?? []

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <button onClick={() => setOpen((o) => !o)} className="w-full px-3.5 py-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
          <OrgIcon style={{ fontSize: 13 }} /> Organization Explorer
        </span>
        {open ? <ExpandMore style={{ fontSize: 14 }} className="text-neutral-400" /> : <ChevronRight style={{ fontSize: 14 }} className="text-neutral-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
            <div className="pb-2 px-1.5 max-h-72 overflow-y-auto scrollbar-thin">
              {loadingTree && businesses.length === 0 ? (
                <div className="px-3 py-3 text-xs text-neutral-400 text-center">Loading…</div>
              ) : businesses.length === 0 ? (
                <div className="px-3 py-3 text-xs text-neutral-400 text-center">No organization data</div>
              ) : (
                businesses.map((biz) => (
                  <Branch key={biz.id} label={biz.name} icon={<BusinessIcon style={{ fontSize: 14 }} className="text-blue-500 flex-shrink-0" />} depth={0}>
                    <EmpRow emp={biz.head} depth={1} activeId={selectedId} onSelect={handleSelect} />
                    {(biz.verticals ?? []).map((v) => (
                      <Branch key={v.id} label={v.name} icon={<VerticalIcon style={{ fontSize: 14 }} className="text-amber-500 flex-shrink-0" />} depth={1}>
                        <EmpRow emp={v.manager} depth={2} activeId={selectedId} onSelect={handleSelect} />
                        {(v.teams ?? []).map((t) => (
                          <Branch key={t.id} label={t.name} sublabel={(t.members?.length ?? 0) + (t.manager ? 1 : 0)} icon={<TeamIcon style={{ fontSize: 14 }} className="text-emerald-500 flex-shrink-0" />} depth={2}>
                            <EmpRow emp={t.manager} depth={3} activeId={selectedId} onSelect={handleSelect} />
                            {(t.members ?? []).map((m) => (
                              <EmpRow key={m.id} emp={m} depth={3} activeId={selectedId} onSelect={handleSelect} />
                            ))}
                          </Branch>
                        ))}
                      </Branch>
                    ))}
                  </Branch>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EmployeeDrawer
        open={!!selectedId}
        emp={employee}
        loading={loadingEmployee}
        onClose={closeDrawer}
        tasks={tasks}
        loadingTasks={loadingTasks}
        period={period}
        onPeriodChange={setPeriod}
      />
    </div>
  )
}
