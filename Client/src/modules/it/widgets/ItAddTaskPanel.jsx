import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { Close } from '@mui/icons-material'
import { addItTask } from '../redux/itSlice'

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const COLUMNS = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'Review' },
]
const POINTS = [1, 2, 3, 5, 8, 13]

const EMPTY = { title: '', description: '', priority: 'MEDIUM', storyPoints: 5, column: 'BACKLOG', prdRef: '', dueDate: '' }

export default function ItAddTaskPanel({ open, onClose }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      priority: form.priority,
      storyPoints: form.storyPoints ? Number(form.storyPoints) : null,
      column: form.column,
      prdRef: form.prdRef || null,
      dueDate: form.dueDate || null,
    }
    const res = await dispatch(addItTask(payload))
    setSaving(false)
    if (!res.error) { setForm(EMPTY); onClose() }
  }

  const labelCls = 'block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1'
  const inputCls = 'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-400'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-100 dark:border-neutral-800 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <span className="font-bold text-neutral-800 dark:text-neutral-100">Add task to sprint</span>
              <button onClick={onClose} className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 transition-colors">
                <Close fontSize="small" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className={labelCls}>Task title</label>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Implement BillingRecord migration" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={set('description')} placeholder="What needs to be done? Include acceptance criteria…" className={`${inputCls} min-h-[80px] resize-y`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div>
                <label className={labelCls}>Column</label>
                <select value={form.column} onChange={set('column')} className={inputCls}>
                  {COLUMNS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Related gap / PRD ref</label>
                <input value={form.prdRef} onChange={set('prdRef')} placeholder="e.g. MKT-001, BILL-002, HR-ATT-001" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Due date</label>
                <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inputCls} />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-neutral-100 dark:border-neutral-800">
              <button onClick={handleSubmit} disabled={saving || !form.title.trim()} className="btn-primary text-sm flex-1 disabled:opacity-50">
                {saving ? 'Adding…' : 'Add to sprint'}
              </button>
              <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
