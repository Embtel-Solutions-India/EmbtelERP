import { useSelector } from 'react-redux'
import SectionCard from '../../../components/common/SectionCard'

const COLUMN_LABELS = {
  BACKLOG: 'Backlog',
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  REVIEW: 'Review',
  DONE: 'Done',
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

export default function ItRecentActivity() {
  const { overview, loadingOverview } = useSelector((s) => s.it)
  const items = overview?.recentActivity ?? []

  return (
    <SectionCard title="Recent activity">
      {loadingOverview && !overview ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg animate-pulse bg-neutral-100 dark:bg-neutral-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-400">No recent activity</div>
      ) : (
        <div className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-700 dark:text-neutral-200 truncate">
                  {it.actor ? <span className="font-semibold">{it.actor}</span> : 'Someone'}
                  {' · '}
                  <span className="text-neutral-500 dark:text-neutral-400">{it.title}</span>
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300 flex-shrink-0">
                {COLUMN_LABELS[it.column] || it.column}
              </span>
              <span className="text-[11px] text-neutral-400 flex-shrink-0 w-16 text-right">
                {timeAgo(it.updatedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
