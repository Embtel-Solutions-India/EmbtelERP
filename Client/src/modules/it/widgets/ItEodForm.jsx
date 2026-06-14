import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle } from '@mui/icons-material'
import SectionCard from '../../../components/common/SectionCard'
import { fetchItEod, submitItEod } from '../redux/itSlice'

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export default function ItEodForm() {
  const dispatch = useDispatch()
  const { eod, submitting } = useSelector((s) => s.it)
  const [form, setForm] = useState({ reportDate: todayInput(), completed: '', pending: '', blockers: '', tomorrow: '' })
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => { dispatch(fetchItEod()) }, [dispatch])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.completed.trim()) return
    const res = await dispatch(submitItEod(form))
    if (!res.error) {
      setShowSuccess(true)
      setForm({ reportDate: todayInput(), completed: '', pending: '', blockers: '', tomorrow: '' })
      setTimeout(() => setShowSuccess(false), 4000)
    }
  }

  const field = (label, key, placeholder) => (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">{label}</label>
      <textarea
        value={form[key]}
        onChange={set(key)}
        placeholder={placeholder}
        className="w-full min-h-[64px] resize-y rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SectionCard title="End-of-day report" subtitle="Share progress with your team lead">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Date</label>
              <input
                type="date"
                value={form.reportDate}
                onChange={set('reportDate')}
                className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            {field('Tasks completed today', 'completed', 'e.g. Finished Twilio integration endpoint, wrote unit tests…')}
            {field('Tasks pending / in progress', 'pending', 'e.g. BillingRecord migration needs review…')}
            {field('Blockers', 'blockers', 'e.g. Waiting on Twilio test credentials…')}
            {field("Tomorrow's plan", 'tomorrow', 'e.g. Push Twilio to review, start vault encryption…')}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.completed.trim()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit EOD report'}
              </button>
              <AnimatePresence>
                {showSuccess && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <CheckCircle style={{ fontSize: 16 }} /> Report submitted
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="My recent reports">
        {eod.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-400">No reports submitted yet</div>
        ) : (
          <div className="space-y-3">
            {eod.map((r) => (
              <div key={r.id} className="rounded-xl border border-neutral-100 dark:border-neutral-700 p-3">
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  {new Date(r.reportDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-neutral-700 dark:text-neutral-200 line-clamp-2">{r.completed}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
