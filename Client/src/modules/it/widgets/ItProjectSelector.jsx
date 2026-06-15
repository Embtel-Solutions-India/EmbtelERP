import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchItProjects, fetchItSprint, setActiveProject } from '../redux/itSlice'

// Project pills with per-project progress %. Selecting a project re-fetches the
// board scoped to it; "All projects" (null) restores the full team-wide board.
export default function ItProjectSelector() {
  const dispatch = useDispatch()
  const { projects, activeProjectId, loadingProjects } = useSelector((s) => s.it)

  useEffect(() => { dispatch(fetchItProjects()) }, [dispatch])

  const select = (id) => {
    dispatch(setActiveProject(id))
    dispatch(fetchItSprint(id || undefined))
  }

  if (loadingProjects && projects.length === 0) {
    return <div className="h-16 rounded-2xl animate-pulse bg-neutral-100 dark:bg-neutral-800" />
  }
  if (projects.length === 0) return null

  const pill = (active) =>
    `text-left rounded-2xl border p-3 transition-colors ${
      active
        ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30'
        : 'border-neutral-100 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600'
    }`

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <button onClick={() => select(null)} className={pill(!activeProjectId)}>
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">All projects</span>
        <p className="text-xs text-neutral-400 mt-1">Whole IT team board</p>
      </button>
      {projects.map((p) => {
        const active = activeProjectId === p.id
        return (
          <button key={p.id} onClick={() => select(p.id)} className={pill(active)}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color || '#6366F1' }} />
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{p.name}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color || '#6366F1' }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-neutral-400">{p.doneTasks}/{p.totalTasks} done</span>
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-300">{p.progress}%</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
