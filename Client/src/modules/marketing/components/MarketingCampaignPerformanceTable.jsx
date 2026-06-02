import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Visibility, Edit, Assessment } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import SectionCard from '../../../components/common/SectionCard'

const STATUS_MAP = {
  Active: 'badge-success',
  Draft: 'badge-primary',
  Paused: 'badge-warning',
  Completed: 'badge-info',
  Archived: 'badge-error',
}

export default function MarketingCampaignPerformanceTable() {
  const { opportunities: campaigns } = useSelector((s) => s.marketingDashboard)

  return (
    <SectionCard
      title="Campaign Performance"
      subtitle="Overview of active and draft campaigns"
      delay={0.15}
      noPadding
      actions={<span className="badge badge-warning">{campaigns.filter(c => c.status === 'Active').length} Active</span>}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-gray-700">
              {[
                'Campaign Name', 'Type', 'Target Audience', 'Service Promoted',
                'Leads', 'Conversions', 'Open %', 'Click %', 'ROI', 'Status', 'Actions'
              ].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
            {campaigns.map((camp, i) => {
              const roi = camp.budget > 0 ? `${(camp.revenue_generated / camp.budget).toFixed(1)}x` : '—'
              return (
                <motion.tr
                  key={camp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{camp.campaign_name}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{camp.campaign_type}</td>
                  <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{camp.target_audience}</td>
                  <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{camp.service_promoted}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{camp.leads_generated}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{camp.conversions}</td>
                  <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">{camp.open_rate > 0 ? `${camp.open_rate}%` : '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">{camp.click_rate > 0 ? `${camp.click_rate}%` : '—'}</td>
                  <td className="px-5 py-3 text-sm font-bold text-primary-600 dark:text-primary-400">{roi}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${STATUS_MAP[camp.status] || 'badge-primary'} whitespace-nowrap`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Tooltip title="View Details">
                        <button className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors">
                          <Visibility style={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <button className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors">
                          <Edit style={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Analytics">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors">
                          <Assessment style={{ fontSize: 16 }} />
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
