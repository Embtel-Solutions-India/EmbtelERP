import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, RadioButtonUnchecked, AccessTime, Warning } from '@mui/icons-material'
import { FaCheckCircle } from 'react-icons/fa'
import { toggleTask } from '../../redux/slices/taskSlice'
import { formatDate } from '../../utils'
import SectionCard from '../common/SectionCard'

const TABS = ['Today', 'Upcoming', 'Overdue']

const PRIORITY_MAP = {
  urgent: 'badge-purple',
  high:   'badge-error',
  medium: 'badge-warning',
  low:    'badge-info',
}

export default function TaskWidget() {
  const dispatch = useDispatch()
  const { list: tasks } = useSelector((s) => s.tasks)
  const [activeTab, setActiveTab] = useState('Today')

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 86400000 - 1)

  const filtered = tasks.filter((t) => {
    const due = new Date(t.dueDate)
    if (activeTab === 'Today')    return due >= startOfDay && due <= endOfDay && t.status !== 'done'
    if (activeTab === 'Upcoming') return due > endOfDay
    if (activeTab === 'Overdue')  return t.status === 'overdue' || (due < startOfDay && t.status !== 'done')
    return true
  }).slice(0, 6)

  const todayCount = tasks.filter(t => {
    const due = new Date(t.dueDate)
    return due >= startOfDay && due <= endOfDay && t.status !== 'done'
  }).length

  return (
    <SectionCard
      title="Task Management"
      subtitle="Organized tasks by priority & timing"
      delay={0.3}
      actions={
        <span className={`badge ${todayCount > 0 ? 'badge-warning' : 'badge-success'}`}>
          {todayCount} due today
        </span>
      }
    >
      <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-gray-700 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <FaCheckCircle className="mx-auto mb-2 text-emerald-400" size={28} />
              <p className="text-sm font-medium">No {activeTab.toLowerCase()} tasks</p>
            </div>
          ) : filtered.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors border ${
                task.status === 'done' ? 'border-transparent opacity-60' : 'border-transparent hover:border-slate-100 dark:hover:border-gray-700'
              }`}
            >
              <button
                onClick={() => dispatch(toggleTask(task.id))}
                className={`flex-shrink-0 mt-0.5 transition-colors ${
                  task.status === 'done' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 hover:text-primary-500'
                }`}
              >
                {task.status === 'done'
                  ? <CheckCircle style={{ fontSize: 20 }} />
                  : <RadioButtonUnchecked style={{ fontSize: 20 }} />
                }
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {task.lead && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{task.lead}</span>
                  )}
                  <span className="flex items-center gap-0.5 text-xs text-slate-400 dark:text-slate-500">
                    {task.status === 'overdue'
                      ? <Warning style={{ fontSize: 12 }} className="text-red-400" />
                      : <AccessTime style={{ fontSize: 12 }} />
                    }
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>

              <span className={`${PRIORITY_MAP[task.priority] || 'badge-info'} flex-shrink-0 text-xs`}>
                {task.priority}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <button className="mt-3 w-full text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline py-2">
        View all tasks →
      </button>
    </SectionCard>
  )
}
