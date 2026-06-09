import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Add, CheckCircle, RadioButtonUnchecked, DeleteOutline, AccessTime, Edit } from '@mui/icons-material'
import { FaExclamationTriangle, FaCalendarDay, FaArrowRight, FaCheckCircle } from 'react-icons/fa'
import { addTask, toggleTask, deleteTask, updateTask, fetchTasks } from '../redux/slices/taskSlice'
import { fetchEmployees } from '../redux/slices/employeeSlice'
import PageHeader from '../components/common/PageHeader'
import ActionFormModal from '../components/common/ActionFormModal'
import { formatDate } from '../utils'

const PRIORITY_MAP = {
  urgent: 'badge-purple', high: 'badge-error', medium: 'badge-warning', low: 'badge-info',
  URGENT: 'badge-purple', HIGH: 'badge-error', MEDIUM: 'badge-warning', LOW: 'badge-info',
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
  const { list: employees } = useSelector((s) => s.employees)
  const [isTaskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    dispatch(fetchTasks())
    dispatch(fetchEmployees())
  }, [dispatch])

  const now = new Date()
  const groups = {
    overdue: tasks.filter(t => {
      const status = String(t.status).toLowerCase()
      if (status === 'completed' || status === 'done') return false
      return t.dueDate && new Date(t.dueDate) < now
    }),
    today: tasks.filter(t => {
      const status = String(t.status).toLowerCase()
      if (status === 'completed' || status === 'done') return false
      if (t.dueDate && new Date(t.dueDate) < now) return false // Already in overdue
      return t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString()
    }),
    upcoming: tasks.filter(t => {
      const status = String(t.status).toLowerCase()
      if (status === 'completed' || status === 'done') return false
      const due = t.dueDate ? new Date(t.dueDate) : null
      return due && due.toDateString() !== now.toDateString() && due > now
    }),
    done: tasks.filter(t => {
      const status = String(t.status).toLowerCase()
      return status === 'completed' || status === 'done'
    }),
  }

  const handleCreateOrUpdateTask = (values) => {
    const payload = {
      title: values.title,
      description: values.description || '',
      priority: values.priority,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      assigneeId: values.assigneeId || null,
      status: values.status || 'todo',
    }

    if (editingTask) {
      dispatch(updateTask({ id: editingTask.id, ...payload })).then(() => {
        setTaskFormOpen(false)
        setEditingTask(null)
      })
    } else {
      dispatch(addTask(payload)).then(() => {
        setTaskFormOpenOpen(false)
      })
    }
  }

  const handleEditClick = (task) => {
    setEditingTask(task)
    setTaskFormOpen(true)
  }

  const taskFields = [
    { name: 'title', label: 'Task Title', required: true, fullWidth: true },
    { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: ['urgent', 'high', 'medium', 'low'].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })),
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: ['todo', 'in_progress', 'completed', 'cancelled'].map((value) => ({ value, label: value.replace('_', ' ').toUpperCase() })),
    },
    { name: 'dueDate', label: 'Due Date', type: 'datetime-local' },
    ...(employees.length ? [{
      name: 'assigneeId',
      label: 'Assignee',
      type: 'select',
      options: [
        { value: '', label: 'Unassigned' },
        ...employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName} (${emp.designation})` }))
      ],
      fullWidth: true
    }] : [])
  ]

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.filter(t => String(t.status).toLowerCase() !== 'completed' && String(t.status).toLowerCase() !== 'done').length} active tasks`}
        breadcrumbs={['Dashboard', 'Tasks']}
        actions={<button onClick={() => { setEditingTask(null); setTaskFormOpen(true); }} className="btn-primary text-sm flex items-center gap-2"><Add fontSize="small" /> Create Task</button>}
      />

      <ActionFormModal
        open={isTaskFormOpen}
        title={editingTask ? "Edit Task" : "Create Task"}
        subtitle={editingTask ? "Modify details of this task" : "Add an actionable item to your daily workflow"}
        fields={taskFields}
        initialValues={editingTask ? {
          title: editingTask.title,
          description: editingTask.description || '',
          priority: editingTask.priority,
          status: editingTask.status,
          dueDate: editingTask.dueDate ? editingTask.dueDate.substring(0, 16) : '',
          assigneeId: editingTask.assigneeId || '',
        } : { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assigneeId: '' }}
        submitLabel={editingTask ? "Save Changes" : "Create Task"}
        onClose={() => { setTaskFormOpen(false); setEditingTask(null); }}
        onSubmit={handleCreateOrUpdateTask}
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
                {groups[key].map((task, i) => {
                  const isCompleted = String(task.status).toLowerCase() === 'completed' || String(task.status).toLowerCase() === 'done'
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`card p-4 flex items-start gap-3 ${isCompleted ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => dispatch(toggleTask(task.id))}
                        className={isCompleted ? 'text-emerald-500 mt-0.5' : 'text-slate-300 hover:text-primary-500 mt-0.5'}
                      >
                        {isCompleted ? <CheckCircle /> : <RadioButtonUnchecked />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {task.assignee && (
                            <span className="text-xs text-slate-400">— {task.assignee.firstName} {task.assignee.lastName}</span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <AccessTime style={{ fontSize: 12 }} /> {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${PRIORITY_MAP[task.priority] || 'badge-info'}`}>{task.priority}</span>
                        <button onClick={() => handleEditClick(task)} className="text-slate-300 hover:text-amber-500 transition-colors">
                          <Edit fontSize="small" />
                        </button>
                        <button onClick={() => dispatch(deleteTask(task.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                          <DeleteOutline fontSize="small" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
