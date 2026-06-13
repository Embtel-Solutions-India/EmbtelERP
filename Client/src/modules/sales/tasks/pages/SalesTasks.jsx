import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Edit, Delete, CheckCircle } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import PageHeader from '../../../../components/common/PageHeader'
import SchemaForm from '../../../../components/common/SchemaForm'
import { fetchLeads } from '../../../../redux/slices/leadSlice'
import {
  fetchSalesTasks, addSalesTask, updateSalesTask, deleteSalesTask,
} from '../../../../redux/slices/salesTaskSlice'
import {
  buildTaskFormSections, taskFormSchema, taskDefaultValues, buildTaskInitialValues, toTaskPayload,
  TASK_TYPE_LABELS, TASK_RESULT_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from '../taskFormConfig'
import { salesTaskService } from '../../../../services/salesTaskService'
import { formatDate } from '../../../../utils'

const TABS = [
  { id: 'mine', label: 'My Tasks' },
  { id: 'assigned', label: 'Assigned Tasks' },
]

export default function SalesTasks() {
  const dispatch = useDispatch()
  const { list: tasks, loading, error } = useSelector((s) => s.salesTasks)
  const { list: leads } = useSelector((s) => s.leads)
  const { user } = useSelector((s) => s.auth)
  const activePerspective = useSelector((s) => s.perspective?.current)
  const [isFormOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [assignableUsers, setAssignableUsers] = useState([])
  const [activeTab, setActiveTab] = useState('mine')

  const myId = user?.id
  const level = Number(user?.employeeLevel ?? user?.roleLevel ?? 0)
  const canAssign = level >= 2

  useEffect(() => {
    dispatch(fetchSalesTasks())
    dispatch(fetchLeads())
  }, [dispatch, activePerspective])

  // Direct reports the manager can assign to (drives the "Assign To" picker).
  useEffect(() => {
    if (!canAssign) { setAssignableUsers([]); return }
    let active = true
    salesTaskService.getAssignableUsers()
      .then((res) => { if (active) setAssignableUsers(res.data || []) })
      .catch(() => { if (active) setAssignableUsers([]) })
    return () => { active = false }
  }, [canAssign, activePerspective])

  const leadOptions = useMemo(
    () => leads.map((l) => ({ value: l.id, label: `${l.leadCode ? `${l.leadCode} — ` : ''}${l.name}` })),
    [leads],
  )

  const assigneeOptions = useMemo(
    () => assignableUsers.map((u) => ({
      value: u.id,
      label: `${u.firstName} ${u.lastName}${u.designation ? ` (${u.designation})` : ''}`.trim(),
    })),
    [assignableUsers],
  )

  const formSections = useMemo(
    () => buildTaskFormSections(canAssign ? assigneeOptions : []),
    [canAssign, assigneeOptions],
  )

  // My Tasks = assigned to me; Assigned Tasks = I assigned to a subordinate.
  const visibleTasks = useMemo(() => {
    if (!canAssign || activeTab === 'mine') {
      return tasks.filter((t) => t.assignee?.id === myId)
    }
    return tasks.filter((t) => t.createdBy?.id === myId && t.assignee?.id !== myId)
  }, [tasks, activeTab, canAssign, myId])

  const initialValues = useMemo(
    () => (editingTask ? buildTaskInitialValues(editingTask) : { ...taskDefaultValues }),
    [editingTask],
  )

  const handleSubmit = async (values) => {
    const payload = toTaskPayload(values)
    if (editingTask) {
      await dispatch(updateSalesTask({ id: editingTask.id, ...payload }))
    } else {
      await dispatch(addSalesTask(payload))
    }
    setFormOpen(false)
    setEditingTask(null)
  }

  const handleComplete = (task) => dispatch(updateSalesTask({ id: task.id, status: 'COMPLETED' }))
  const handleDelete = (id) => { if (window.confirm('Delete this task?')) dispatch(deleteSalesTask(id)) }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Tasks"
        subtitle={`${visibleTasks.length} follow-up tasks`}
        breadcrumbs={['Dashboard', 'Tasks']}
        actions={
          <button onClick={() => { setEditingTask(null); setFormOpen(true) }} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Add Task
          </button>
        }
      />

      {/* My Tasks / Assigned Tasks toggle — only managers assign, so the second
          tab is hidden for executives and interns. */}
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

      <SchemaForm
        open={isFormOpen}
        title={editingTask ? 'Update Task' : 'Add Task'}
        subtitle={editingTask ? 'Update task and outcome' : 'Create a follow-up task linked to a lead'}
        sections={formSections}
        schema={taskFormSchema}
        defaultValues={initialValues}
        mode={editingTask ? 'edit' : 'create'}
        submitLabel={editingTask ? 'Save Changes' : 'Add Task'}
        leadOptions={leadOptions}
        onClose={() => { setFormOpen(false); setEditingTask(null) }}
        onSubmit={handleSubmit}
      />

      {loading ? (
        <div className="card p-10 text-center text-sm text-neutral-500">Loading tasks…</div>
      ) : error ? (
        <div className="card p-10 text-center text-sm text-red-500">Failed to load tasks: {String(error)}</div>
      ) : visibleTasks.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            {canAssign && activeTab === 'assigned' ? 'No tasks assigned to your team yet' : 'No tasks yet'}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {canAssign && activeTab === 'assigned'
              ? 'Assign a task to one of your direct reports to see it here.'
              : 'Create a follow-up task to keep your leads moving.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                  {['Task ID', 'Title', 'Type', 'Lead', 'Due', 'Priority', 'Status', 'Result', 'Next Follow-up', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
                <AnimatePresence>
                  {visibleTasks.map((t, i) => (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group">
                      <td className="px-5 py-3 text-xs font-mono text-neutral-500 whitespace-nowrap">{t.taskCode}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">{t.title}</td>
                      <td className="px-5 py-3 text-xs text-neutral-500">{TASK_TYPE_LABELS[t.taskType] || t.taskType}</td>
                      <td className="px-5 py-3 text-xs text-neutral-500">{t.lead ? `${t.lead.leadCode} — ${t.lead.name}` : '—'}</td>
                      <td className="px-5 py-3 text-xs text-neutral-500 whitespace-nowrap">{t.dueDate ? formatDate(t.dueDate) : '—'}</td>
                      <td className="px-5 py-3"><span className={TASK_PRIORITY_COLORS[t.priority] || 'badge-neutral'}>{t.priority}</span></td>
                      <td className="px-5 py-3"><span className={TASK_STATUS_COLORS[t.status] || 'badge-neutral'}>{TASK_STATUS_LABELS[t.status] || t.status}</span></td>
                      <td className="px-5 py-3 text-xs text-neutral-500">{t.result ? (TASK_RESULT_LABELS[t.result] || t.result) : '—'}</td>
                      <td className="px-5 py-3 text-xs text-neutral-500 whitespace-nowrap">{t.nextFollowUpDate ? formatDate(t.nextFollowUpDate) : '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!['COMPLETED', 'CANCELLED'].includes(t.status) && (
                            <Tooltip title="Mark complete">
                              <button onClick={() => handleComplete(t)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-neutral-700 transition-colors">
                                <CheckCircle style={{ fontSize: 15 }} />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <button onClick={() => { setEditingTask(t); setFormOpen(true) }} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-neutral-700 transition-colors">
                              <Edit style={{ fontSize: 15 }} />
                            </button>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-neutral-700 transition-colors">
                              <Delete style={{ fontSize: 15 }} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
