import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Add, Close } from '@mui/icons-material'
import {
  fetchItMyTasks, addItSelfTask, updateItSelfTask, deleteItSelfTask, moveItTask,
} from '../redux/itSlice'
import ItTaskCard from './ItTaskCard'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'self', label: 'Self-assigned' },
]
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const COLUMNS = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'DONE', label: 'Done' },
]
const POINTS = [1, 2, 3, 5, 8, 13]
const EMPTY = { title: '', priority: 'MEDIUM', storyPoints: 3, column: 'TODO', prdRef: '' }

const inputCls = 'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-400'
const labelCls = 'block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1'

export default function ItMyTasks() {
  const dispatch = useDispatch()
  const { myTasks, loadingMyTasks } = useSelector((s) => s.it)
  const myId = useSelector((s) => s.auth.user?.id)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null) // null = closed; {id?, ...fields} = open
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => { dispatch(fetchItMyTasks('all')) }, [dispatch])

  const tasks = myTasks.filter((t) => {
    if (filter === 'assigned') return t.isAssignedToMe
    if (filter === 'self') return !t.isAssignedToMe
    return true
  })

  const handleMove = (task, column) => {
    // Self tasks stay owner-private (self-task endpoint); assigned tasks move
    // through the shared flow (sprint task endpoint).
    if (task.isAssignedToMe) dispatch(moveItTask({ id: task.id, column }))
    else dispatch(updateItSelfTask({ id: task.id, column }))
  }

  const submit = async () => {
    if (!form.title.trim()) return
    const payload = {
      title: form.title.trim(),
      priority: form.priority,
      storyPoints: form.storyPoints ? Number(form.storyPoints) : null,
      column: form.column,
      prdRef: form.prdRef || null,
    }
    const res = form.id
      ? await dispatch(updateItSelfTask({ id: form.id, ...payload }))
      : await dispatch(addItSelfTask(payload))
    if (!res.error) setForm(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-white dark:bg-neutral-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setForm({ ...EMPTY })} className="btn-primary text-xs flex items-center gap-1.5 ml-auto">
          <Add fontSize="small" /> New personal task
        </button>
      </div>

      {form && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {form.id ? 'Edit personal task' : 'New personal task'}
            </span>
            <button onClick={() => setForm(null)} className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Close fontSize="small" />
            </button>
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input value={form.title} onChange={set('title')} placeholder="What are you working on?" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={form.priority} onChange={set('priority')} className={inputCls}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Points</label>
              <select value={form.storyPoints} onChange={set('storyPoints')} className={inputCls}>
                {POINTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Column</label>
              <select value={form.column} onChange={set('column')} className={inputCls}>
                {COLUMNS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>PRD ref</label>
              <input value={form.prdRef} onChange={set('prdRef')} placeholder="optional" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={!form.title.trim()} className="btn-primary text-sm disabled:opacity-50">
              {form.id ? 'Save' : 'Create'}
            </button>
            <button onClick={() => setForm(null)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loadingMyTasks && tasks.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl animate-pulse bg-neutral-100 dark:bg-neutral-800" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No tasks</p>
          <p className="mt-1 text-xs text-neutral-400">Nothing here yet — assigned work and your own tasks will appear in this list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {tasks.map((t) => (
            <div key={t.id}>
              <ItTaskCard task={t} myId={myId} onMove={(column) => handleMove(t, column)} />
              {!t.isAssignedToMe && (
                <div className="flex gap-3 mt-1 px-1">
                  <button onClick={() => setForm({ id: t.id, title: t.title, priority: t.priority, storyPoints: t.storyPoints ?? 3, column: t.column, prdRef: t.prdRef || '' })} className="text-[11px] font-semibold text-neutral-500 hover:text-indigo-600">Edit</button>
                  <button onClick={() => dispatch(deleteItSelfTask(t.id))} className="text-[11px] font-semibold text-neutral-500 hover:text-red-600">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
