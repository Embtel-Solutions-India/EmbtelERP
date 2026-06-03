import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../../utils'
import SectionCard from '../../../components/common/SectionCard'

export default function MarketingTopCampaignsTable() {
  const { opportunities } = useSelector((s) => s.marketingDashboard)

  // Sort campaigns by revenue generated descending and take the top 5
  const topCampaigns = [...opportunities]
    .sort((a, b) => b.revenue_generated - a.revenue_generated)
    .slice(0, 5)

  const statusBadge = (status) => {
    const map = {
      Active: 'badge-success',
      Paused: 'badge-warning',
      Completed: 'badge-info',
      Draft: 'badge-primary',
    }
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status}</span>
  }

  return (
    <SectionCard
      title="Top Performing Campaigns"
      subtitle="Highest revenue generating marketing campaigns"
      delay={0.15}
      noPadding
      actions={<span className="badge badge-success">Top ROI</span>}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-gray-700">
              {['Campaign Name', 'Type', 'Budget', 'Leads Generated', 'Conversions', 'Revenue', 'ROI', 'Status'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
            {topCampaigns.map((campaign, i) => {
              const roi = campaign.budget > 0 
                ? (campaign.revenue_generated / campaign.budget).toFixed(1) + 'x'
                : '0.0x'
              return (
                <motion.tr
                  key={campaign.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{campaign.campaign_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{campaign.target_audience}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{campaign.campaign_type}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">{formatCurrency(campaign.budget)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{campaign.leads_generated}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{campaign.conversions}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">{formatCurrency(campaign.revenue_generated)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{roi}</span>
                  </td>
                  <td className="px-5 py-3">{statusBadge(campaign.status)}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
