import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import {
  FaUserPlus, FaPhone, FaCalendarAlt, FaCheckCircle,
  FaTrophy, FaFileAlt, FaStar, FaMapPin,
} from 'react-icons/fa'
import { timeAgo } from '../../utils'
import SectionCard from '../common/SectionCard'

// Maps the real Activity.action enum to an icon + human label.
const ACTION_META = {
  CREATE:                { Icon: FaUserPlus,    bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-600 dark:text-indigo-400',  label: 'Created' },
  UPDATE:                { Icon: FaFileAlt,     bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600 dark:text-cyan-400',      label: 'Updated' },
  STATUS_CHANGE:         { Icon: FaStar,        bg: 'bg-purple-100 dark:bg-purple-900/30',   text: 'text-purple-600 dark:text-purple-400',  label: 'Status changed' },
  PAYMENT_STATUS_CHANGE: { Icon: FaTrophy,      bg: 'bg-pink-100 dark:bg-pink-900/30',       text: 'text-pink-600 dark:text-pink-400',      label: 'Payment updated' },
  ASSIGNMENT_CHANGE:     { Icon: FaUserPlus,    bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400',    label: 'Reassigned' },
  DELETE:                { Icon: FaMapPin,      bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-600 dark:text-red-400',        label: 'Deleted' },
  LOGIN:                 { Icon: FaCheckCircle, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400',label: 'Signed in' },
  LOGOUT:                { Icon: FaPhone,       bg: 'bg-neutral-100 dark:bg-neutral-700',    text: 'text-neutral-500',                      label: 'Signed out' },
}
const DEFAULT = { Icon: FaMapPin, bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-500', label: 'Activity' }
const TARGET_LABEL = {
  SalesLead: 'lead', MarketingLead: 'lead', Task: 'task', SalesTask: 'task',
  CalendarEvent: 'meeting', Employee: 'employee', SalesTarget: 'target',
}

// Normalise a real backend Activity row into the display shape (with a legacy fallback).
function normalize(a) {
  if (a.action || a.actor || a.createdAt) {
    const meta = ACTION_META[a.action] || DEFAULT
    const target = TARGET_LABEL[a.targetType] || (a.targetType ? String(a.targetType).toLowerCase() : 'record')
    const actorName = a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : ''
    const extra = a.metadata?.status ? ` → ${a.metadata.status}` : a.metadata?.source ? ` · ${a.metadata.source}` : ''
    return {
      id: a.id,
      meta,
      title: `${meta.label} ${target}${extra}`,
      description: actorName + (a.actor?.designation ? ` · ${a.actor.designation}` : ''),
      time: a.createdAt,
    }
  }
  return { id: a.id, meta: DEFAULT, title: a.title, description: a.description, time: a.time }
}

export default function ActivityTimeline() {
  const dashboardActivities = useSelector((s) => s.dashboard?.activities)
  const workspaceActivities = useSelector((s) => s.workspace?.activities)
  const raw = (workspaceActivities?.length ? workspaceActivities : dashboardActivities) || []
  const activities = raw.map(normalize)

  return (
    <SectionCard title="Recent Activities" subtitle="Your latest CRM interactions" delay={0.25} className="h-[420px] flex flex-col">
      <div className="relative flex-1 min-h-0 flex flex-col">
        {activities.length > 0 && (
          <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-primary-200 via-purple-200 to-transparent dark:from-primary-900 dark:via-purple-900" />
        )}

        <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {activities.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 gap-1">
              <FaMapPin size={22} className="text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs">Actions like creating leads or updating tasks appear here.</p>
            </div>
          ) : activities.map((activity, i) => {
            const { Icon } = activity.meta
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.1 }}
                className="flex gap-4 group"
              >
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.meta.bg} ${activity.meta.text} border-2 border-white dark:border-neutral-800 shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <Icon size={15} />
                </div>

                <div className="flex-1 min-w-0 pb-3 border-b border-neutral-50 dark:border-neutral-700/50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 capitalize">{activity.title}</p>
                      {activity.description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{activity.description}</p>}
                    </div>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0 mt-0.5">{timeAgo(activity.time)}</span>
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
