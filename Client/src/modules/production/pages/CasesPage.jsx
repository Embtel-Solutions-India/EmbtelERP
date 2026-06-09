import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Search, Edit, Delete, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import PageHeader from '../../../components/common/PageHeader'
import ActionFormModal from '../../../components/common/ActionFormModal'
import { fetchTasks, addTask, updateTask, deleteTask } from '../../../redux/slices/taskSlice'
import { fetchEmployees } from '../../../redux/slices/employeeSlice'
import { formatDate } from '../../../utils'

const STATUS_COLORS = {
  todo: 'badge-primary',
  in_progress: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-error',
}

export default function CasesPage() {
  const dispatch = useDispatch()
  const { list: tasks, loading } = useSelector((s) => s.tasks)
  const { list: employees } = useSelector((s) => s.employees)
  const { user } = useSelector((s) => s.auth)
  const [search, setSearch] = useState('')
  const [isFormOpen, setFormOpen] = useState(false)
  const [editingCase, setEditingCase] = useState(null)

  useEffect(() => {
    dispatch(fetchTasks())
    dispatch(fetchEmployees())
  }, [dispatch])

  // Filter tasks to show documentation-related tasks (treating all tasks within production business unit or titled with "Operations" or "File" as cases)
  const cases = tasks.filter(t => {
    // Treat all scoped tasks as cases for production module
    return true
  })

  const filteredCases = cases.filter(c => {
    const query = search.toLowerCase()
    return (
      c.title?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    )
  })

  const level = Number(user?.roleLevel ?? user?.employeeLevel ?? 0)
  const designation = (user?.designation || '').toLowerCase()
  const canDelete = level >= 2 || designation.includes('manager') || designation.includes('owner') || designation.includes('admin')

  const handleFormSubmit = (values) => {
    const payload = {
      title: values.title,
      description: values.description || '',
      priority: values.priority,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      assigneeId: values.assigneeId || null,
      status: values.status || 'todo',
    }

    if (editingCase) {
      dispatch(updateTask({ id: editingCase.id, ...payload })).then(() => {
        setFormOpen(false)
        setEditingCase(null)
      })
    } else {
      dispatch(addTask(payload)).then(() => setFormOpen(false))
    }
  }

  const handleToggleStatus = (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed'
    dispatch(updateTask({ id: task.id, status: nextStatus }))
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      dispatch(deleteTask(id))
    }
  }

  const caseFields = [
    { name: 'title', label: 'Case / Task Title', required: true, fullWidth: true },
    { name: 'description', label: 'Client Details & Requirements', type: 'textarea', fullWidth: true },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: ['urgent', 'high', 'medium', 'low'].map((v) => ({ value: v, label: v.toUpperCase() })),
      required: true,
    },
    {
      name: 'status',
      label: 'Case Stage',
      type: 'select',
      options: ['todo', 'in_progress', 'completed', 'cancelled'].map((v) => ({ value: v, label: v.replace('_', ' ').toUpperCase() })),
      required: true,
    },
    { name: 'dueDate', label: 'Due Date / Deadline', type: 'datetime-local' },
    ...(employees.length ? [{
      name: 'assigneeId',
      label: 'Assigned Officer',
      type: 'select',
      options: [
        { value: '', label: 'Unassigned' },
        ...employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName} (${emp.designation})` }))
      ],
      fullWidth: true
    }] : [])
  ]

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Production Cases"
        subtitle="Track documentation, filings, and visa processing cases"
        breadcrumbs={['Dashboard', 'Cases']}
        actions={
          <button onClick={() => { setEditingCase(null); setFormOpen(true); }} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Create Case
          </button>
        }
      />

      <ActionFormModal
        open={isFormOpen}
        title={editingCase ? "Edit Case" : "Register Case"}
        subtitle="Manage case title, assignment, and completion stage"
        fields={caseFields}
        initialValues={editingCase ? {
          title: editingCase.title,
          description: editingCase.description || '',
          priority: editingCase.priority,
          status: editingCase.status,
          dueDate: editingCase.dueDate ? editingCase.dueDate.substring(0, 16) : '',
          assigneeId: editingCase.assigneeId || '',
        } : { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assigneeId: '' }}
        submitLabel={editingCase ? "Save Details" : "Register Case"}
        onClose={() => { setFormOpen(false); setEditingCase(null); }}
        onSubmit={handleFormSubmit}
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search cases by client, title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Cases Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                {['Case', 'Stage / Status', 'Priority', 'Assigned Officer', 'Deadline', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
              {loading && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-sm text-slate-400">Loading cases...</td>
                </tr>
              )}
              {!loading && filteredCases.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-sm text-slate-400">No active cases.</td>
                </tr>
              )}
              {!loading && filteredCases.map((task, i) => {
                const isCompleted = task.status === 'completed' || task.status === 'done'
                return (
                  <motion.tr key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group text-sm ${isCompleted ? 'opacity-65' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-2.5">
                        <button onClick={() => handleToggleStatus(task)} className={isCompleted ? 'text-emerald-500 mt-0.5' : 'text-slate-300 mt-0.5 hover:text-indigo-600'}>
                          {isCompleted ? <CheckCircle style={{ fontSize: 18 }} /> : <RadioButtonUnchecked style={{ fontSize: 18 }} />}
                        </button>
                        <div>
                          <p className={`font-semibold text-slate-800 dark:text-slate-100 ${isCompleted ? 'line-through text-slate-400' : ''}`}>{task.title}</p>
                          {task.description && <p className="text-xs text-slate-400 mt-0.5 max-w-md line-clamp-1">{task.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={STATUS_COLORS[task.status] || 'badge-primary'}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold uppercase text-[10px] tracking-wider text-slate-600 dark:text-slate-400">{task.priority}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{task.dueDate ? formatDate(task.dueDate) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip title="Edit Case">
                          <button onClick={() => setEditingCase(task) || setFormOpen(true)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 dark:hover:bg-gray-700 transition-colors">
                            <Edit style={{ fontSize: 16 }} />
                          </button>
                        </Tooltip>
                        {canDelete && (
                          <Tooltip title="Delete Case">
                            <button onClick={() => handleDelete(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-gray-700 transition-colors">
                              <Delete style={{ fontSize: 16 }} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
