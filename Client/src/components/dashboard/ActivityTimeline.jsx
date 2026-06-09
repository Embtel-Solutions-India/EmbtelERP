import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import {
  FaUserPlus, FaPhone, FaCalendarAlt, FaCheckCircle,
  FaTrophy, FaFileAlt, FaStar, FaMapPin,
} from 'react-icons/fa'
import { timeAgo } from '../../utils'
import SectionCard from '../common/SectionCard'

const ICON_MAP = {
  lead_created:      { Icon: FaUserPlus,    bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-600 dark:text-indigo-400'  },
  follow_up:         { Icon: FaPhone,       bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400'},
  meeting_scheduled: { Icon: FaCalendarAlt, bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400'    },
  meeting_completed: { Icon: FaCheckCircle, bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-600 dark:text-teal-400'      },
  deal_closed:       { Icon: FaTrophy,      bg: 'bg-pink-100 dark:bg-pink-900/30',       text: 'text-pink-600 dark:text-pink-400'      },
  quote_sent:        { Icon: FaFileAlt,     bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600 dark:text-cyan-400'      },
  lead_qualified:    { Icon: FaStar,        bg: 'bg-purple-100 dark:bg-purple-900/30',   text: 'text-purple-600 dark:text-purple-400'  },
}
const DEFAULT = { Icon: FaMapPin, bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500' }

export default function ActivityTimeline() {
  const dashboardActivities = useSelector((s) => s.dashboard?.activities)
  const workspaceActivities = useSelector((s) => s.workspace?.activities)
  const activities = (workspaceActivities?.length ? workspaceActivities : dashboardActivities) || []

  return (
    <SectionCard title="Recent Activities" subtitle="Your latest CRM interactions" delay={0.25} className="h-[380px] flex flex-col">
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-primary-200 via-purple-200 to-transparent dark:from-primary-900 dark:via-purple-900" />

        <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {activities.map((activity, i) => {
            const entry = ICON_MAP[activity.type] || DEFAULT
            const { Icon } = entry
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.1 }}
                className="flex gap-4 group"
              >
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${entry.bg} ${entry.text} border-2 border-white dark:border-gray-800 shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <Icon size={15} />
                </div>

                <div className="flex-1 min-w-0 pb-3 border-b border-slate-50 dark:border-gray-700/50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activity.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5">{timeAgo(activity.time)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <button className="mt-4 w-full text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline py-2">
        View all activity →
      </button>
    </SectionCard>
  )
}
