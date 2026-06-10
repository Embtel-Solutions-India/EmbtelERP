import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { updateLeadStatusAsync } from '../../redux/slices/leadSlice'
import { PIPELINE_COLUMNS } from '../../constants'
import { formatCurrency, getInitials, formatDate } from '../../utils'
import SectionCard from '../common/SectionCard'

function LeadCard({ lead, onDragStart }) {
  const priorityColors = { hot: 'bg-red-500', warm: 'bg-amber-500', cold: 'bg-cyan-500' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-100 dark:border-neutral-700 cursor-grab active:cursor-grabbing shadow-sm"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(lead.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{lead.name}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{lead.company}</p>
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${priorityColors[lead.priority] || 'bg-neutral-300'}`} />
      </div>

      <div className="space-y-1 mb-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{lead.email}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{lead.phone}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{formatCurrency(lead.value)}</span>
        {lead.nextFollowUp && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">{formatDate(lead.nextFollowUp)}</span>
        )}
      </div>
    </motion.div>
  )
}

export default function PipelineBoard() {
  const dispatch = useDispatch()
  const { list: leads } = useSelector((s) => s.leads)
  const [draggedLead, setDraggedLead] = useState(null)
  const [overColumn, setOverColumn] = useState(null)

  const getLeadsByStatus = (statusId) => leads.filter((l) => {
    const s = String(l.status).toLowerCase();
    if (statusId === 'new') return s === 'new';
    if (statusId === 'contacted') return s === 'contacted';
    if (statusId === 'qualified') return s === 'qualified';
    if (statusId === 'proposal') return s === 'proposal';
    if (statusId === 'negotiation') return s === 'negotiation';
    if (statusId === 'won') return s === 'won' || s === 'converted';
    if (statusId === 'lost') return s === 'lost';
    return s === statusId;
  })

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverColumn(columnId)
  }

  const handleDrop = (e, columnId) => {
    e.preventDefault()
    if (draggedLead) {
      const currentStatus = String(draggedLead.status).toLowerCase();
      if (currentStatus !== columnId) {
        dispatch(updateLeadStatusAsync({ id: draggedLead.id, status: columnId }))
      }
    }
    setDraggedLead(null)
    setOverColumn(null)
  }

  const handleDragLeave = () => setOverColumn(null)

  return (
    <SectionCard
      title="Lead Pipeline"
      subtitle="Drag and drop leads across stages"
      delay={0.1}
      noPadding
      actions={
        <span className="badge badge-primary text-xs">{leads.length} Total</span>
      }
    >
      <div className="overflow-x-auto px-5 pb-5">
        <div className="flex gap-3 min-w-max">
          {PIPELINE_COLUMNS.map((col) => {
            const colLeads = getLeadsByStatus(col.id)
            const colValue = colLeads.reduce((s, l) => s + l.value, 0)
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
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">{formatCurrency(colValue)}</span>
                    <span
                      className="text-xs font-bold text-white px-1.5 py-0.5 rounded-md"
                      style={{ background: col.color }}
                    >
                      {colLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 min-h-[120px]">
                  <AnimatePresence>
                    {colLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onDragStart={handleDragStart} />
                    ))}
                  </AnimatePresence>
                  {colLeads.length === 0 && (
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      isOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10' : 'border-neutral-200 dark:border-neutral-700'
                    }`}>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">Drop leads here</p>
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
