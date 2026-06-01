import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Add, CheckCircle, RadioButtonUnchecked, DeleteOutline, AccessTime } from '@mui/icons-material'
import { FaExclamationTriangle, FaCalendarDay, FaArrowRight, FaCheckCircle } from 'react-icons/fa'
import { addTask, toggleTask, deleteTask } from '../redux/slices/taskSlice'
import PageHeader from '../components/common/PageHeader'
import ActionFormModal from '../components/common/ActionFormModal'
import { formatDate } from '../utils'

const PRIORITY_MAP = {
  urgent: 'badge-purple', high: 'badge-error', medium: 'badge-warning', low: 'badge-info',
}

const GROUPS = [
  { key: 'overdue',  label: 'Overdue',  Icon: FaExclamationTriangle, color: 'text-red-600 dark:text-red-400'     },
  { key: 'today',    label: 'Today',    Icon: FaCalendarDay,         color: 'text-amber-600 dark:text-amber-400'  },
  { key: 'upcoming', label: 'Upcoming', Icon: FaArrowRight,          color: 'text-primary-600 dark:text-primary-400'},
  { key: 'done',     label: 'Done',     Icon: FaCheckCircle,         color: 'text-emerald-600 dark:text-emerald-400'},
]

export default function Tasks() {
  const dispatch = useDispatch()
  const { list: tasks } = useSelector((s) => s.tasks)
  const [isTaskFormOpen, setTaskFormOpen] = useState(false)

  const now = new Date()
  const groups = {
    overdue:  tasks.filter(t => t.status === 'overdue'),
    today:    tasks.filter(t => {
      if (t.status === 'done' || t.status === 'overdue') return false
      return new Date(t.dueDate).toDateString() === now.toDateString()
    }),
    upcoming: tasks.filter(t => {
      if (t.status === 'done' || t.status === 'overdue') return false
      const due = new Date(t.dueDate)
      return due.toDateString() !== now.toDateString() && due > now
    }),
    done: tasks.filter(t => t.status === 'done'),
  }
  const handleCreateTask = (values) => {
    const dueDate = new Date(values.dueDate)

    dispatch(addTask({
      id: Date.now(),
      title: values.title,
      priority: values.priority,
      status: dueDate < new Date() ? 'overdue' : 'todo',
      dueDate: dueDate.toISOString(),
      category: values.category,
      lead: values.lead || null,
    }))
  }

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.filter(t => t.status !== 'done').length} active tasks`}
        breadcrumbs={['Dashboard', 'Tasks']}
        actions={<button onClick={() => setTaskFormOpen(true)} className="btn-primary text-sm flex items-center gap-2"><Add fontSize="small" /> Create Task</button>}
      />

      <ActionFormModal
        open={isTaskFormOpen}
        title="Create Task"
        subtitle="Add an actionable item to your daily workflow"
        fields={[
          { name: 'title', label: 'Task Title', required: true, fullWidth: true },
          {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            options: ['urgent', 'high', 'medium', 'low'].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })),
          },
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: ['sales', 'followup', 'admin', 'training'].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })),
          },
          { name: 'dueDate', label: 'Due Date', type: 'datetime-local', required: true },
          { name: 'lead', label: 'Related Lead', fullWidth: true },
        ]}
        initialValues={{ title: '', priority: 'medium', category: 'sales', dueDate: '', lead: '' }}
        submitLabel="Create Task"
        onClose={() => setTaskFormOpen(false)}
        onSubmit={handleCreateTask}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',   value: tasks.length,           color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Overdue', value: groups.overdue.length,  color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20'         },
          { label: 'Today',   value: groups.today.length,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20'     },
          { label: 'Done',    value: groups.done.length,     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(s => (
          <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {GROUPS.map(({ key, label, Icon, color }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={color} size={16} />
              <h3 className={`font-bold text-base ${color}`}>{label}</h3>
              <span className="badge badge-primary">{groups[key].length}</span>
            </div>
            {groups[key].length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic ml-6">No {label.toLowerCase()} tasks</p>
            ) : (
              <div className="space-y-2">
                {groups[key].map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`card p-4 flex items-start gap-3 ${task.status === 'done' ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => dispatch(toggleTask(task.id))}
                      className={task.status === 'done' ? 'text-emerald-500 mt-0.5' : 'text-slate-300 hover:text-primary-500 mt-0.5'}
                    >
                      {task.status === 'done' ? <CheckCircle /> : <RadioButtonUnchecked />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {task.lead && <span className="text-xs text-slate-400">— {task.lead}</span>}
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <AccessTime style={{ fontSize: 12 }} /> {formatDate(task.dueDate)}
                        </span>
                        <span className="badge badge-info text-xs capitalize">{task.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${PRIORITY_MAP[task.priority] || 'badge-info'}`}>{task.priority}</span>
                      <button onClick={() => dispatch(deleteTask(task.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                        <DeleteOutline fontSize="small" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
