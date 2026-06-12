import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Save } from '@mui/icons-material'
import PageHeader from '../../../components/common/PageHeader'
import { addLeadAsync } from '../../../redux/slices/leadSlice'
import {
  VISA_CATEGORIES, LEAD_SOURCES, PRIORITY_OPTIONS, CURRENT_STATUS_OPTIONS,
  URGENCY_OPTIONS, INTEREST_LEVELS, YES_NO_OPTIONS, LEAD_STATUS_PIPELINE, COUNTRIES,
} from '../constants/salesLookups'

// ─── Field helpers (reuse existing input-field styling; no shared component changed) ──
function Field({ label, children, required, full }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}

const Section = ({ title, children }) => (
  <div className="card p-5">
    <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 mb-4">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
)

const Text = (props) => <input {...props} className="input-field" />
const Select = ({ children, ...props }) => <select {...props} className="input-field">{children}</select>

// Form shows High/Medium/Low; SalesLead.priority stores hot/warm/cold.
const PRIORITY_BACKEND = { high: 'hot', medium: 'warm', low: 'cold' }

const EMPTY = {
  name: '', email: '', phone: '', whatsapp: '',
  countryOfResidence: '', nationality: '', visaCategory: VISA_CATEGORIES[0],
  source: LEAD_SOURCES[0], priority: 'medium',
  interestedVisa: '', currentStatus: '', education: '', workExperience: '',
  familyImmigrationRequired: '', budgetMin: '', budgetMax: '', urgencyLevel: 'Medium',
  interestedLevel: 'Warm', expectedInvestment: '', consultationRequired: '',
  consultationDate: '', remarks: '', status: 'NEW',
}

export default function AddLeadForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const toBool = (v) => (v === 'yes' ? true : v === 'no' ? false : null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      businessId: user?.businessId,
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      source: form.source,
      status: form.status,
      priority: PRIORITY_BACKEND[form.priority] ?? 'warm',
      estimatedValue: form.expectedInvestment ? Number(form.expectedInvestment) : null,
      notes: form.remarks || null,
      // Assigned To is auto-set to the current executive server-side (no assignedToId sent).
      immigration: {
        whatsapp: form.whatsapp || null,
        countryOfResidence: form.countryOfResidence || null,
        nationality: form.nationality || null,
        visaCategory: form.visaCategory || null,
        interestedVisa: form.interestedVisa || null,
        currentStatus: form.currentStatus || null,
        education: form.education || null,
        workExperience: form.workExperience ? Number(form.workExperience) : null,
        familyImmigrationRequired: toBool(form.familyImmigrationRequired),
        budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
        urgencyLevel: form.urgencyLevel || null,
        interestedLevel: form.interestedLevel || null,
        consultationRequired: toBool(form.consultationRequired),
        consultationDate: form.consultationDate || null,
      },
    }
    try {
      await dispatch(addLeadAsync(payload)).unwrap()
      navigate('/sales/leads')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create lead')
      setSaving(false)
    }
  }

  // Priority select must store the backend value (hot/warm/cold) while showing High/Med/Low.
  const PRIORITY_BACKEND = { high: 'hot', medium: 'warm', low: 'cold' }

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <PageHeader
        title="Add Lead"
        subtitle="Capture a new immigration inquiry — auto-assigned to you"
        breadcrumbs={['Sales', 'Add Lead']}
      />

      {error && (
        <div className="card p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Lead Information ── */}
        <Section title="Lead Information">
          <Field label="Lead ID">
            <Text value="Auto-generated" disabled />
          </Field>
          <Field label="Lead Name" required>
            <Text value={form.name} required onChange={(e) => set('name', e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Email">
            <Text type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" />
          </Field>
          <Field label="Phone Number">
            <Text type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
          </Field>
          <Field label="WhatsApp Number">
            <Text type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+1 555 000 0000" />
          </Field>
          <Field label="Country of Residence">
            <Select value={form.countryOfResidence} onChange={(e) => set('countryOfResidence', e.target.value)}>
              <option value="">Select…</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Nationality">
            <Select value={form.nationality} onChange={(e) => set('nationality', e.target.value)}>
              <option value="">Select…</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Visa Category">
            <Select value={form.visaCategory} onChange={(e) => set('visaCategory', e.target.value)}>
              {VISA_CATEGORIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Lead Source">
            <Select value={form.source} onChange={(e) => set('source', e.target.value)}>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Assigned To">
            <Text value={user?.name ? `${user.name} (you)` : 'You'} disabled />
          </Field>
        </Section>

        {/* ── Immigration Requirement ── */}
        <Section title="Immigration Requirement">
          <Field label="Interested Visa">
            <Select value={form.interestedVisa} onChange={(e) => set('interestedVisa', e.target.value)}>
              <option value="">Select…</option>
              {VISA_CATEGORIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Current Status">
            <Select value={form.currentStatus} onChange={(e) => set('currentStatus', e.target.value)}>
              <option value="">Select…</option>
              {CURRENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Education">
            <Text value={form.education} onChange={(e) => set('education', e.target.value)} placeholder="e.g. Master's in CS" />
          </Field>
          <Field label="Work Experience (years)">
            <Text type="number" min="0" value={form.workExperience} onChange={(e) => set('workExperience', e.target.value)} />
          </Field>
          <Field label="Family Immigration Required">
            <Select value={form.familyImmigrationRequired} onChange={(e) => set('familyImmigrationRequired', e.target.value)}>
              <option value="">Select…</option>
              {YES_NO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field label="Urgency Level">
            <Select value={form.urgencyLevel} onChange={(e) => set('urgencyLevel', e.target.value)}>
              {URGENCY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </Field>
          <Field label="Budget Available — Min (USD)">
            <Text type="number" min="0" value={form.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} />
          </Field>
          <Field label="Budget Available — Max (USD)">
            <Text type="number" min="0" value={form.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} />
          </Field>
        </Section>

        {/* ── Lead Qualification ── */}
        <Section title="Lead Qualification">
          <Field label="Lead Score">
            <Text value="Auto-calculated on save" disabled />
          </Field>
          <Field label="Interested Level">
            <Select value={form.interestedLevel} onChange={(e) => set('interestedLevel', e.target.value)}>
              {INTEREST_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Expected Investment (USD)">
            <Text type="number" min="0" value={form.expectedInvestment} onChange={(e) => set('expectedInvestment', e.target.value)} />
          </Field>
          <Field label="Consultation Required">
            <Select value={form.consultationRequired} onChange={(e) => set('consultationRequired', e.target.value)}>
              <option value="">Select…</option>
              {YES_NO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field label="Consultation Date">
            <Text type="date" value={form.consultationDate} onChange={(e) => set('consultationDate', e.target.value)} />
          </Field>
          <Field label="Remarks" full>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => set('remarks', e.target.value)}
              className="input-field"
              placeholder="Additional notes…"
            />
          </Field>
        </Section>

        {/* ── Status ── */}
        <Section title="Lead Status">
          <Field label="Status" full>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
              {LEAD_STATUS_PIPELINE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
        </Section>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/sales/leads')} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
            <Save fontSize="small" /> {saving ? 'Saving…' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  )
}
