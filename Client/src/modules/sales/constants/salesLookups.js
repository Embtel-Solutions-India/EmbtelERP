// Fixed business lookup values for the Sales Executive Lead & Task forms.
// Single source of truth so dropdowns aren't scattered as inline magic strings.

// Visa categories — based on BAIS services.
export const VISA_CATEGORIES = [
  'H1B', 'L1A', 'L1B', 'O1', 'TN', 'E3',
  'EB1', 'EB2 NIW', 'Family Green Card', 'Marriage Based',
  'Business Visa', 'Visitor Visa', 'Permanent Residency',
]

export const LEAD_SOURCES = [
  'Website', 'WhatsApp', 'Phone Call', 'Referral',
  'Facebook Ads', 'Google Ads', 'Walk-in', 'Other',
]

// Priority — option value maps directly to the existing SalesLead.priority field
// (hot/warm/cold) so no translation is needed at submit time.
export const PRIORITY_OPTIONS = [
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]

export const CURRENT_STATUS_OPTIONS = ['Student', 'Worker', 'Business Owner']

export const URGENCY_OPTIONS = ['Low', 'Medium', 'High']

export const INTEREST_LEVELS = ['Hot', 'Warm', 'Cold']

export const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no',  label: 'No' },
]

// Lead status pipeline — value is the SalesLeadStatus enum, label is the UI text.
export const LEAD_STATUS_PIPELINE = [
  { value: 'NEW',                          label: 'New Lead' },
  { value: 'CONTACTED',                    label: 'Contacted' },
  { value: 'CONSULTATION_SCHEDULED',       label: 'Consultation Scheduled' },
  { value: 'DOCUMENTS_REQUESTED',          label: 'Documents Requested' },
  { value: 'QUALIFIED',                    label: 'Qualified' },
  { value: 'CONVERTED',                    label: 'Converted' },
  { value: 'TRANSFERRED_TO_DOCUMENTATION', label: 'Transferred to Documentation Team' },
]

// Curated country list for residence / nationality dropdowns.
export const COUNTRIES = [
  'India', 'United States', 'Canada', 'United Kingdom', 'Australia',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman',
  'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Philippines',
  'China', 'Nigeria', 'Mexico', 'Brazil', 'Germany',
  'France', 'Spain', 'Italy', 'Singapore', 'Malaysia',
  'South Africa', 'Kenya', 'Egypt', 'Other',
]

// Task lookups (used by the Task form in the next phase).
export const TASK_TYPES = [
  'Call', 'WhatsApp Follow-up', 'Email Follow-up', 'Consultation Meeting',
  'Document Collection', 'Payment Follow-up', 'Visa Eligibility Discussion',
  'Lead Nurturing', 'Client Meeting', 'Internal Discussion',
]

export const TASK_RESULTS = [
  'Connected', 'No Response', 'Interested', 'Not Interested', 'Call Back Later',
  'Consultation Booked', 'Documents Received', 'Payment Received', 'Converted', 'Lost Lead',
]
