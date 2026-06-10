import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Add, Phone, Email, WhatsApp, Visibility } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { FaExclamationTriangle, FaPhone, FaCalendarAlt } from 'react-icons/fa'
import PageHeader from '../components/common/PageHeader'
import ActionFormModal from '../components/common/ActionFormModal'
import PriorityBadge from '../components/common/PriorityBadge'
import { updateLead } from '../redux/slices/leadSlice'
import { formatDate, getDueBadge, getInitials } from '../utils'

export default function FollowUps() {
  const dispatch = useDispatch()
  const { list: leads } = useSelector((s) => s.leads)
  const [isFollowUpFormOpen, setFollowUpFormOpen] = useState(false)
  const followUps = leads.filter(l => l.nextFollowUp && l.status !== 'won' && l.status !== 'lost')

  const overdue   = followUps.filter(l => getDueBadge(l.nextFollowUp).color === 'error')
  const today     = followUps.filter(l => getDueBadge(l.nextFollowUp).color === 'warning')
  const upcoming  = followUps.filter(l => !['error','warning'].includes(getDueBadge(l.nextFollowUp).color))
  const leadOptions = leads.map((lead) => ({ value: String(lead.id), label: `${lead.name} - ${lead.company}` }))

  const handleCreateFollowUp = (values) => {
    const lead = leads.find((item) => String(item.id) === values.leadId)
    if (!lead) return

    dispatch(updateLead({
      ...lead,
      nextFollowUp: new Date(values.nextFollowUp).toISOString(),
      lastContact: new Date().toISOString(),
    }))
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Follow Ups"
        subtitle={`${followUps.length} follow-ups tracked`}
        breadcrumbs={['Dashboard', 'Follow Ups']}
        actions={
          <button onClick={() => setFollowUpFormOpen(true)} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Create Follow Up
          </button>
        }
      />

      <ActionFormModal
        open={isFollowUpFormOpen}
        title="Create Follow Up"
        subtitle="Pick a lead and set the next follow-up time"
        fields={[
          { name: 'leadId', label: 'Lead', type: 'select', options: leadOptions, required: true, fullWidth: true },
          { name: 'nextFollowUp', label: 'Follow Up Date', type: 'datetime-local', required: true },
          {
            name: 'channel',
            label: 'Channel',
            type: 'select',
            options: ['Phone', 'Email', 'WhatsApp', 'Video Call'].map((value) => ({ value, label: value })),
          },
          { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ]}
        initialValues={{ leadId: leadOptions[0]?.value || '', nextFollowUp: '', channel: 'Phone', notes: '' }}
        submitLabel="Create Follow Up"
        onClose={() => setFollowUpFormOpen(false)}
        onSubmit={handleCreateFollowUp}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Overdue',  value: overdue.length,  color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-900/20',     Icon: FaExclamationTriangle },
          { label: 'Today',    value: today.length,    color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', Icon: FaPhone               },
          { label: 'Upcoming', value: upcoming.length, color: 'text-cyan-600',  bg: 'bg-cyan-50 dark:bg-cyan-900/20',   Icon: FaCalendarAlt         },
        ].map(s => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 ${s.bg}`}>
            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center ${s.color}`}>
              <s.Icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                {['Lead', 'Company', 'Last Contact', 'Next Follow Up', 'Priority', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
              {followUps.map((lead, i) => {
                const due = getDueBadge(lead.nextFollowUp)
                return (
                  <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(lead.name)}
                        </div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{lead.company}</td>
                    <td className="px-5 py-3 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(lead.lastContact)}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${due.color === 'error' ? 'badge-error' : due.color === 'warning' ? 'badge-warning' : 'badge-info'}`}>
                        {due.label}
                      </span>
                    </td>
                    <td className="px-5 py-3"><PriorityBadge priority={lead.priority} /></td>
                    <td className="px-5 py-3">
                      <span className="badge badge-info capitalize">{lead.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {[
                          { icon: <Phone style={{ fontSize: 15 }} />, color: 'text-emerald-600 hover:bg-emerald-50', tip: 'Call' },
                          { icon: <WhatsApp style={{ fontSize: 15 }} />, color: 'text-green-600 hover:bg-green-50', tip: 'WhatsApp' },
                          { icon: <Email style={{ fontSize: 15 }} />, color: 'text-blue-600 hover:bg-blue-50', tip: 'Email' },
                          { icon: <Visibility style={{ fontSize: 15 }} />, color: 'text-primary-600 hover:bg-primary-50', tip: 'View' },
                        ].map(({ icon, color, tip }) => (
                          <Tooltip key={tip} title={tip}>
                            <button className={`p-1.5 rounded-lg ${color} dark:hover:bg-neutral-700 transition-colors`}>{icon}</button>
                          </Tooltip>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
