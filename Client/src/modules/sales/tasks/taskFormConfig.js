import { z } from 'zod'

export const TASK_TYPES = [
  { value: 'CALL', label: 'Call' },
  { value: 'WHATSAPP_FOLLOWUP', label: 'WhatsApp Follow-up' },
  { value: 'EMAIL_FOLLOWUP', label: 'Email Follow-up' },
  { value: 'CONSULTATION_MEETING', label: 'Consultation Meeting' },
  { value: 'DOCUMENT_COLLECTION', label: 'Document Collection' },
  { value: 'PAYMENT_FOLLOWUP', label: 'Payment Follow-up' },
  { value: 'VISA_ELIGIBILITY_DISCUSSION', label: 'Visa Eligibility Discussion' },
  { value: 'LEAD_NURTURING', label: 'Lead Nurturing' },
  { value: 'CLIENT_MEETING', label: 'Client Meeting' },
  { value: 'INTERNAL_DISCUSSION', label: 'Internal Discussion' },
]
export const TASK_TYPE_LABELS = Object.fromEntries(TASK_TYPES.map((o) => [o.value, o.label]))

export const TASK_RESULTS = [
  { value: 'CONNECTED', label: 'Connected' },
  { value: 'NO_RESPONSE', label: 'No Response' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'CALL_BACK_LATER', label: 'Call Back Later' },
  { value: 'CONSULTATION_BOOKED', label: 'Consultation Booked' },
  { value: 'DOCUMENTS_RECEIVED', label: 'Documents Received' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST_LEAD', label: 'Lost Lead' },
]
export const TASK_RESULT_LABELS = Object.fromEntries(TASK_RESULTS.map((o) => [o.value, o.label]))

export const TASK_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

export const TASK_STATUSES = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]
export const TASK_STATUS_LABELS = Object.fromEntries(TASK_STATUSES.map((o) => [o.value, o.label]))
export const TASK_STATUS_COLORS = {
  TODO: 'badge-neutral', IN_PROGRESS: 'badge-warning', COMPLETED: 'badge-success', CANCELLED: 'badge-error',
}
export const TASK_PRIORITY_COLORS = { LOW: 'badge-info', MEDIUM: 'badge-warning', HIGH: 'badge-error' }

export const taskFormSections = [
  {
    title: 'Task Information',
    fields: [
      { name: 'taskCode', label: 'Task ID', type: 'readonly', placeholder: 'Auto-generated' },
      { name: 'leadId', label: 'Related Lead', type: 'lead-select' },
      { name: 'title', label: 'Task Title', type: 'text', required: true, fullWidth: true },
      { name: 'taskType', label: 'Task Type', type: 'select', options: TASK_TYPES, required: true },
      { name: 'priority', label: 'Priority', type: 'select', options: TASK_PRIORITIES },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'dueTime', label: 'Due Time', type: 'time' },
      { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    ],
  },
  {
    title: 'Outcome',
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: TASK_STATUSES },
      { name: 'result', label: 'Task Result', type: 'select', options: TASK_RESULTS },
      { name: 'nextFollowUpDate', label: 'Next Follow-up Date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],
  },
]

export const taskDefaultValues = {
  taskCode: '', leadId: '', title: '', taskType: 'CALL', priority: 'MEDIUM',
  dueDate: '', dueTime: '', description: '', status: 'TODO', result: '',
  nextFollowUpDate: '', notes: '', assigneeId: '',
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
  leadId: z.string().optional(),
  title: z.string().trim().min(1, 'Task title is required'),
  taskType: z.enum(TASK_TYPES.map((o) => o.value)),
  priority: optEnum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  description: z.string().optional(),
  status: optEnum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  result: optEnum(TASK_RESULTS.map((o) => o.value)),
  nextFollowUpDate: z.string().optional(),
  notes: z.string().optional(),
}).passthrough()

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '')
const timeOnly = (v) => {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Map an API task into form values (splits dueDate into date + time inputs). */
export function buildTaskInitialValues(task) {
  if (!task) return { ...taskDefaultValues }
  return {
    ...taskDefaultValues,
    ...task,
    taskCode: task.taskCode ?? '',
    leadId: task.leadId ?? '',
    priority: task.priority ?? 'MEDIUM',
    status: task.status ?? 'TODO',
    result: task.result ?? '',
    description: task.description ?? '',
    notes: task.notes ?? '',
    assigneeId: task.assigneeId ?? '',
    dueDate: dateOnly(task.dueDate),
    dueTime: timeOnly(task.dueDate),
    nextFollowUpDate: dateOnly(task.nextFollowUpDate),
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

export function toTaskPayload(values) {
  const payload = {
    leadId: emptyToNull(values.leadId),
    title: values.title,
    taskType: values.taskType,
    priority: values.priority || 'MEDIUM',
    dueDate: combineDateTime(values.dueDate, values.dueTime),
    description: emptyToNull(values.description),
    status: values.status || 'TODO',
    result: emptyToNull(values.result),
    nextFollowUpDate: values.nextFollowUpDate ? new Date(`${values.nextFollowUpDate}T00:00:00`).toISOString() : null,
    notes: emptyToNull(values.notes),
  }
  // Only send assigneeId when an explicit subordinate is chosen — empty means
  // "Myself" on create (server defaults to the caller) and "no change" on edit.
  if (values.assigneeId) payload.assigneeId = values.assigneeId
  return payload
}
