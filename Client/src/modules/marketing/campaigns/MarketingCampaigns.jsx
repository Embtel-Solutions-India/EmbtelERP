import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Add, Edit, Visibility, Lock } from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { FaDollarSign, FaBullseye, FaChartLine } from 'react-icons/fa'
import PageHeader from '../../../components/common/PageHeader'
import ActionFormModal from '../../../components/common/ActionFormModal'
import { addCampaign, updateCampaign } from '../redux/marketingDashboardSlice'
import { formatCurrency, formatDate } from '../../../utils'

const STATUS_COLORS = {
  Active: 'badge-success',
  Paused: 'badge-warning',
  Completed: 'badge-info',
  Draft: 'badge-primary',
}

export default function MarketingCampaigns() {
  const dispatch = useDispatch()
  const { opportunities: campaigns } = useSelector((s) => s.marketingDashboard)
  const [isFormOpen, setFormOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)

  const totalBudget = useMemo(() => campaigns.reduce((s, o) => s + (o.budget || 0), 0), [campaigns])
  const totalRevenue = useMemo(() => campaigns.reduce((s, o) => s + (o.revenue_generated || 0), 0), [campaigns])
  const avgROI = useMemo(() => {
    if (totalBudget === 0) return '0.0x'
    return (totalRevenue / totalBudget).toFixed(1) + 'x'
  }, [totalBudget, totalRevenue])

  const handleCreateOrUpdateCampaign = (values) => {
    if (editingCampaign) {
      dispatch(updateCampaign({
        id: editingCampaign.id,
        ...values,
        budget: Number(values.budget) || 0,
      }))
    } else {
      dispatch(addCampaign({
        id: Date.now(),
        campaign_name: values.campaign_name,
        campaign_type: values.campaign_type,
        target_audience: values.target_audience,
        service_promoted: values.service_promoted || 'General',
        budget: Number(values.budget) || 0,
        start_date: values.start_date,
        end_date: values.end_date,
        status: values.status,
        leads_generated: 0,
        conversions: 0,
        emails_sent: 0,
        open_rate: 0,
        click_rate: 0,
        revenue_generated: 0,
        owner_approval: 'Pending Approval', // Forced default
      }))
    }
    setFormOpen(false)
    setEditingCampaign(null)
  }

  const handleEditClick = (campaign) => {
    setEditingCampaign(campaign)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Marketing Campaigns"
        subtitle={`${campaigns.length} campaigns listed in budget pipeline`}
        breadcrumbs={['Dashboard', 'Campaigns']}
        actions={
          <button onClick={() => { setEditingCampaign(null); setFormOpen(true); }} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> New Campaign
          </button>
        }
      />

      <ActionFormModal
        open={isFormOpen}
        title={editingCampaign ? "Edit Campaign Details" : "Create New Campaign"}
        subtitle="Specify target audience, platform channel, and campaign budget"
        fields={[
          { name: 'campaign_name', label: 'Campaign Name', required: true, initialValue: editingCampaign?.campaign_name || '' },
          {
            name: 'campaign_type',
            label: 'Campaign Channel Type',
            type: 'select',
            options: ['PPC', 'Email', 'SEO', 'Social', 'Event', 'Content'].map((v) => ({ value: v, label: v })),
            initialValue: editingCampaign?.campaign_type || 'PPC'
          },
          { name: 'target_audience', label: 'Target Audience Segment', required: true, initialValue: editingCampaign?.target_audience || '' },
          { name: 'budget', label: 'Campaign Budget', type: 'number', min: 0, required: true, initialValue: editingCampaign?.budget || '' },
          { name: 'start_date', label: 'Start Date', type: 'date', required: true, initialValue: editingCampaign?.start_date || '' },
          { name: 'end_date', label: 'End Date', type: 'date', required: true, initialValue: editingCampaign?.end_date || '' },
          {
            name: 'status',
            label: 'Initial Campaign Status',
            type: 'select',
            options: ['Draft', 'Active', 'Paused', 'Completed'].map((v) => ({ value: v, label: v })),
            initialValue: editingCampaign?.status || 'Draft'
          },
          {
            name: 'owner_approval',
            label: 'Department Owner Approval (Budget Locked)',
            type: 'select',
            options: [{ value: 'Pending Approval', label: 'Pending Approval' }],
            disabled: true,
            initialValue: 'Pending Approval',
            fullWidth: true,
            helperText: "Locked: Requires Department Owner Role to approve campaign budgets."
          }
        ]}
        initialValues={{
          campaign_name: editingCampaign?.campaign_name || '',
          campaign_type: editingCampaign?.campaign_type || 'PPC',
          target_audience: editingCampaign?.target_audience || '',
          budget: editingCampaign?.budget || '',
          start_date: editingCampaign?.start_date || '',
          end_date: editingCampaign?.end_date || '',
          status: editingCampaign?.status || 'Draft',
          owner_approval: 'Pending Approval'
        }}
        submitLabel={editingCampaign ? "Save Changes" : "Create Campaign"}
        onClose={() => { setFormOpen(false); setEditingCampaign(null); }}
        onSubmit={handleCreateOrUpdateCampaign}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Allocated Budget', value: formatCurrency(totalBudget), Icon: FaDollarSign, color: 'text-indigo-600' },
          { label: 'Total Revenue Generated', value: formatCurrency(totalRevenue), Icon: FaChartLine, color: 'text-emerald-600' },
          { label: 'Average Pipeline ROI', value: avgROI, Icon: FaBullseye, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-gray-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <s.Icon size={20} className={s.color} />
              </div>
              <div>
                <p className={`text-2xl font-bold text-slate-800 dark:text-slate-100`}>{s.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign List Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                {['Campaign Name', 'Type / Channel', 'Target Segment', 'Budget', 'Leads Generated', 'Revenues', 'Approval Lock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-700/50">
              {campaigns.map((opp, i) => (
                <motion.tr key={opp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{opp.campaign_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Starts: {opp.start_date}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">{opp.campaign_type}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{opp.target_audience}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">{formatCurrency(opp.budget)}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{opp.leads_generated || 0}</td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(opp.revenue_generated || 0)}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Lock style={{ fontSize: 13 }} className="text-amber-500" /> Locked (Pending)
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={STATUS_COLORS[opp.status] || 'badge-primary'}>{opp.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip title="View Stats"><button className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"><Visibility style={{ fontSize: 16 }} /></button></Tooltip>
                      <Tooltip title="Edit Campaign"><button onClick={() => handleEditClick(opp)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"><Edit style={{ fontSize: 16 }} /></button></Tooltip>
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
