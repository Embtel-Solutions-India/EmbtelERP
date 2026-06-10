import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Add, Edit, Visibility } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { FaDollarSign, FaBullseye, FaChartLine } from 'react-icons/fa'
import PageHeader from '../components/common/PageHeader'
import ActionFormModal from '../components/common/ActionFormModal'
import { addOpportunity } from '../redux/slices/dashboardSlice'
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
      <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
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
  const dispatch = useDispatch()
  const { opportunities } = useSelector((s) => s.dashboard)
  const [isOpportunityFormOpen, setOpportunityFormOpen] = useState(false)

  const totalValue = opportunities.reduce((s, o) => s + o.value, 0)
  const avgProbability = Math.round(opportunities.reduce((s, o) => s + o.probability, 0) / opportunities.length)
  const weightedValue = opportunities.reduce((s, o) => s + (o.value * o.probability / 100), 0)
  const handleAddOpportunity = (values) => {
    dispatch(addOpportunity({
      id: Date.now(),
      name: values.name,
      company: values.company,
      value: Number(values.value) || 0,
      probability: Number(values.probability) || 0,
      stage: values.stage,
      closingDate: new Date(values.closingDate).toISOString(),
    }))
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Opportunities"
        subtitle={`${opportunities.length} active opportunities`}
        breadcrumbs={['Dashboard', 'Opportunities']}
        actions={<button onClick={() => setOpportunityFormOpen(true)} className="btn-primary text-sm flex items-center gap-2"><Add fontSize="small" /> New Opportunity</button>}
      />

      <ActionFormModal
        open={isOpportunityFormOpen}
        title="New Opportunity"
        subtitle="Add a deal to the active pipeline"
        fields={[
          { name: 'name', label: 'Opportunity Name', required: true },
          { name: 'company', label: 'Company', required: true },
          { name: 'value', label: 'Deal Value', type: 'number', min: 0, required: true },
          { name: 'probability', label: 'Probability', type: 'number', min: 0, max: 100, required: true },
          {
            name: 'stage',
            label: 'Stage',
            type: 'select',
            options: ['Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map((value) => ({ value, label: value })),
          },
          { name: 'closingDate', label: 'Expected Close', type: 'date', required: true },
        ]}
        initialValues={{ name: '', company: '', value: '', probability: 50, stage: 'Qualified', closingDate: '' }}
        submitLabel="Create Opportunity"
        onClose={() => setOpportunityFormOpen(false)}
        onSubmit={handleAddOpportunity}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Pipeline Value', value: formatCurrency(totalValue),    Icon: FaDollarSign, color: 'text-primary-600' },
          { label: 'Weighted Value',       value: formatCurrency(weightedValue), Icon: FaBullseye,   color: 'text-emerald-600' },
          { label: 'Avg Probability',      value: `${avgProbability}%`,          Icon: FaChartLine,  color: 'text-amber-600'   },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-700 flex items-center justify-center ${s.color}`}>
                <s.Icon size={22} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
                {['Opportunity', 'Company', 'Deal Value', 'Probability', 'Expected Close', 'Stage', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
              {opportunities.map((opp, i) => (
                <motion.tr key={opp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{opp.name}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{opp.company}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">{formatCurrency(opp.value)}</span>
                  </td>
                  <td className="px-5 py-4 min-w-[120px]"><ProbabilityBar value={opp.probability} /></td>
                  <td className="px-5 py-4 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(opp.closingDate)}</td>
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
