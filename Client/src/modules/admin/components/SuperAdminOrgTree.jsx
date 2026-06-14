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
  AccountTreeOutlined as OrgIcon,
} from '@mui/icons-material'
import { fetchOrgTree } from '../redux/orgExplorerSlice'
import OrgEmployeeDrawer from './OrgEmployeeDrawer'

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

/**
 * Super-Admin-only collapsible Organization Explorer for the sidebar.
 * Real org tree (Business → Vertical → Team → Employee) from the backend;
 * clicking an employee opens the shared read-only overview drawer. Renders
 * nothing when the sidebar is collapsed to icons.
 */
export default function SuperAdminOrgTree({ collapsed }) {
  const dispatch = useDispatch()
  const { tree, loadingTree } = useSelector((s) => s.orgExplorer)
  const [open, setOpen] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => { dispatch(fetchOrgTree()) }, [dispatch])

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
                    <EmpRow emp={biz.head} depth={1} activeId={selectedId} onSelect={setSelectedId} />
                    {(biz.verticals ?? []).map((v) => (
                      <Branch key={v.id} label={v.name} icon={<VerticalIcon style={{ fontSize: 14 }} className="text-amber-500 flex-shrink-0" />} depth={1}>
                        <EmpRow emp={v.manager} depth={2} activeId={selectedId} onSelect={setSelectedId} />
                        {(v.teams ?? []).map((t) => (
                          <Branch key={t.id} label={t.name} sublabel={(t.members?.length ?? 0) + (t.manager ? 1 : 0)} icon={<TeamIcon style={{ fontSize: 14 }} className="text-emerald-500 flex-shrink-0" />} depth={2}>
                            <EmpRow emp={t.manager} depth={3} activeId={selectedId} onSelect={setSelectedId} />
                            {(t.members ?? []).map((m) => (
                              <EmpRow key={m.id} emp={m} depth={3} activeId={selectedId} onSelect={setSelectedId} />
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

      <OrgEmployeeDrawer employeeId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
