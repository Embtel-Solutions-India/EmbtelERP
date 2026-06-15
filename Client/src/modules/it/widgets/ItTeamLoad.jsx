import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchItTeamLoad } from '../redux/itSlice'

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

// Workload per IT member, derived from active-sprint task counts (no capacity
// column). Members with no active work still appear (available capacity).
export default function ItTeamLoad() {
  const dispatch = useDispatch()
  const { teamLoad, loadingTeamLoad } = useSelector((s) => s.it)

  useEffect(() => { dispatch(fetchItTeamLoad()) }, [dispatch])

  if (loadingTeamLoad && teamLoad.length === 0) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-2xl animate-pulse bg-neutral-100 dark:bg-neutral-800" />)}
      </div>
    )
  }

  if (teamLoad.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No team members</p>
        <p className="mt-1 text-xs text-neutral-400">The IT team has no active members yet.</p>
      </div>
    )
  }

  const overloaded = teamLoad.filter((m) => m.overloaded).length
  const available = teamLoad.filter((m) => m.totalActive === 0).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4"><div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{teamLoad.length}</div><div className="text-xs text-neutral-400">Team members</div></div>
        <div className="card p-4"><div className="text-2xl font-bold text-amber-500">{overloaded}</div><div className="text-xs text-neutral-400">Overloaded</div></div>
        <div className="card p-4"><div className="text-2xl font-bold text-emerald-500">{available}</div><div className="text-xs text-neutral-400">Available capacity</div></div>
      </div>

      <div className="card divide-y divide-neutral-100 dark:divide-neutral-800">
        {teamLoad.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3">
            <span className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials(m.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                {m.name}
                {m.designation && <span className="ml-2 text-[11px] font-normal text-neutral-400">· {m.designation}</span>}
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {m.openCount} open · {m.inProgressCount} in progress · {m.storyPointsActive} pts
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-sm font-semibold ${m.overloaded ? 'text-amber-500' : 'text-neutral-600 dark:text-neutral-300'}`}>
                {m.totalActive} active
              </div>
              {m.overloaded && (
                <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Overloaded
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
