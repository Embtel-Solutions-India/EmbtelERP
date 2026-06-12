import { z } from 'zod'

// ─── Option constants (single source of truth for form, table & filters) ──────

export const VISA_CATEGORIES = [
  { value: 'H1B', label: 'H1B' },
  { value: 'L1A', label: 'L1A' },
  { value: 'L1B', label: 'L1B' },
  { value: 'O1', label: 'O1' },
  { value: 'TN', label: 'TN' },
  { value: 'E3', label: 'E3' },
  { value: 'EB1', label: 'EB1' },
  { value: 'EB2_NIW', label: 'EB2 NIW' },
  { value: 'FAMILY_GREEN_CARD', label: 'Family Green Card' },
  { value: 'MARRIAGE_BASED', label: 'Marriage Based' },
  { value: 'BUSINESS_VISA', label: 'Business Visa' },
  { value: 'VISITOR_VISA', label: 'Visitor Visa' },
  { value: 'PERMANENT_RESIDENCY', label: 'Permanent Residency' },
]

export const LEAD_SOURCES = [
  'Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event',
  'Social Media', 'Marketing Campaign', 'Walk-in', 'Email Campaign',
].map((v) => ({ value: v, label: v }))

// Pragmatic country list (also reused for nationality). See tech-debt note.
export const COUNTRIES = [
  'India', 'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'United Arab Emirates', 'Singapore', 'Saudi Arabia', 'Qatar', 'Kuwait',
  'Nigeria', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Philippines',
  'China', 'Mexico', 'Brazil', 'South Africa', 'France', 'Ireland',
  'New Zealand', 'Netherlands', 'Other',
].map((v) => ({ value: v, label: v }))

export const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

export const INTERESTED_LEVELS = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
]

export const CURRENT_STATUSES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'WORKER', label: 'Worker' },
  { value: 'BUSINESS_OWNER', label: 'Business Owner' },
]

export const PAYMENT_STATUSES = [
  { value: 'INITIATED', label: 'Initiated' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'PARTIALLY_DONE', label: 'Partially Done' },
]

export const PAYMENT_STATUS_LABELS = Object.fromEntries(PAYMENT_STATUSES.map((o) => [o.value, o.label]))
export const PAYMENT_STATUS_COLORS = {
  INITIATED: 'badge-neutral', IN_PROGRESS: 'badge-warning', DONE: 'badge-success', PARTIALLY_DONE: 'badge-info',
}

// Lead lifecycle workflow (Section 5).
export const LEAD_STATUSES = [
  { value: 'NEW', label: 'New Lead' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'CONSULTATION_SCHEDULED', label: 'Consultation Scheduled' },
  { value: 'DOCUMENTS_REQUESTED', label: 'Documents Requested' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'TRANSFERRED', label: 'Transferred To Documentation' },
  { value: 'LOST', label: 'Lost' },
]

export const LEAD_STATUS_LABELS = Object.fromEntries(LEAD_STATUSES.map((o) => [o.value, o.label]))
export const LEAD_STATUS_COLORS = {
  NEW: 'badge-primary', CONTACTED: 'badge-info', CONSULTATION_SCHEDULED: 'badge-purple',
  DOCUMENTS_REQUESTED: 'badge-warning', QUALIFIED: 'badge-success', CONVERTED: 'badge-success',
  TRANSFERRED: 'badge-primary', LOST: 'badge-error',
}

// ─── Form sections (drives the reusable SchemaForm; shared by Add & Update) ────

export const leadFormSections = [
  {
    title: 'Lead Information',
    fields: [
      { name: 'leadCode', label: 'Lead ID', type: 'readonly', placeholder: 'Auto-generated' },
      { name: 'name', label: 'Lead Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { name: 'whatsappNumber', label: 'WhatsApp Number', type: 'tel' },
      { name: 'countryOfResidence', label: 'Country Of Residence', type: 'select', options: COUNTRIES },
      { name: 'nationality', label: 'Nationality', type: 'select', options: COUNTRIES },
      { name: 'visaCategory', label: 'Visa Category', type: 'select', options: VISA_CATEGORIES },
      { name: 'source', label: 'Lead Source', type: 'select', options: LEAD_SOURCES, required: true },
      { name: 'priorityLevel', label: 'Priority', type: 'select', options: PRIORITY_LEVELS },
    ],
  },
  {
    title: 'Immigration Requirement',
    fields: [
      { name: 'interestedVisa', label: 'Interested Visa', type: 'select', options: VISA_CATEGORIES },
      { name: 'currentStatus', label: 'Current Status', type: 'select', options: CURRENT_STATUSES },
      { name: 'education', label: 'Education', type: 'text' },
      { name: 'workExperienceYears', label: 'Work Experience (Years)', type: 'number', min: 0 },
      { name: 'familyImmigrationRequired', label: 'Family Immigration Required', type: 'checkbox' },
      { name: 'budgetAvailable', label: 'Budget Available ($)', type: 'number', min: 0 },
      { name: 'urgencyLevel', label: 'Urgency Level', type: 'select', options: PRIORITY_LEVELS },
    ],
  },
  {
    title: 'Lead Qualification',
    fields: [
      { name: 'leadScore', label: 'Lead Score', type: 'readonly', placeholder: 'Auto-calculated' },
      { name: 'priority', label: 'Interested Level', type: 'select', options: INTERESTED_LEVELS },
      { name: 'expectedInvestment', label: 'Expected Investment ($)', type: 'number', min: 0 },
      { name: 'consultationRequired', label: 'Consultation Required', type: 'checkbox' },
      { name: 'consultationDate', label: 'Consultation Date', type: 'date' },
      { name: 'notes', label: 'Remarks', type: 'textarea', fullWidth: true },
    ],
  },
  {
    title: 'Payment Information',
    fields: [
      { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: PAYMENT_STATUSES },
      { name: 'paymentAmount', label: 'Payment Amount ($)', type: 'number', min: 0 },
    ],
  },
  {
    title: 'Lead Status',
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: LEAD_STATUSES },
      { name: 'estimatedValue', label: 'Deal Value ($)', type: 'number', min: 0 },
    ],
  },
]

// ─── Defaults & validation (shared) ───────────────────────────────────────────

export const leadDefaultValues = {
  leadCode: '', name: '', email: '', phone: '', whatsappNumber: '',
  countryOfResidence: '', nationality: '', visaCategory: '', source: 'Website',
  priorityLevel: 'MEDIUM', interestedVisa: '', currentStatus: '', education: '',
  workExperienceYears: '', familyImmigrationRequired: false, budgetAvailable: '',
  urgencyLevel: 'MEDIUM', leadScore: 0, priority: 'warm', expectedInvestment: '',
  consultationRequired: false, consultationDate: '', notes: '',
  paymentStatus: 'INITIATED', paymentAmount: '', status: 'NEW', estimatedValue: '',
}

const optEnum = (vals) => z.union([z.enum(vals), z.literal('')]).optional()
const blankToUndef = (v) => (v === '' || v === null || v === undefined ? undefined : v)
const optNum = z.preprocess(blankToUndef, z.coerce.number().nonnegative().optional())
const optIntNum = z.preprocess(blankToUndef, z.coerce.number().int().nonnegative().optional())

// Update derives from the same schema (validation is shared between Add & Update).
export const leadFormSchema = z.object({
  name: z.string().trim().min(1, 'Lead name is required'),
  email: z.union([z.string().email('Enter a valid email'), z.literal('')]).optional(),
  phone: z.string().trim().min(1, 'Phone number is required'),
  whatsappNumber: z.string().optional(),
  countryOfResidence: z.string().optional(),
  nationality: z.string().optional(),
  visaCategory: optEnum(VISA_CATEGORIES.map((o) => o.value)),
  source: z.string().trim().min(1, 'Lead source is required'),
  priorityLevel: optEnum(['LOW', 'MEDIUM', 'HIGH']),
  interestedVisa: optEnum(VISA_CATEGORIES.map((o) => o.value)),
  currentStatus: optEnum(['STUDENT', 'WORKER', 'BUSINESS_OWNER']),
  education: z.string().optional(),
  workExperienceYears: optIntNum,
  familyImmigrationRequired: z.boolean().optional(),
  budgetAvailable: optNum,
  urgencyLevel: optEnum(['LOW', 'MEDIUM', 'HIGH']),
  priority: optEnum(['hot', 'warm', 'cold']),
  expectedInvestment: optNum,
  consultationRequired: z.boolean().optional(),
  consultationDate: z.string().optional(),
  notes: z.string().optional(),
  paymentStatus: optEnum(['INITIATED', 'IN_PROGRESS', 'DONE', 'PARTIALLY_DONE']),
  paymentAmount: optNum,
  status: optEnum(LEAD_STATUSES.map((o) => o.value)),
  estimatedValue: optNum,
}).passthrough()

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '')

/** Map an API lead record into form values for edit preload (guarantees parity). */
export function buildLeadInitialValues(lead) {
  if (!lead) return { ...leadDefaultValues }
  return {
    ...leadDefaultValues,
    ...lead,
    leadCode: lead.leadCode ?? '',
    visaCategory: lead.visaCategory ?? '',
    interestedVisa: lead.interestedVisa ?? '',
    currentStatus: lead.currentStatus ?? '',
    countryOfResidence: lead.countryOfResidence ?? '',
    nationality: lead.nationality ?? '',
    whatsappNumber: lead.whatsappNumber ?? '',
    education: lead.education ?? '',
    notes: lead.notes ?? '',
    priority: lead.priority ?? 'warm',
    priorityLevel: lead.priorityLevel ?? 'MEDIUM',
    urgencyLevel: lead.urgencyLevel ?? 'MEDIUM',
    paymentStatus: lead.paymentStatus ?? 'INITIATED',
    status: lead.status ?? 'NEW',
    familyImmigrationRequired: Boolean(lead.familyImmigrationRequired),
    consultationRequired: Boolean(lead.consultationRequired),
    consultationDate: dateOnly(lead.consultationDate),
    workExperienceYears: lead.workExperienceYears ?? '',
    budgetAvailable: lead.budgetAvailable ?? '',
    expectedInvestment: lead.expectedInvestment ?? '',
    paymentAmount: lead.paymentAmount ?? '',
    estimatedValue: lead.estimatedValue ?? '',
    leadScore: lead.leadScore ?? 0,
  }
}

const emptyToNull = (v) => (v === '' || v === undefined ? null : v)
const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

/** Map form values into the API payload (leadCode/leadScore are server-controlled). */
export function toLeadPayload(values, { businessId } = {}) {
  return {
    name: values.name,
    email: emptyToNull(values.email),
    phone: values.phone,
    whatsappNumber: emptyToNull(values.whatsappNumber),
    countryOfResidence: emptyToNull(values.countryOfResidence),
    nationality: emptyToNull(values.nationality),
    visaCategory: emptyToNull(values.visaCategory),
    source: values.source,
    priorityLevel: values.priorityLevel || 'MEDIUM',
    interestedVisa: emptyToNull(values.interestedVisa),
    currentStatus: emptyToNull(values.currentStatus),
    education: emptyToNull(values.education),
    workExperienceYears: numOrNull(values.workExperienceYears),
    familyImmigrationRequired: Boolean(values.familyImmigrationRequired),
    budgetAvailable: numOrNull(values.budgetAvailable),
    urgencyLevel: values.urgencyLevel || 'MEDIUM',
    priority: values.priority || 'warm',
    expectedInvestment: numOrNull(values.expectedInvestment),
    consultationRequired: Boolean(values.consultationRequired),
    consultationDate: emptyToNull(values.consultationDate),
    notes: emptyToNull(values.notes),
    paymentStatus: values.paymentStatus || 'INITIATED',
    paymentAmount: numOrNull(values.paymentAmount),
    status: values.status || 'NEW',
    estimatedValue: numOrNull(values.estimatedValue),
    ...(businessId ? { businessId } : {}),
  }
}
