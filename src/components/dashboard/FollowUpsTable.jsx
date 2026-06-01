import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Phone, WhatsApp, Email, Visibility } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { formatDate, getDueBadge } from '../../utils'
import PriorityBadge from '../common/PriorityBadge'
import SectionCard from '../common/SectionCard'

export default function FollowUpsTable() {
  const { list: leads } = useSelector((s) => s.leads)
  const followUps = leads.filter((l) => l.nextFollowUp && l.status !== 'won' && l.status !== 'lost').slice(0, 7)

  const statusBadge = (status) => {
    const map = {
      new: 'badge-primary', contacted: 'badge-info', qualified: 'badge-success',
      proposal: 'badge-purple', negotiation: 'badge-warning',
    }
    return <span className={map[status] || 'badge-primary'}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
  }

  return (
    <SectionCard
      title="Today's Follow Ups"
      subtitle="Leads requiring your attention"
      delay={0.15}
      noPadding
      actions={<span className="badge badge-warning">{followUps.length} pending</span>}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-gray-700">
              {['Lead', 'Company', 'Last Contact', 'Next Follow Up', 'Priority', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
            {followUps.map((lead, i) => {
              const due = getDueBadge(lead.nextFollowUp)
              return (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{lead.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{lead.company}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(lead.lastContact)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${
                      due.color === 'error' ? 'badge-error' :
                      due.color === 'warning' ? 'badge-warning' :
                      due.color === 'info' ? 'badge-info' : 'badge-primary'
                    } whitespace-nowrap`}>
                      {due.label}
                    </span>
                  </td>
                  <td className="px-5 py-3"><PriorityBadge priority={lead.priority} /></td>
                  <td className="px-5 py-3">{statusBadge(lead.status)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Tooltip title="Call">
                        <button className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors">
                          <Phone style={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="WhatsApp">
                        <button className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors">
                          <WhatsApp style={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Email">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors">
                          <Email style={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <button className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors">
                          <Visibility style={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
