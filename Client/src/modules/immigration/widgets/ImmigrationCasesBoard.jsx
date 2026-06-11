import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { fetchImmigrationCases } from '../redux/immigrationSlice'
import ImmigrationPriorityBadge from './ImmigrationPriorityBadge'
import { useImmigrationScope } from '../../../hooks/useImmigrationScope'

const COLUMN_CFG = {
  pending:     { label: 'Pending',     color: '#6366F1', bg: 'bg-indigo-50 dark:bg-indigo-900/10'  },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/10'    },
  completed:   { label: 'Completed',   color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
  cancelled:   { label: 'Cancelled',   color: '#9CA3AF', bg: 'bg-neutral-50 dark:bg-neutral-800'   },
}

function CaseCard({ task }) {
  const isOverdue = task.isOverdue
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-neutral-800 rounded-xl p-3 border shadow-sm mb-2 ${
        isOverdue
          ? 'border-red-200 dark:border-red-800'
          : 'border-neutral-100 dark:border-neutral-700'
      }`}
    >
      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-snug mb-2">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <ImmigrationPriorityBadge priority={task.priority} />
        {task.vertical && (
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full font-medium truncate max-w-[80px]">
            {task.vertical.name}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
        <span>{task.assignee?.name ?? 'Unassigned'}</span>
        {due && (
          <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>
            {isOverdue ? '⚠️ ' : ''}{due}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function Column({ status, tasks }) {
  const cfg = COLUMN_CFG[status] ?? COLUMN_CFG.pending
  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${cfg.bg}`}>
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{cfg.label}</span>
        <span className="ml-auto text-xs font-semibold text-neutral-500">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[200px] pr-1 scrollbar-thin">
        {tasks.map(t => <CaseCard key={t.id} task={t} />)}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-xs text-neutral-300 dark:text-neutral-600">No cases</div>
        )}
      </div>
    </div>
  )
}

export default function ImmigrationCasesBoard() {
  const dispatch = useDispatch()
  const { cases, loadingCases } = useSelector(s => s.immigration)
  const [verticalFilter, setVerticalFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const { verticals } = useSelector(s => s.immigration)
  const scope = useImmigrationScope()

  // When in VERTICAL scope the perspective locks the vertical; otherwise use the dropdown
  const effectiveVertical = scope.scopeType === 'VERTICAL' ? scope.scopeId : (verticalFilter || undefined)

  useEffect(() => {
    dispatch(fetchImmigrationCases({
      verticalId: effectiveVertical,
      priority:   priorityFilter || undefined,
      limit:      200,
    }))
  }, [dispatch, effectiveVertical, priorityFilter])

  const columns = cases?.kanban?.columns ?? []

  return (
    <div className="space-y-4">
      {/* Filter bar */}
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
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="text-xs text-neutral-400 ml-auto">
          {cases?.total ?? 0} total cases
        </span>
      </div>

      {/* Kanban */}
      {loadingCases ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.keys(COLUMN_CFG).map(s => (
            <div key={s} className="min-w-[260px] flex-1">
              <div className="h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse mb-3" />
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse mb-2" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {columns.map(col => (
            <Column key={col.id} status={col.id} tasks={col.tasks} />
          ))}
        </div>
      )}
    </div>
  )
}
