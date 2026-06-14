import ItPriorityBadge from './ItPriorityBadge'

const COLUMN_OPTIONS = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'DONE', label: 'Done' },
]

function initials(person) {
  if (!person) return '?'
  const f = person.firstName?.[0] || ''
  const l = person.lastName?.[0] || ''
  return (f + l).toUpperCase() || '?'
}

export default function ItTaskCard({ task, myId, onMove }) {
  const isMine = task.assignee?.id && task.assignee.id === myId
  return (
    <div className="rounded-xl border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
      {isMine && (
        <span className="inline-block mb-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
          Yours
        </span>
      )}
      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-snug mb-2">
        {task.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {task.storyPoints != null && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
            {task.storyPoints} pts
          </span>
        )}
        <ItPriorityBadge priority={task.priority} />
        {task.prdRef && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-50 text-neutral-400 dark:bg-neutral-700/50 dark:text-neutral-500">
            {task.prdRef}
          </span>
        )}
        {task.assignee && (
          <span
            className="ml-auto w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
            title={`${task.assignee.firstName} ${task.assignee.lastName}`.trim()}
          >
            {initials(task.assignee)}
          </span>
        )}
      </div>

      {onMove && (
        <select
          value=""
          onChange={(e) => { if (e.target.value) onMove(e.target.value) }}
          className="mt-2 w-full text-[11px] rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700/50 text-neutral-500 dark:text-neutral-400 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          title="Move to another column"
        >
          <option value="">Move to…</option>
          {COLUMN_OPTIONS.filter((o) => o.value !== task.column).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}
