import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import {
  FaUserPlus, FaFileAlt, FaMapPin,
  FaBullhorn, FaEnvelope, FaImage, FaEdit
} from 'react-icons/fa'
import { timeAgo } from '../../../utils'
import SectionCard from '../../../components/common/SectionCard'

const ICON_MAP = {
  campaign_created:  { Icon: FaBullhorn,    bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-600 dark:text-indigo-400'  },
  campaign_updated:  { Icon: FaEdit,        bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400'},
  leads_generated:   { Icon: FaUserPlus,    bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400'    },
  email_sent:        { Icon: FaEnvelope,    bg: 'bg-pink-100 dark:bg-pink-900/30',       text: 'text-pink-600 dark:text-pink-400'      },
  content_published: { Icon: FaFileAlt,     bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600 dark:text-cyan-400'      },
  asset_uploaded:    { Icon: FaImage,       bg: 'bg-purple-100 dark:bg-purple-900/30',   text: 'text-purple-600 dark:text-purple-400'  },
}
const DEFAULT = { Icon: FaMapPin, bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500' }

export default function MarketingActivityTimeline() {
  const { activities } = useSelector((s) => s.marketingDashboard)

  return (
    <SectionCard title="Recent Activities" subtitle="Your latest marketing operations" delay={0.25}>
      <div className="relative">
        <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-primary-200 via-purple-200 to-transparent dark:from-primary-900 dark:via-purple-900" />

        <div className="space-y-4">
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
