import { z } from 'zod'

export const TARGET_CATEGORIES = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'CONVERSION', label: 'Conversion' },
  { value: 'REVENUE', label: 'Revenue' },
]

// Specific metric options filtered by category (spec's Target Types list).
export const METRICS_BY_CATEGORY = {
  LEAD: [
    { value: 'LEADS_CREATED', label: 'Leads Created' },
    { value: 'LEADS_CONTACTED', label: 'Leads Contacted' },
    { value: 'QUALIFIED_LEADS', label: 'Qualified Leads' },
  ],
  ACTIVITY: [
    { value: 'CALLS_COMPLETED', label: 'Calls Completed' },
    { value: 'WHATSAPP_FOLLOWUPS', label: 'WhatsApp Follow-ups' },
    { value: 'EMAIL_FOLLOWUPS', label: 'Email Follow-ups' },
    { value: 'CONSULTATIONS_SCHEDULED', label: 'Consultations Scheduled' },
  ],
  CONVERSION: [
    { value: 'CONVERTED_CLIENTS', label: 'Converted Clients' },
    { value: 'QUALIFIED_LEADS', label: 'Qualified Leads' },
    { value: 'CLOSED_LEADS', label: 'Closed Leads' },
  ],
  REVENUE: [
    { value: 'REVENUE_GENERATED', label: 'Revenue Generated' },
    { value: 'PAYMENTS_COLLECTED', label: 'Payments Collected' },
  ],
}

export const ALL_METRICS = Object.values(METRICS_BY_CATEGORY).flat()
export const METRIC_LABELS = Object.fromEntries(ALL_METRICS.map((m) => [m.value, m.label]))
export const CATEGORY_LABELS = Object.fromEntries(TARGET_CATEGORIES.map((c) => [c.value, c.label]))
const ALL_METRIC_VALUES = [...new Set(ALL_METRICS.map((m) => m.value))]
const REVENUE_METRICS = ['REVENUE_GENERATED', 'PAYMENTS_COLLECTED']
export const isCurrencyMetric = (metric) => REVENUE_METRICS.includes(metric)

export const TARGET_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
]
export const TARGET_STATUS_COLORS = {
  ACTIVE: 'badge-info', COMPLETED: 'badge-success', OVERDUE: 'badge-error', CANCELLED: 'badge-neutral',
}

// Section definitions for SchemaForm. The "metric" select is populated
// dynamically from the chosen category by the page (optionsByField).
export const targetFormSections = (metricOptions) => [
  {
    title: 'Target Details',
    fields: [
      { name: 'name', label: 'Target Name', type: 'text', required: true, fullWidth: true },
      { name: 'category', label: 'Target Type', type: 'select', options: TARGET_CATEGORIES, required: true },
      { name: 'metric', label: 'Metric', type: 'select', options: metricOptions, required: true },
      { name: 'targetValue', label: 'Target Value', type: 'number', min: 0, required: true },
      { name: 'assignedToId', label: 'Assigned To', type: 'search-select', required: true, placeholder: 'Search team member…' },
    ],
  },
  {
    title: 'Schedule',
    fields: [
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    ],
  },
]

const firstOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10) }
const lastOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10) }

export const targetDefaultValues = {
  name: '', category: 'LEAD', metric: 'LEADS_CREATED', targetValue: '',
  assignedToId: '', startDate: firstOfMonth(), endDate: lastOfMonth(), description: '',
}

export const targetFormSchema = z.object({
  name: z.string().trim().min(1, 'Target name is required'),
  category: z.enum(['LEAD', 'ACTIVITY', 'CONVERSION', 'REVENUE']),
  metric: z.enum(ALL_METRIC_VALUES),
  targetValue: z.coerce.number().positive('Target value must be greater than zero'),
  assignedToId: z.string().min(1, 'Please select who this target is assigned to'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
}).refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
  message: 'End date must be on or after the start date', path: ['endDate'],
})

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '')

export function buildTargetInitialValues(target) {
  if (!target) return { ...targetDefaultValues }
  return {
    ...targetDefaultValues,
    name: target.name ?? '',
    category: target.category ?? 'LEAD',
    metric: target.metric ?? 'LEADS_CREATED',
    targetValue: target.targetValue ?? '',
    assignedToId: target.assignedToId ?? '',
    startDate: dateOnly(target.startDate),
    endDate: dateOnly(target.endDate),
    description: target.description ?? '',
  }
}

export function toTargetPayload(values, { parentTargetId } = {}) {
  return {
    name: values.name,
    category: values.category,
    metric: values.metric,
    targetValue: Number(values.targetValue),
    assignedToId: values.assignedToId,
    startDate: new Date(`${values.startDate}T00:00:00`).toISOString(),
    endDate: new Date(`${values.endDate}T23:59:59`).toISOString(),
    description: values.description || null,
    ...(parentTargetId ? { parentTargetId } : {}),
  }
}
