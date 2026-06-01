import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { VideoCall, LocationOn, Schedule, Cancel, Edit } from '@mui/icons-material'
import {
  FaDesktop, FaSearch, FaClipboardList, FaHandshake,
  FaFileSignature, FaRocket, FaPhoneAlt, FaCalendarAlt,
} from 'react-icons/fa'
import { cancelMeeting } from '../../redux/slices/meetingSlice'
import { formatDate, formatTime, getInitials } from '../../utils'
import SectionCard from '../common/SectionCard'

const TYPE_MAP = {
  'Product Demo':    { Icon: FaDesktop,       color: 'text-indigo-500'  },
  'Discovery Call':  { Icon: FaSearch,        color: 'text-cyan-500'    },
  'Proposal Review': { Icon: FaClipboardList, color: 'text-amber-500'   },
  'Negotiation':     { Icon: FaHandshake,     color: 'text-emerald-500' },
  'Contract Signing':{ Icon: FaFileSignature, color: 'text-purple-500'  },
  'Onboarding':      { Icon: FaRocket,        color: 'text-rose-500'    },
  'Check-in Call':   { Icon: FaPhoneAlt,      color: 'text-teal-500'    },
}
const DEFAULT_TYPE = { Icon: FaCalendarAlt, color: 'text-primary-500' }

const STATUS_COLORS = {
  Scheduled: 'badge-info',
  Ongoing:   'badge-warning',
  Completed: 'badge-success',
  Cancelled: 'badge-error',
}

export default function MeetingCards() {
  const dispatch = useDispatch()
  const { list: meetings } = useSelector((s) => s.meetings)
  const upcoming = meetings.filter((m) => m.status === 'Scheduled').slice(0, 4)

  return (
    <SectionCard
      title="Upcoming Meetings"
      subtitle="Scheduled client meetings"
      delay={0.2}
      actions={<span className="badge badge-info">{upcoming.length} upcoming</span>}
      className="flex flex-col h-full"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2">
        {upcoming.map((meeting, i) => {
          const typeEntry = TYPE_MAP[meeting.type] || DEFAULT_TYPE
          const { Icon: TypeIcon } = typeEntry
          return (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/40 border border-transparent hover:border-slate-100 dark:hover:border-gray-700 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(meeting.client)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{meeting.client}</span>
                      <TypeIcon className={typeEntry.color} size={13} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{meeting.company}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{meeting.type}</span>
                    </div>
                  </div>
                  <span className={`${STATUS_COLORS[meeting.status] || 'badge-primary'} flex-shrink-0`}>{meeting.status}</span>
                </div>

                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Schedule style={{ fontSize: 13 }} />
                    {formatDate(meeting.date)} · {formatTime(meeting.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <LocationOn style={{ fontSize: 13 }} />
                    {meeting.location}
                  </span>
                  <span>{meeting.duration} min</span>
                </div>

                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {meeting.link && (
                    <a
                      href={meeting.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                    >
                      <VideoCall style={{ fontSize: 13 }} /> Join
                    </a>
                  )}
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                    <Edit style={{ fontSize: 13 }} /> Reschedule
                  </button>
                  <button
                    onClick={() => dispatch(cancelMeeting(meeting.id))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Cancel style={{ fontSize: 13 }} /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </SectionCard>
  )
}
