import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Add, Mail, CalendarToday, PlayCircle, ContentCopy, Close, Send } from '@mui/icons-material'
import PageHeader from '../../../components/common/PageHeader'
import ActionFormModal from '../../../components/common/ActionFormModal'
import { formatDate } from '../../../utils'
import { addBroadcast, cancelBroadcast } from '../redux/marketingEmailSlice'
import SectionCard from '../../../components/common/SectionCard'

const STATUS_COLORS = {
  Scheduled: 'badge-info',
  Completed: 'badge-success',
  Cancelled: 'badge-error',
}

const TEMPLATES = [
  { id: 't1', title: 'Product Launch Template', subject: 'Introducing our new AI Co-pilot!', description: 'Structured announcement template with prominent CTA buttons and feature highlight grid.' },
  { id: 't2', title: 'Monthly Newsletter Template', subject: 'What\'s new at CRMPro: Q2 Insights', description: 'Curated digest style template with blog articles feed, customer stories and tech updates.' },
  { id: 't3', title: 'Seasonal Promo Blast', subject: 'Summer Flash Sale: 40% OFF All Plans', description: 'Vibrant promotional template featuring bold pricing banners, countdown timer block and direct purchase links.' },
]

export default function MarketingEmail() {
  const dispatch = useDispatch()
  const { list: broadcasts } = useSelector((s) => s.marketingEmails)
  const [isFormOpen, setFormOpen] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(null)

  const upcoming = broadcasts.filter(m => m.status === 'Scheduled')
  const completed = broadcasts.filter(m => m.status === 'Completed')

  const handleCreateBroadcast = (values) => {
    dispatch(addBroadcast({
      id: Date.now(),
      client: values.channel, // Channel, e.g. Mailchimp, Google Ads
      company: values.campaignName,
      type: values.broadcastType,
      date: new Date(values.date).toISOString(),
      duration: Number(values.duration) || 30,
      location: values.platformConsole || 'Marketing Dashboard',
      status: 'Scheduled',
      link: values.link || null,
    }))
  }

  const handleDuplicateTemplate = (tpl) => {
    setActiveTemplate(tpl)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Email Marketing & Broadcasts"
        subtitle={`${upcoming.length} broadcasts scheduled · ${completed.length} completed`}
        breadcrumbs={['Dashboard', 'Email Marketing']}
        actions={
          <button onClick={() => { setActiveTemplate(null); setFormOpen(true); }} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Schedule Broadcast
          </button>
        }
      />

      <ActionFormModal
        open={isFormOpen}
        title={activeTemplate ? `Use ${activeTemplate.title}` : "Schedule Marketing Broadcast"}
        subtitle="Configure communication channel, platform, and scheduled date"
        fields={[
          { name: 'campaignName', label: 'Campaign / Subject Name', required: true, initialValue: activeTemplate ? activeTemplate.subject : '' },
          { name: 'channel', label: 'Channel Brand (e.g. Mailchimp, Google Ads, LinkedIn)', required: true },
          {
            name: 'broadcastType',
            label: 'Broadcast Category',
            type: 'select',
            options: ['Email Broadcast', 'PPC Launch', 'Social Post', 'Content Release', 'Webinar Event'].map((v) => ({ value: v, label: v })),
          },
          { name: 'date', label: 'Broadcast Date & Time', type: 'datetime-local', required: true },
          { name: 'duration', label: 'Execution / Duration (minutes)', type: 'number', min: 5, step: 5, required: true },
          { name: 'platformConsole', label: 'Platform Dashboard / Console Console (e.g. Mailchimp Builder)', required: true },
          { name: 'link', label: 'Live Link (Optional)', type: 'url', fullWidth: true },
        ]}
        initialValues={{ 
          campaignName: activeTemplate ? activeTemplate.subject : '', 
          channel: activeTemplate ? 'Mailchimp' : 'Mailchimp', 
          broadcastType: activeTemplate ? 'Email Broadcast' : 'Email Broadcast', 
          date: '', 
          duration: 30, 
          platformConsole: 'Mailchimp Campaign Builder', 
          link: '' 
        }}
        submitLabel="Schedule Campaign"
        onClose={() => { setFormOpen(false); setActiveTemplate(null); }}
        onSubmit={handleCreateBroadcast}
      />

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Upcoming Broadcasts', value: upcoming.length, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', Icon: CalendarToday },
          { label: 'Completed Deliveries', value: completed.length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', Icon: Mail },
          { label: 'Live Platform Streams', value: broadcasts.filter(b => b.link && b.status === 'Scheduled').length, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', Icon: PlayCircle },
        ].map((s) => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 ${s.bg}`}>
            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center ${s.color}`}>
              <s.Icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Columns: 1. Templates Duplicator  2. Broadcast List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates column */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 px-1">
            <ContentCopy fontSize="small" /> Email Newsletters Templates
          </h2>
          {TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="card p-4 space-y-3 border-l-4 border-indigo-500 bg-slate-50/50 dark:bg-gray-800/30">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{tpl.title}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic mt-0.5">Subject: "{tpl.subject}"</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tpl.description}</p>
              <button 
                onClick={() => handleDuplicateTemplate(tpl)}
                className="btn-secondary w-full text-xs py-1.5 flex items-center justify-center gap-1.5"
              >
                <ContentCopy style={{ fontSize: 13 }} /> Use & Schedule Template
              </button>
            </div>
          ))}
        </div>

        {/* Scheduled broadcast grid */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 px-1">
            <Mail fontSize="small" /> Scheduled Broadcast Queue
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {broadcasts.map((broadcast, i) => (
              <motion.div
                key={broadcast.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">{broadcast.client}</span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{broadcast.company}</h3>
                  </div>
                  <span className={STATUS_COLORS[broadcast.status] || 'badge-primary'}>{broadcast.status}</span>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 px-2.5 py-1 rounded-md font-semibold text-slate-600 dark:text-slate-300">
                    {broadcast.type}
                  </span>
                  <span className="flex items-center gap-1 px-1">
                    Scheduled: {formatDate(broadcast.date)}
                  </span>
                  <span className="flex items-center gap-1 px-1">
                    Console: {broadcast.location}
                  </span>
                </div>

                {broadcast.status === 'Scheduled' && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-gray-700">
                    {broadcast.link && (
                      <a href={broadcast.link} target="_blank" rel="noopener noreferrer"
                        className="btn-primary flex items-center gap-1.5 text-xs py-1.5">
                        <Send style={{ fontSize: 13 }} /> Manage Platform
                      </a>
                    )}
                    <button
                      onClick={() => dispatch(cancelBroadcast(broadcast.id))}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold"
                    >
                      <Close style={{ fontSize: 13 }} /> Cancel Release
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
