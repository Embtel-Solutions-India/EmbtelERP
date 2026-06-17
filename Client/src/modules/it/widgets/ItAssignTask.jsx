import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CheckCircle, InfoOutlined } from '@mui/icons-material'
import { fetchItProjects, fetchItTeamLoad, addItTask } from '../redux/itSlice'

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const POINTS = [1, 2, 3, 5, 8, 13]
const EMPTY = { title: '', projectId: '', priority: 'MEDIUM', storyPoints: 5, prdRef: '', assigneeId: '' }

const inputCls = 'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-400'
const labelCls = 'block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1'

// Dedicated "Assign task" page: a TL creates a task and hands it to a member
// (create + assign in one action). The server stamps the assigner and notifies
// the recipient. Restricted to managers (level ≥ 2); the server enforces it too.
export default function ItAssignTask() {
  const dispatch = useDispatch()
  const { projects, teamLoad } = useSelector((s) => s.it)
  const canAssign = useSelector((s) => Number(s.auth.user?.roleLevel ?? s.auth.user?.employeeLevel ?? 0) >= 2)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [assignedTo, setAssignedTo] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    dispatch(fetchItProjects())
    dispatch(fetchItTeamLoad())
  }, [dispatch])

  if (!canAssign) {
    return (
      <div className="card p-6 flex items-start gap-3">
        <InfoOutlined className="text-neutral-400" fontSize="small" />
        <div>
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Team leads only</p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Assigning tasks to team members is restricted to team leads and above. You can still create your own tasks from <span className="font-semibold">My tasks</span>.
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.assigneeId) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      projectId: form.projectId || null,
      priority: form.priority,
      storyPoints: form.storyPoints ? Number(form.storyPoints) : null,
      prdRef: form.prdRef || null,
      assigneeId: form.assigneeId,
      column: 'TODO',
    }
    const res = await dispatch(addItTask(payload))
    setSaving(false)
    if (!res.error) {
      const member = teamLoad.find((m) => m.id === form.assigneeId)
      setAssignedTo(member?.name || 'the team member')
      setForm(EMPTY)
      setTimeout(() => setAssignedTo(null), 5000)
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {assignedTo && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-3 text-sm">
          <CheckCircle fontSize="small" /> Task assigned to {assignedTo} — they've been notified.
        </div>
      )}

      <div className="card p-5 space-y-4">
        <div>
          <label className={labelCls}>Task title</label>
          <input value={form.title} onChange={set('title')} placeholder="e.g. Fix billing record migration" className={inputCls} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Project</label>
            <select value={form.projectId} onChange={set('projectId')} className={inputCls}>
              <option value="">— No project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Assign to</label>
            <select value={form.assigneeId} onChange={set('assigneeId')} className={inputCls}>
              <option value="">Select a member…</option>
              {teamLoad.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.designation ? ` · ${m.designation}` : ''} ({m.totalActive} active)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Priority</label>
            <select value={form.priority} onChange={set('priority')} className={inputCls}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p[0] + p.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Story points</label>
            <select value={form.storyPoints} onChange={set('storyPoints')} className={inputCls}>
              {POINTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>PRD ref (gap ID)</label>
            <input value={form.prdRef} onChange={set('prdRef')} placeholder="e.g. BILL-001" className={inputCls} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={handleSubmit} disabled={saving || !form.title.trim() || !form.assigneeId} className="btn-primary text-sm disabled:opacity-50">
            {saving ? 'Assigning…' : 'Assign task'}
          </button>
          <span className="text-xs text-neutral-400">The assignee is notified and the task appears on the board in blue.</span>
        </div>
      </div>
    </div>
  )
}
