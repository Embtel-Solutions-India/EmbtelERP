import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Save } from '@mui/icons-material'
import PageHeader from '../../../components/common/PageHeader'
import { addTask } from '../../../redux/slices/taskSlice'
import { fetchLeads } from '../../../redux/slices/leadSlice'
import { TASK_TYPES, TASK_RESULTS } from '../constants/salesLookups'

function Field({ label, children, required, full }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}

const Section = ({ title, children }) => (
  <div className="card p-5">
    <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 mb-4">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
)

const Text = (props) => <input {...props} className="input-field" />
const Select = ({ children, ...props }) => <select {...props} className="input-field">{children}</select>

const PRIORITY_OPTS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const EMPTY = {
  leadId: '', title: '', taskType: TASK_TYPES[0], dueDate: '', dueTime: '',
  priority: 'medium', description: '',
  taskResult: '', nextFollowUpDate: '', outcomeNotes: '',
}

export default function TaskForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { list: leads } = useSelector((s) => s.leads)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { dispatch(fetchLeads()) }, [dispatch])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: form.title,
      leadId: form.leadId || null,
      taskType: form.taskType || null,
      dueDate: form.dueDate || null,
      dueTime: form.dueTime || null,
      priority: form.priority,
      description: form.description || null,
      // Outcome (optional at creation; filled when completing)
      taskResult: form.taskResult || null,
      nextFollowUpDate: form.nextFollowUpDate || null,
      outcomeNotes: form.outcomeNotes || null,
      // Assigned To auto = current executive (server-side); no assigneeId sent.
    }
    try {
      await dispatch(addTask(payload)).unwrap()
      navigate('/sales/tasks')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create task')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <PageHeader
        title="Create Task"
        subtitle="Schedule a follow-up — auto-assigned to you"
        breadcrumbs={['Sales', 'Tasks', 'New']}
      />

      {error && (
        <div className="card p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Task Information">
          <Field label="Task ID">
            <Text value="Auto-generated" disabled />
          </Field>
          <Field label="Related Lead">
            <Select value={form.leadId} onChange={(e) => set('leadId', e.target.value)}>
              <option value="">— None —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.email ? ` (${l.email})` : ''}</option>
              ))}
            </Select>
          </Field>
          <Field label="Task Title" required>
            <Text value={form.title} required onChange={(e) => set('title', e.target.value)} placeholder="e.g. Call to confirm documents" />
          </Field>
          <Field label="Task Type">
            <Select value={form.taskType} onChange={(e) => set('taskType', e.target.value)}>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Due Date">
            <Text type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </Field>
          <Field label="Due Time">
            <Text type="time" value={form.dueTime} onChange={(e) => set('dueTime', e.target.value)} />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITY_OPTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </Field>
          <Field label="Assigned To">
            <Text value={user?.name ? `${user.name} (you)` : 'You'} disabled />
          </Field>
          <Field label="Description" full>
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className="input-field" placeholder="Task details…" />
          </Field>
        </Section>

        <Section title="Outcome (fill when completing the task)">
          <Field label="Task Result">
            <Select value={form.taskResult} onChange={(e) => set('taskResult', e.target.value)}>
              <option value="">— Pending —</option>
              {TASK_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Next Follow-up Date">
            <Text type="date" value={form.nextFollowUpDate} onChange={(e) => set('nextFollowUpDate', e.target.value)} />
          </Field>
          <Field label="Notes" full>
            <textarea rows={3} value={form.outcomeNotes} onChange={(e) => set('outcomeNotes', e.target.value)} className="input-field" placeholder="Outcome notes…" />
          </Field>
        </Section>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/sales/tasks')} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
            <Save fontSize="small" /> {saving ? 'Saving…' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  )
}
