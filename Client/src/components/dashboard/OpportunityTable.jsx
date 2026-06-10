import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { Visibility, Edit } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { formatCurrency, formatDate } from '../../utils'
import SectionCard from '../common/SectionCard'

const STAGE_COLORS = {
  'Qualified':     'badge-info',
  'Proposal Sent': 'badge-purple',
  'Negotiation':   'badge-warning',
  'Won':           'badge-success',
  'Lost':          'badge-error',
}

function ProbabilityBar({ value }) {
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{value}%</span>
    </div>
  )
}

export default function OpportunityTable() {
  const { opportunities } = useSelector((s) => s.dashboard)

  return (
    <SectionCard
      title="Top Opportunities"
      subtitle="High-value deals in pipeline"
      delay={0.25}
      noPadding
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-700">
              {['Opportunity', 'Deal Value', 'Probability', 'Closing Date', 'Stage', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
            {opportunities.map((opp, i) => (
              <motion.tr
                key={opp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group"
              >
                <td className="px-5 py-3">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{opp.name}</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{opp.company}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">{formatCurrency(opp.value)}</span>
                </td>
                <td className="px-5 py-3">
                  <ProbabilityBar value={opp.probability} />
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(opp.closingDate)}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={STAGE_COLORS[opp.stage] || 'badge-primary'}>{opp.stage}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip title="View">
                      <button className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors">
                        <Visibility style={{ fontSize: 16 }} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <button className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors">
                        <Edit style={{ fontSize: 16 }} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
