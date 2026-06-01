import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Search, FilterList, Phone, Email, WhatsApp, Visibility, Edit } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import PageHeader from '../components/common/PageHeader'
import PriorityBadge from '../components/common/PriorityBadge'
import { setFilter } from '../redux/slices/leadSlice'
import { formatCurrency, formatDate, getInitials } from '../utils'

const STATUS_COLORS = {
  new: 'badge-primary', contacted: 'badge-info', qualified: 'badge-success',
  proposal: 'badge-purple', negotiation: 'badge-warning', won: 'badge-success', lost: 'badge-error',
}

export default function Leads() {
  const dispatch = useDispatch()
  const { filteredList: leads, filters } = useSelector((s) => s.leads)
  const [viewMode, setViewMode] = useState('table')

  const handleSearch = (e) => dispatch(setFilter({ search: e.target.value }))
  const handleStatusFilter = (e) => dispatch(setFilter({ status: e.target.value }))
  const handlePriorityFilter = (e) => dispatch(setFilter({ priority: e.target.value }))

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
            <button className="btn-primary text-sm flex items-center gap-2">
              <Add fontSize="small" /> Add Lead
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }} />
          <input
            type="text"
            placeholder="Search leads, companies…"
            value={filters.search}
            onChange={handleSearch}
            className="input-field pl-9"
          />
        </div>
        <select value={filters.status} onChange={handleStatusFilter} className="input-field w-auto min-w-[140px]">
          <option value="">All Status</option>
          {['new','contacted','qualified','proposal','negotiation','won','lost'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={filters.priority} onChange={handlePriorityFilter} className="input-field w-auto min-w-[130px]">
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
                  {['Lead', 'Contact', 'Status', 'Priority', 'Deal Value', 'Source', 'Next Follow Up', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
                <AnimatePresence>
                  {leads.map((lead, i) => (
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
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
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
                        <span className="text-xs text-slate-500 dark:text-slate-400">{lead.source}</span>
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
          {leads.map((lead, i) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-4 hover:shadow-card-hover transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
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
