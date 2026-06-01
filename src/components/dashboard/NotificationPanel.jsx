import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { FaUserPlus, FaCalendarAlt, FaBullseye, FaCommentDots, FaCog } from 'react-icons/fa'
import { markRead, markAllRead } from '../../redux/slices/notificationSlice'
import { timeAgo } from '../../utils'
import SectionCard from '../common/SectionCard'

const TYPE_STYLES = {
  lead:    { bg: 'bg-indigo-100 dark:bg-indigo-900/30',   Icon: FaUserPlus,    iconCls: 'text-indigo-600 dark:text-indigo-400',   dot: 'bg-indigo-500'  },
  meeting: { bg: 'bg-cyan-100 dark:bg-cyan-900/30',       Icon: FaCalendarAlt, iconCls: 'text-cyan-600 dark:text-cyan-400',       dot: 'bg-cyan-500'    },
  target:  { bg: 'bg-purple-100 dark:bg-purple-900/30',   Icon: FaBullseye,    iconCls: 'text-purple-600 dark:text-purple-400',   dot: 'bg-purple-500'  },
  client:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', Icon: FaCommentDots, iconCls: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  system:  { bg: 'bg-slate-100 dark:bg-slate-700/50',     Icon: FaCog,         iconCls: 'text-slate-500 dark:text-slate-400',     dot: 'bg-slate-400'   },
}

export default function NotificationPanel() {
  const dispatch = useDispatch()
  const { list, unreadCount } = useSelector((s) => s.notifications)

  return (
    <SectionCard
      title="Notifications"
      subtitle="CRM alerts & updates"
      delay={0.3}
      actions={
        unreadCount > 0 ? (
          <button
            onClick={() => dispatch(markAllRead())}
            className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline"
          >
            Mark all read
          </button>
        ) : null
      }
    >
      <div className="space-y-2">
        {list.slice(0, 6).map((n, i) => {
          const style = TYPE_STYLES[n.type] || TYPE_STYLES.system
          const { Icon } = style
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => dispatch(markRead(n.id))}
              className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
                !n.read ? `${style.bg} border border-current/10` : 'hover:bg-slate-50 dark:hover:bg-gray-700/40'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={style.iconCls} size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {n.title}
                    {!n.read && <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />}
                  </p>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{timeAgo(n.time)}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </SectionCard>
  )
}
