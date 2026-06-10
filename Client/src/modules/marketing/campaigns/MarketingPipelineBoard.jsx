import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { updateCampaignStatus } from '../redux/marketingDashboardSlice'
import { MARKETING_PIPELINE_COLUMNS } from '../../../constants'
import { formatCurrency, getInitials } from '../../../utils'
import SectionCard from '../../../components/common/SectionCard'
import { FaBullhorn } from 'react-icons/fa'

function CampaignCard({ campaign, onDragStart }) {
  const statusColors = {
    Active: 'bg-emerald-500',
    Draft: 'bg-indigo-500',
    Paused: 'bg-amber-500',
    Completed: 'bg-cyan-500',
    Archived: 'bg-rose-500'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      draggable
      onDragStart={(e) => onDragStart(e, campaign)}
      className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-100 dark:border-neutral-700 cursor-grab active:cursor-grabbing shadow-sm"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            <FaBullhorn size={12} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{campaign.campaign_name}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{campaign.service_promoted}</p>
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${statusColors[campaign.status] || 'bg-neutral-300'}`} />
      </div>

      <div className="space-y-1 mb-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">Audience: {campaign.target_audience}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Type: {campaign.campaign_type}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Budget: {formatCurrency(campaign.budget)}</span>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">{campaign.start_date}</span>
      </div>
    </motion.div>
  )
}

export default function MarketingPipelineBoard() {
  const dispatch = useDispatch()
  const { opportunities: campaigns } = useSelector((s) => s.marketingDashboard)
  const [draggedCampaign, setDraggedCampaign] = useState(null)
  const [overColumn, setOverColumn] = useState(null)

  const getCampaignsByStatus = (statusId) => campaigns.filter((c) => c.status === statusId)

  const handleDragStart = (e, campaign) => {
    setDraggedCampaign(campaign)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverColumn(columnId)
  }

  const handleDrop = (e, columnId) => {
    e.preventDefault()
    if (draggedCampaign && draggedCampaign.status !== columnId) {
      dispatch(updateCampaignStatus({ id: draggedCampaign.id, status: columnId }))
    }
    setDraggedCampaign(null)
    setOverColumn(null)
  }

  const handleDragLeave = () => setOverColumn(null)

  return (
    <SectionCard
      title="Campaign Board"
      subtitle="Drag and drop campaigns to update their statuses"
      delay={0.1}
      noPadding
      actions={
        <span className="badge badge-primary text-xs">{campaigns.length} Total</span>
      }
    >
      <div className="overflow-x-auto px-5 pb-5">
        <div className="flex gap-3 min-w-max">
          {MARKETING_PIPELINE_COLUMNS.map((col) => {
            const colCampaigns = getCampaignsByStatus(col.id)
            const colBudget = colCampaigns.reduce((s, c) => s + c.budget, 0)
            const isOver = overColumn === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragLeave={handleDragLeave}
                className={`flex flex-col w-64 rounded-xl transition-all duration-200 ${
                  isOver ? 'ring-2 ring-primary-400 bg-primary-50/50 dark:bg-primary-900/20' : ''
                }`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 mb-2 rounded-xl bg-neutral-50 dark:bg-neutral-700/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{col.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">{formatCurrency(colBudget)}</span>
                    <span
                      className="text-xs font-bold text-white px-1.5 py-0.5 rounded-md"
                      style={{ background: col.color }}
                    >
                      {colCampaigns.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 min-h-[120px]">
                  <div className="flex-grow space-y-2">
                    {colCampaigns.map((camp) => (
                      <CampaignCard key={camp.id} campaign={camp} onDragStart={handleDragStart} />
                    ))}
                  </div>
                  {colCampaigns.length === 0 && (
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      isOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10' : 'border-neutral-200 dark:border-neutral-700'
                    }`}>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">Drop campaigns here</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SectionCard>
  )
}
