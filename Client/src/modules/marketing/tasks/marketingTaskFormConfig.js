import { z } from 'zod'

// Marketing analog of the Sales taskFormConfig. MarketingTask has a leaner data
// model than SalesTask (no taskType / related-lead / outcome fields), so the
// form is scoped to what the backend actually supports: title, related
// campaign, priority, due date/time, status and description. The shared
// SchemaForm + add/edit UX is kept identical to Sales.

export const TASK_PRIORITIES = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]
export const TASK_PRIORITY_LABELS = Object.fromEntries(TASK_PRIORITIES.map((o) => [o.value, o.label]))
export const TASK_PRIORITY_COLORS = {
  urgent: 'badge-purple', high: 'badge-error', medium: 'badge-warning', low: 'badge-info',
}

export const TASK_STATUSES = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]
export const TASK_STATUS_LABELS = Object.fromEntries(TASK_STATUSES.map((o) => [o.value, o.label]))
export const TASK_STATUS_COLORS = {
  TODO: 'badge-neutral', IN_PROGRESS: 'badge-warning', BLOCKED: 'badge-error',
  COMPLETED: 'badge-success', CANCELLED: 'badge-error',
}

export const taskFormSections = [
  {
    title: 'Task Information',
    fields: [
      { name: 'campaignId', label: 'Related Campaign', type: 'lead-select', placeholder: 'Search campaigns…', emptyLabel: '— No campaign —' },
      { name: 'title', label: 'Task Title', type: 'text', required: true, fullWidth: true },
      { name: 'priority', label: 'Priority', type: 'select', options: TASK_PRIORITIES },
      { name: 'status', label: 'Status', type: 'select', options: TASK_STATUSES },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'dueTime', label: 'Due Time', type: 'time' },
      { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    ],
  },
]

export const taskDefaultValues = {
  campaignId: '', title: '', priority: 'medium', status: 'TODO',
  dueDate: '', dueTime: '', description: '', assigneeId: '',
}

/**
 * Returns the task form sections, optionally including an "Assign To" picker.
 * Only managers (callers with at least one direct report) pass options here;
 * everyone else gets the base sections and tasks default to self-assignment.
 */
export function buildTaskFormSections(assigneeOptions) {
  if (!assigneeOptions || assigneeOptions.length === 0) return taskFormSections
  const assigneeField = {
    name: 'assigneeId',
    label: 'Assign To',
    type: 'select',
    options: [{ value: '', label: 'Myself' }, ...assigneeOptions],
  }
  return taskFormSections.map((section, i) =>
    i === 0 ? { ...section, fields: [...section.fields, assigneeField] } : section,
  )
}

const optEnum = (vals) => z.union([z.enum(vals), z.literal('')]).optional()

export const taskFormSchema = z.object({
  campaignId: z.string().optional(),
  title: z.string().trim().min(1, 'Task title is required'),
  priority: optEnum(TASK_PRIORITIES.map((o) => o.value)),
  status: optEnum(TASK_STATUSES.map((o) => o.value)),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  description: z.string().optional(),
}).passthrough()

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '')
const timeOnly = (v) => {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Map a (slice-normalized) task into form values — splits dueDate into date + time inputs. */
export function buildTaskInitialValues(task) {
  if (!task) return { ...taskDefaultValues }
  return {
    ...taskDefaultValues,
    campaignId: task.campaignId ?? '',
    title: task.title ?? '',
    priority: task.priority ?? 'medium',
    status: task.rawStatus ?? 'TODO',
    description: task.description ?? '',
    assigneeId: task.assigneeId ?? '',
    dueDate: dateOnly(task.dueDate),
    dueTime: timeOnly(task.dueDate),
  }
}

const emptyToNull = (v) => (v === '' || v === undefined ? null : v)

/** Combine the date + time inputs into a single ISO timestamp for the API. */
function combineDateTime(date, time) {
  if (!date) return null
  const iso = time ? `${date}T${time}:00` : `${date}T09:00:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * Build the API payload, honouring the server's RBAC:
 *  - businessId is required on create only.
 *  - campaignId / assigneeId are only sent by managers (canAssign). Non-managers
 *    that include these on an update get a 403, so they are omitted entirely.
 */
export function toTaskPayload(values, { canAssign = false, mode = 'create', businessId } = {}) {
  const payload = {
    title: values.title,
    priority: values.priority || 'medium',
    status: values.status || 'TODO',
    dueDate: combineDateTime(values.dueDate, values.dueTime),
    description: emptyToNull(values.description),
  }
  if (mode === 'create' && businessId) payload.businessId = businessId
  if (canAssign) {
    payload.campaignId = emptyToNull(values.campaignId)
    // Empty means "Myself" on create (server defaults to caller) and "no change"
    // on edit, so only send an explicit subordinate id.
    if (values.assigneeId) payload.assignedToId = values.assigneeId
  }
  return payload
}
