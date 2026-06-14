import { useSelector, useDispatch } from 'react-redux'
import { moveItTask } from '../redux/itSlice'
import ItTaskCard from './ItTaskCard'

const COLUMN_LABELS = {
  BACKLOG: 'Backlog',
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  REVIEW: 'Review',
  DONE: 'Done',
}

function fmtRange(start, end) {
  if (!start || !end) return ''
  const opts = { month: 'short', day: 'numeric' }
  return `${new Date(start).toLocaleDateString('en-US', opts)} – ${new Date(end).toLocaleDateString('en-US', opts)}`
}

export default function ItSprintBoard() {
  const dispatch = useDispatch()
  const { sprint: board, loadingSprint } = useSelector((s) => s.it)
  const myId = useSelector((s) => s.auth.user?.id)
  const sprint = board?.sprint
  const columns = board?.columns ?? []

  const handleMove = (id, column) => dispatch(moveItTask({ id, column }))

  if (loadingSprint && !sprint && columns.every((c) => c.tasks.length === 0)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl h-80 animate-pulse bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No active sprint</p>
        <p className="mt-1 text-xs text-neutral-400">Create a sprint to start planning the board.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sprint header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{sprint.name}</span>
          <span className="text-xs text-neutral-400">·</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{fmtRange(sprint.startDate, sprint.endDate)}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Active</span>
          <span className="ml-auto text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            {sprint.donePoints} / {sprint.targetPoints} pts
          </span>
        </div>
        {sprint.goal && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{sprint.goal}</p>
        )}
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {columns.map((col) => (
          <div key={col.key} className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 p-3 min-h-[120px]">
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {COLUMN_LABELS[col.key] || col.key}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300">
                {col.tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.tasks.map((t) => (
                <ItTaskCard key={t.id} task={t} myId={myId} onMove={(column) => handleMove(t.id, column)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
