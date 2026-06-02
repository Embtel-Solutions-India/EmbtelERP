import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Search, FilterList, Phone, Email, WhatsApp, Visibility, Edit } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import PageHeader from '../../../components/common/PageHeader'
import ActionFormModal from '../../../components/common/ActionFormModal'
import PriorityBadge from '../../../components/common/PriorityBadge'
import { addLead } from '../../../redux/slices/leadSlice'
import { formatCurrency, formatDate, getInitials } from '../../../utils'
import SectionCard from '../../../components/common/SectionCard'

const STATUS_COLORS = {
  new: 'badge-primary', contacted: 'badge-info', qualified: 'badge-success',
  proposal: 'badge-purple', negotiation: 'badge-warning', won: 'badge-success', lost: 'badge-error',
}

const LEAD_FIELDS = [
  { name: 'name', label: 'Lead Name', required: true },
  { name: 'company', label: 'Company', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'value', label: 'Deal Value', type: 'number', min: 0, required: true },
  {
    name: 'source',
    label: 'Source',
    type: 'select',
    options: ['LinkedIn', 'Website', 'Referral', 'Cold Call', 'Event', 'PPC', 'SEO', 'Email Campaign'].map((value) => ({ value, label: value })),
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['new', 'contacted', 'qualified', 'proposal', 'negotiation'].map((value) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
    })),
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    options: ['hot', 'warm', 'cold'].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })),
  },
  { name: 'nextFollowUp', label: 'Next Follow Up', type: 'datetime-local', fullWidth: true },
]

const LEAD_INITIAL_VALUES = {
  name: '',
  company: '',
  email: '',
  phone: '',
  value: '',
  source: 'LinkedIn',
  status: 'new',
  priority: 'warm',
  nextFollowUp: '',
}

export default function MarketingLeads() {
  const dispatch = useDispatch()
  const { list: leads } = useSelector((s) => s.leads)
  
  // Use local state filters for isolated marketing view
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [viewMode, setViewMode] = useState('table')
  const [isLeadFormOpen, setLeadFormOpen] = useState(false)

  const handleAddLead = (values) => {
    dispatch(addLead({
      id: Date.now(),
      name: values.name,
      company: values.company,
      email: values.email,
      phone: values.phone,
      value: Number(values.value) || 0,
      source: values.source,
      status: values.status,
      priority: values.priority,
      nextFollowUp: values.nextFollowUp ? new Date(values.nextFollowUp).toISOString() : null,
      lastContact: new Date().toISOString(),
    }))
  }

  // Filter leads locally
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (statusFilter && l.status !== statusFilter) return false
      if (priorityFilter && l.priority !== priorityFilter) return false
      if (search) {
        const query = search.toLowerCase()
        return l.name.toLowerCase().includes(query) || 
               l.company.toLowerCase().includes(query) ||
               l.source.toLowerCase().includes(query)
      }
      return true
    })
  }, [leads, search, statusFilter, priorityFilter])

  // Calculate lead sources data for chart
  const chartData = useMemo(() => {
    const counts = {}
    leads.forEach(l => {
      counts[l.source] = (counts[l.source] || 0) + 1
    })
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    return Object.keys(counts).map((source, index) => ({
      source,
      count: counts[source],
      color: colors[index % colors.length]
    }))
  }, [leads])

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Marketing Leads"
        subtitle={`${filteredLeads.length} marketing generated leads`}
        breadcrumbs={['Dashboard', 'Marketing Leads']}
        actions={
          <>
            <button className="btn-secondary text-sm flex items-center gap-2">
              <FilterList fontSize="small" /> Filter
            </button>
            <button onClick={() => setLeadFormOpen(true)} className="btn-primary text-sm flex items-center gap-2">
              <Add fontSize="small" /> Add Lead
            </button>
          </>
        }
      />

      <ActionFormModal
        open={isLeadFormOpen}
        title="Add Lead"
        subtitle="Capture contact details and acquisition channel"
        fields={LEAD_FIELDS}
        initialValues={LEAD_INITIAL_VALUES}
        submitLabel="Add Lead"
        onClose={() => setLeadFormOpen(false)}
        onSubmit={handleAddLead}
      />

      {/* Analytics chart of lead sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SectionCard title="Lead Acquisition Channels" subtitle="Distribution of leads across marketing touchpoints" noPadding>
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="source" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip formatter={(val) => [val, 'Leads']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
        <div>
          <SectionCard title="Conversion Insights" subtitle="Marketing funnel efficiency">
            <div className="space-y-4 py-2">
              {[
                { label: 'Total Leads Recieved', count: leads.length, rate: '100%', color: 'bg-indigo-500' },
                { label: 'Qualified Leads', count: leads.filter(l => l.status === 'qualified').length, rate: `${Math.round((leads.filter(l => l.status === 'qualified').length / leads.length) * 100)}%`, color: 'bg-emerald-500' },
                { label: 'Won (Closed) Leads', count: leads.filter(l => l.status === 'won').length, rate: `${Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100)}%`, color: 'bg-cyan-500' }
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>{stat.label}</span>
                    <span>{stat.count} ({stat.rate})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stat.color}`} style={{ width: stat.rate }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search leads, companies, sources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto min-w-[140px]">
          <option value="">All Status</option>
          {['new','contacted','qualified','proposal','negotiation','won','lost'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input-field w-auto min-w-[130px]">
          <option value="">All Priority</option>
          {['hot','warm','cold'].map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <div className="flex gap-1 bg-slate-100 dark:bg-gray-700 rounded-xl p-1">
          {['table','grid'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === mode ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {mode === 'table' ? '☰ Table' : '⊞ Grid'}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                  {['Lead', 'Contact', 'Status', 'Priority', 'Deal Value', 'Acquisition Source', 'Next Follow Up', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
                <AnimatePresence>
                  {filteredLeads.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{lead.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{lead.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400">{lead.email}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{lead.phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={STATUS_COLORS[lead.status] || 'badge-primary'}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3"><PriorityBadge priority={lead.priority} /></td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(lead.value)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="badge badge-info whitespace-nowrap">{lead.source}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {[
                            { icon: <Phone style={{ fontSize: 15 }} />, color: 'text-emerald-600 hover:bg-emerald-50', tip: 'Call' },
                            { icon: <WhatsApp style={{ fontSize: 15 }} />, color: 'text-green-600 hover:bg-green-50', tip: 'WhatsApp' },
                            { icon: <Email style={{ fontSize: 15 }} />, color: 'text-blue-600 hover:bg-blue-50', tip: 'Email' },
                            { icon: <Edit style={{ fontSize: 15 }} />, color: 'text-amber-600 hover:bg-amber-50', tip: 'Edit' },
                          ].map(({ icon, color, tip }) => (
                            <Tooltip key={tip} title={tip}>
                              <button className={`p-1.5 rounded-lg ${color} dark:hover:bg-gray-700 transition-colors`}>{icon}</button>
                            </Tooltip>
                          ))}
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
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLeads.map((lead, i) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-4 hover:shadow-card-hover transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(lead.name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{lead.name}</p>
                    <p className="text-xs text-slate-400">{lead.company}</p>
                  </div>
                </div>
                <PriorityBadge priority={lead.priority} />
              </div>
              <div className="space-y-1.5 mb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{lead.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{lead.phone}</p>
                <div className="pt-1">
                  <span className="text-xs bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium">{lead.source}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-gray-700">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(lead.value)}</span>
                <span className={STATUS_COLORS[lead.status] || 'badge-primary'}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
