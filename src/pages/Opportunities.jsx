import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Add, Edit, Visibility } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { FaDollarSign, FaBullseye, FaChartLine } from 'react-icons/fa'
import PageHeader from '../components/common/PageHeader'
import { formatCurrency, formatDate } from '../utils'

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
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold w-8" style={{ color }}>{value}%</span>
    </div>
  )
}

export default function Opportunities() {
  const { opportunities } = useSelector((s) => s.dashboard)

  const totalValue = opportunities.reduce((s, o) => s + o.value, 0)
  const avgProbability = Math.round(opportunities.reduce((s, o) => s + o.probability, 0) / opportunities.length)
  const weightedValue = opportunities.reduce((s, o) => s + (o.value * o.probability / 100), 0)

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Opportunities"
        subtitle={`${opportunities.length} active opportunities`}
        breadcrumbs={['Dashboard', 'Opportunities']}
        actions={<button className="btn-primary text-sm flex items-center gap-2"><Add fontSize="small" /> New Opportunity</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Pipeline Value', value: formatCurrency(totalValue),    Icon: FaDollarSign, color: 'text-primary-600' },
          { label: 'Weighted Value',       value: formatCurrency(weightedValue), Icon: FaBullseye,   color: 'text-emerald-600' },
          { label: 'Avg Probability',      value: `${avgProbability}%`,          Icon: FaChartLine,  color: 'text-amber-600'   },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-gray-700 flex items-center justify-center ${s.color}`}>
                <s.Icon size={22} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                {['Opportunity', 'Company', 'Deal Value', 'Probability', 'Expected Close', 'Stage', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
              {opportunities.map((opp, i) => (
                <motion.tr key={opp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{opp.name}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{opp.company}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">{formatCurrency(opp.value)}</span>
                  </td>
                  <td className="px-5 py-4 min-w-[120px]"><ProbabilityBar value={opp.probability} /></td>
                  <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(opp.closingDate)}</td>
                  <td className="px-5 py-4">
                    <span className={STAGE_COLORS[opp.stage] || 'badge-primary'}>{opp.stage}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip title="View"><button className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"><Visibility style={{ fontSize: 16 }} /></button></Tooltip>
                      <Tooltip title="Edit"><button className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"><Edit style={{ fontSize: 16 }} /></button></Tooltip>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
