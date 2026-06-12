import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Search, FilterList, Phone, Email, WhatsApp, Edit, Delete, CheckCircle, SwapHoriz } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import PageHeader from '../components/common/PageHeader'
import SchemaForm from '../components/common/SchemaForm'
import PriorityBadge from '../components/common/PriorityBadge'
import {
  addLeadAsync, updateLead, deleteLeadAsync, convertLead, transferLead, setFilter, fetchLeads,
} from '../redux/slices/leadSlice'
import { fetchEmployees } from '../redux/slices/employeeSlice'
import {
  leadFormSections, leadFormSchema, leadDefaultValues, buildLeadInitialValues, toLeadPayload,
  LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS,
  PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  INTERESTED_LEVELS,
} from '../modules/sales/leads/leadFormConfig'
import { formatCurrency, getInitials } from '../utils'

// Re-exported for any legacy importers.
export { PAYMENT_STATUSES }

export default function Leads() {
  const dispatch = useDispatch()
  const { filteredList: leads, filters, loading, error } = useSelector((s) => s.leads)
  const { user } = useSelector((s) => s.auth)
  const activePerspective = useSelector((s) => s.perspective?.current)
  const [viewMode, setViewMode] = useState('table')
  const [isLeadFormOpen, setLeadFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)

  useEffect(() => {
    dispatch(fetchLeads())
    dispatch(fetchEmployees())
  }, [dispatch, activePerspective])

  const level = Number(user?.roleLevel ?? user?.employeeLevel ?? 0)
  const canEdit = level >= 1
  const canDelete = level >= 2

  const initialValues = useMemo(
    () => (editingLead ? buildLeadInitialValues(editingLead) : { ...leadDefaultValues }),
    [editingLead],
  )

  const handleSearch = (e) => dispatch(setFilter({ search: e.target.value }))
  const handleStatusFilter = (e) => dispatch(setFilter({ status: e.target.value }))
  const handlePriorityFilter = (e) => dispatch(setFilter({ priority: e.target.value }))
  const handlePaymentFilter = (e) => dispatch(setFilter({ paymentStatus: e.target.value }))

  const handleFormSubmit = async (values) => {
    const payload = toLeadPayload(values, { businessId: user?.businessId })
    if (editingLead) {
      await dispatch(updateLead({ id: editingLead.id, ...payload }))
    } else {
      await dispatch(addLeadAsync(payload))
    }
    setLeadFormOpen(false)
    setEditingLead(null)
  }

  const handleEditClick = (lead) => { setEditingLead(lead); setLeadFormOpen(true) }
  const handleDeleteClick = (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) dispatch(deleteLeadAsync(id))
  }
  const handleConvert = (lead) => {
    if (window.confirm(`Convert "${lead.name}" to a client?`)) dispatch(convertLead(lead.id))
  }
  const handleTransfer = (lead) => {
    if (window.confirm(`Transfer "${lead.name}" to the Documentation team?`)) dispatch(transferLead(lead.id))
  }

  const statusBadge = (status) => (
    <span className={LEAD_STATUS_COLORS[status] || 'badge-primary'}>{LEAD_STATUS_LABELS[status] || status}</span>
  )
  const paymentBadge = (ps) => (
    <span className={PAYMENT_STATUS_COLORS[ps] || 'badge-neutral'}>{PAYMENT_STATUS_LABELS[ps] || ps || '—'}</span>
  )

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} leads in your pipeline`}
        breadcrumbs={['Dashboard', 'Leads']}
        actions={
          <>
            <button className="btn-secondary text-sm flex items-center gap-2">
              <FilterList fontSize="small" /> Filter
            </button>
            {canEdit && (
              <button onClick={() => { setEditingLead(null); setLeadFormOpen(true) }} className="btn-primary text-sm flex items-center gap-2">
                <Add fontSize="small" /> Add Lead
              </button>
            )}
          </>
        }
      />

      <SchemaForm
        open={isLeadFormOpen}
        title={editingLead ? 'Update Lead' : 'Add Lead'}
        subtitle={editingLead ? 'Update lead information' : 'Capture lead, immigration & qualification details'}
        sections={leadFormSections}
        schema={leadFormSchema}
        defaultValues={initialValues}
        mode={editingLead ? 'edit' : 'create'}
        submitLabel={editingLead ? 'Save Changes' : 'Add Lead'}
        onClose={() => { setLeadFormOpen(false); setEditingLead(null) }}
        onSubmit={handleFormSubmit}
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style={{ fontSize: 18 }} />
          <input type="text" placeholder="Search name, email, phone, lead ID…" value={filters.search}
            onChange={handleSearch} className="input-field pl-9" />
        </div>
        <select value={filters.status} onChange={handleStatusFilter} className="input-field w-auto min-w-[160px]">
          <option value="">All Status</option>
          {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filters.priority} onChange={handlePriorityFilter} className="input-field w-auto min-w-[140px]">
          <option value="">All Interest</option>
          {INTERESTED_LEVELS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filters.paymentStatus} onChange={handlePaymentFilter} className="input-field w-auto min-w-[150px]">
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1">
          {['table', 'grid'].map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === mode ? 'bg-white dark:bg-neutral-600 text-primary-600 shadow-sm' : 'text-neutral-500'}`}>
              {mode === 'table' ? '☰ Table' : '⊞ Grid'}
            </button>
          ))}
        </div>
      </div>

      {/* States: loading / error / empty */}
      {loading ? (
        <div className="card p-10 text-center text-sm text-neutral-500">Loading leads…</div>
      ) : error ? (
        <div className="card p-10 text-center text-sm text-red-500">Failed to load leads: {String(error)}</div>
      ) : leads.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No leads yet</p>
          <p className="mt-1 text-xs text-neutral-400">Add your first lead to start building the pipeline.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                  {['Lead ID', 'Lead', 'Contact', 'Status', 'Payment', 'Interest', 'Score', 'Deal Value', 'Assignee', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
                <AnimatePresence>
                  {leads.map((lead, i) => (
                    <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group">
                      <td className="px-5 py-3 text-xs font-mono text-neutral-500 whitespace-nowrap">{lead.leadCode}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{lead.name}</p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">{lead.countryOfResidence || lead.company || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{lead.email}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">{lead.phone}</p>
                      </td>
                      <td className="px-5 py-3">{statusBadge(lead.status)}</td>
                      <td className="px-5 py-3">{paymentBadge(lead.paymentStatus)}</td>
                      <td className="px-5 py-3"><PriorityBadge priority={lead.priority} /></td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{lead.leadScore ?? 0}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(lead.estimatedValue ?? lead.value)}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                        {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {[
                            { icon: <Phone style={{ fontSize: 15 }} />, color: 'text-emerald-600 hover:bg-emerald-50', tip: 'Call' },
                            { icon: <WhatsApp style={{ fontSize: 15 }} />, color: 'text-green-600 hover:bg-green-50', tip: 'WhatsApp' },
                            { icon: <Email style={{ fontSize: 15 }} />, color: 'text-blue-600 hover:bg-blue-50', tip: 'Email' },
                          ].map(({ icon, color, tip }) => (
                            <Tooltip key={tip} title={tip}>
                              <button className={`p-1.5 rounded-lg ${color} dark:hover:bg-neutral-700 transition-colors`}>{icon}</button>
                            </Tooltip>
                          ))}
                          {canEdit && lead.status !== 'CONVERTED' && lead.status !== 'TRANSFERRED' && (
                            <Tooltip title="Convert">
                              <button onClick={() => handleConvert(lead)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-neutral-700 transition-colors">
                                <CheckCircle style={{ fontSize: 15 }} />
                              </button>
                            </Tooltip>
                          )}
                          {canEdit && (lead.status === 'QUALIFIED' || lead.status === 'CONVERTED') && (
                            <Tooltip title="Transfer to Documentation">
                              <button onClick={() => handleTransfer(lead)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-neutral-700 transition-colors">
                                <SwapHoriz style={{ fontSize: 15 }} />
                              </button>
                            </Tooltip>
                          )}
                          {canEdit && (
                            <Tooltip title="Edit">
                              <button onClick={() => handleEditClick(lead)} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-neutral-700 transition-colors">
                                <Edit style={{ fontSize: 15 }} />
                              </button>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title="Delete">
                              <button onClick={() => handleDeleteClick(lead.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-neutral-700 transition-colors">
                                <Delete style={{ fontSize: 15 }} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {leads.map((lead, i) => (
            <motion.div key={lead.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-4 hover:shadow-card-hover transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(lead.name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{lead.name}</p>
                    <p className="text-[10px] font-mono text-neutral-400">{lead.leadCode}</p>
                  </div>
                </div>
                <PriorityBadge priority={lead.priority} />
              </div>
              <div className="space-y-1.5 mb-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{lead.email}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{lead.phone}</p>
                <p className="text-xs text-neutral-400">Score: <span className="font-semibold text-neutral-600 dark:text-neutral-300">{lead.leadScore ?? 0}</span></p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(lead.estimatedValue ?? lead.value)}</span>
                <div className="flex items-center gap-2">
                  {statusBadge(lead.status)}
                  {canEdit && (
                    <button onClick={() => handleEditClick(lead)} className="text-amber-600 hover:text-amber-700">
                      <Edit style={{ fontSize: 14 }} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDeleteClick(lead.id)} className="text-red-600 hover:text-red-700">
                      <Delete style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
