import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FaCalendarAlt, FaPhoneAlt, FaTasks, FaRocket, FaFlag, FaHourglassHalf } from 'react-icons/fa'
import { Schedule } from '@mui/icons-material'
import SectionCard from '../common/SectionCard'
import { formatDate, formatTime } from '../../utils'

const TYPE_CONFIG = {
  meeting: { Icon: FaCalendarAlt, bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  followup: { Icon: FaPhoneAlt, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  task: { Icon: FaTasks, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  campaign_start: { Icon: FaRocket, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  campaign_end: { Icon: FaFlag, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  generic: { Icon: FaHourglassHalf, bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500' },
}

export default function UpcomingEventsWidget() {
  const { list: meetings } = useSelector((s) => s.meetings || { list: [] })
  const { list: tasks } = useSelector((s) => s.tasks || { list: [] })
  const { opportunities: campaigns } = useSelector((s) => s.marketingDashboard || { opportunities: [] })

  const upcomingEvents = useMemo(() => {
    const list = []
    const now = new Date()

    // 1. Meetings
    meetings.forEach(m => {
      const d = new Date(m.date)
      if (d >= now) {
        list.push({
          id: `meet-${m.id}`,
          title: m.title || `Meeting with ${m.clientName || m.client || 'Client'}`,
          date: d,
          type: 'meeting',
          details: m.location || 'Online Video Call'
        })
      }
    })

    // 2. Tasks / Follow-ups
    tasks.forEach(t => {
      if (t.dueDate) {
        const d = new Date(t.dueDate)
        if (d >= now) {
          const isFollowUp = String(t.title).toLowerCase().includes('follow') || String(t.description).toLowerCase().includes('follow')
          list.push({
            id: `task-${t.id}`,
            title: t.title,
            date: d,
            type: isFollowUp ? 'followup' : 'task',
            details: `Priority: ${t.priority || 'medium'}`
          })
        }
      }
    })

    // 3. Campaigns
    campaigns.forEach(c => {
      if (c.start_date) {
        const d = new Date(c.start_date)
        if (d >= now) {
          list.push({
            id: `camp-start-${c.id}`,
            title: `🚀 Launch: ${c.campaign_name}`,
            date: d,
            type: 'campaign_start',
            details: `Channel: ${c.campaign_type || 'Email'}`
          })
        }
      }
      if (c.end_date) {
        const d = new Date(c.end_date)
        if (d >= now) {
          list.push({
            id: `camp-end-${c.id}`,
            title: `🏁 Close: ${c.campaign_name}`,
            date: d,
            type: 'campaign_end',
            details: `Budget: $${(c.budget || 0).toLocaleString()}`
          })
        }
      }
    })

    // Sort chronologically (closest first)
    list.sort((a, b) => a.date.getTime() - b.date.getTime())
    return list.slice(0, 5)
  }, [meetings, tasks, campaigns])

  return (
    <SectionCard
      title="Upcoming Events"
      subtitle="Agenda items next in line"
      delay={0.3}
      actions={<span className="badge badge-info">{upcomingEvents.length} pending</span>}
      className="h-[380px] flex flex-col"
    >
      <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((e, i) => {
            const config = TYPE_CONFIG[e.type] || TYPE_CONFIG.generic
            const { Icon } = config
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl ${config.bg} ${config.text} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">{e.title}</p>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{e.details}</p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                    <Schedule style={{ fontSize: 11 }} />
                    <span>{formatDate(e.date)} at {formatTime(e.date)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })
        ) : (
          <p className="text-xs text-neutral-400 italic text-center py-4">No upcoming events scheduled.</p>
        )}
      </div>
    </SectionCard>
  )
}
