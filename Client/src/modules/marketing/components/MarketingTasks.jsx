import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Add, CheckCircle, RadioButtonUnchecked, DeleteOutline, AccessTime } from '@mui/icons-material'
import { FaExclamationTriangle, FaCalendarDay, FaArrowRight, FaCheckCircle } from 'react-icons/fa'
import {
  fetchMarketingTasks, createMarketingTask, toggleMarketingTask, deleteMarketingTask,
} from '../redux/marketingTaskSlice'
import { marketingTaskService } from '../../../services/marketingTaskService'
import PageHeader from '../../../components/common/PageHeader'
import ActionFormModal from '../../../components/common/ActionFormModal'
import { formatDate } from '../../../utils'

const PRIORITY_MAP = {
  urgent: 'badge-purple', high: 'badge-error', medium: 'badge-warning', low: 'badge-info',
}

const GROUPS = [
  { key: 'overdue',  label: 'Overdue',  Icon: FaExclamationTriangle, color: 'text-red-600 dark:text-red-400'     },
  { key: 'today',    label: 'Today',    Icon: FaCalendarDay,         color: 'text-amber-600 dark:text-amber-400'  },
  { key: 'upcoming', label: 'Upcoming', Icon: FaArrowRight,          color: 'text-primary-600 dark:text-primary-400'},
  { key: 'done',     label: 'Done',     Icon: FaCheckCircle,         color: 'text-emerald-600 dark:text-emerald-400'},
]

const TABS = [
  { id: 'mine', label: 'My Tasks' },
  { id: 'assigned', label: 'Assigned Tasks' },
]

export default function MarketingTasks() {
  const dispatch = useDispatch()
  const { list: tasks, loading } = useSelector((s) => s.marketingTasks)
  const { user } = useSelector((s) => s.auth)
  const activePerspective = useSelector((s) => s.perspective?.current)
  const [isTaskFormOpen, setTaskFormOpen] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState([])
  const [activeTab, setActiveTab] = useState('mine')

  const myId = user?.id
  const level = Number(user?.employeeLevel ?? user?.roleLevel ?? 0)
  const canAssign = level >= 2

  useEffect(() => {
    dispatch(fetchMarketingTasks())
  }, [dispatch, activePerspective])

  useEffect(() => {
    if (!canAssign) { setAssignableUsers([]); return }
    let active = true
    marketingTaskService.getAssignableUsers()
      .then((res) => { if (active) setAssignableUsers(res.data || []) })
      .catch(() => { if (active) setAssignableUsers([]) })
    return () => { active = false }
  }, [canAssign, activePerspective])

  // My Tasks = assigned to me; Assigned Tasks = I assigned to a team member.
  const visibleTasks = useMemo(() => {
    if (!canAssign || activeTab === 'mine') {
      return tasks.filter((t) => t.assigneeId === myId)
    }
    return tasks.filter((t) => t.createdById === myId && t.assigneeId !== myId)
  }, [tasks, activeTab, canAssign, myId])

  const now = new Date()
  const groups = {
    overdue:  visibleTasks.filter(t => t.status === 'overdue' || (t.status !== 'done' && new Date(t.dueDate) < now && new Date(t.dueDate).toDateString() !== now.toDateString())),
    today:    visibleTasks.filter(t => {
      if (t.status === 'done') return false
      const due = new Date(t.dueDate)
      if (due < now && due.toDateString() !== now.toDateString()) return false // It is overdue
      return due.toDateString() === now.toDateString()
    }),
    upcoming: visibleTasks.filter(t => {
      if (t.status === 'done') return false
      const due = new Date(t.dueDate)
      if (due < now) return false
      return due.toDateString() !== now.toDateString()
    }),
    done: visibleTasks.filter(t => t.status === 'done'),
  }

  const assigneeField = canAssign
    ? [{
        name: 'assignee',
        label: 'Assign Task To',
        type: 'select',
        options: [
          { value: '', label: 'Myself' },
          ...assignableUsers.map((u) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName}${u.designation ? ` (${u.designation})` : ''}`.trim(),
          })),
        ],
        fullWidth: true,
        helperText: 'You can assign tasks to your team members.',
      }]
    : [{
        name: 'assignee',
        label: 'Assign Task To',
        type: 'select',
        options: [{ value: '', label: 'Myself' }],
        disabled: true,
        fullWidth: true,
        helperText: 'Only managers can assign tasks to other team members.',
      }]

  const handleCreateTask = (values) => {
    const payload = {
      businessId: user?.businessId,
      title: values.title,
      priority: values.priority,
      status: 'TODO',
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      description: values.description || null,
    }
    if (values.assignee) payload.assignedToId = values.assignee
    dispatch(createMarketingTask(payload))
    setTaskFormOpen(false)
  }

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <PageHeader
        title="Marketing Tasks"
        subtitle={`${visibleTasks.filter(t => t.status !== 'done').length} active marketing tasks`}
        breadcrumbs={['Dashboard', 'Tasks']}
        actions={<button onClick={() => setTaskFormOpen(true)} className="btn-primary text-sm flex items-center gap-2"><Add fontSize="small" /> Create Task</button>}
      />

      {canAssign && (
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1 max-w-xs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <ActionFormModal
        open={isTaskFormOpen}
        title="Create Marketing Task"
        subtitle="Add an actionable item to your marketing workflow"
        fields={[
          { name: 'title', label: 'Task Title', required: true, fullWidth: true },
          {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            options: ['urgent', 'high', 'medium', 'low'].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })),
          },
          { name: 'dueDate', label: 'Due Date', type: 'datetime-local', required: true },
          { name: 'description', label: 'Description (Optional)', type: 'textarea', fullWidth: true },
          ...assigneeField,
        ]}
        initialValues={{ title: '', priority: 'medium', dueDate: '', description: '', assignee: '' }}
        submitLabel="Create Task"
        onClose={() => setTaskFormOpen(false)}
        onSubmit={handleCreateTask}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',   value: visibleTasks.length,    color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Overdue', value: groups.overdue.length,  color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20'         },
          { label: 'Today',   value: groups.today.length,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20'     },
          { label: 'Done',    value: groups.done.length,     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(s => (
          <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.label}</p>
          </div>
        ))}
      </div>

      {loading && visibleTasks.length === 0 ? (
        <div className="card p-10 text-center text-sm text-neutral-500">Loading tasks…</div>
      ) : (
        <div className="space-y-8">
          {GROUPS.map(({ key, label, Icon, color }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={color} size={16} />
                <h3 className={`font-bold text-base ${color}`}>{label}</h3>
                <span className="badge badge-primary">{groups[key].length}</span>
              </div>
              {groups[key].length === 0 ? (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 italic ml-6">No {label.toLowerCase()} tasks</p>
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
                        onClick={() => dispatch(toggleMarketingTask(task))}
                        className={task.status === 'done' ? 'text-emerald-500 mt-0.5' : 'text-neutral-300 hover:text-primary-500 mt-0.5'}
                      >
                        {task.status === 'done' ? <CheckCircle /> : <RadioButtonUnchecked />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${task.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-100'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {task.lead && <span className="text-xs text-neutral-400">— {task.lead}</span>}
                          <span className="flex items-center gap-1 text-xs text-neutral-400">
                            <AccessTime style={{ fontSize: 12 }} /> {formatDate(task.dueDate)}
                          </span>
                          {canAssign && activeTab === 'assigned' && (
                            <span className="text-xs text-neutral-400">→ {task.assignee}</span>
                          )}
                          {task.category && <span className="badge badge-info text-xs capitalize">{task.category}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${PRIORITY_MAP[task.priority] || 'badge-info'}`}>{task.priority}</span>
                        <button onClick={() => dispatch(deleteMarketingTask(task.id))} className="text-neutral-300 hover:text-red-500 transition-colors">
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
      )}
    </div>
  )
}
