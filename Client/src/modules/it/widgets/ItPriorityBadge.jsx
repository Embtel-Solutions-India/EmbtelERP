const PRIORITY_STYLES = {
  CRITICAL: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HIGH:     'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MEDIUM:   'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  LOW:      'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
}

const LABELS = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

export default function ItPriorityBadge({ priority }) {
  if (!priority) return null
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.LOW}`}>
      {LABELS[priority] || priority}
    </span>
  )
}
