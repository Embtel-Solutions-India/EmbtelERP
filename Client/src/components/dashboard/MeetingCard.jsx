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
  // Real meetings = personal/scoped calendar events of type MEETING (no dummy data).
  const events = useSelector((s) => s.calendar?.events) || []
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const upcoming = events
    .filter((e) => e.eventType === 'MEETING' && e.status !== 'CANCELLED' && new Date(e.date) >= startOfToday)
    .sort((a, b) => (new Date(a.date) - new Date(b.date)) || String(a.startTime || '').localeCompare(String(b.startTime || '')))
    .slice(0, 4)

  return (
    <SectionCard
      title="Upcoming Meetings"
      subtitle="Scheduled meetings from your calendar"
      delay={0.2}
      actions={<span className="badge badge-info">{upcoming.length} upcoming</span>}
      className="h-[420px] flex flex-col"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2">
        {upcoming.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 gap-1">
            <FaCalendarAlt size={24} className="text-neutral-300 dark:text-neutral-600" />
            <p className="text-sm">No upcoming meetings</p>
            <p className="text-xs">Add a calendar event of type “Meeting” to see it here.</p>
          </div>
        ) : upcoming.map((meeting, i) => (
          <motion.div
            key={meeting.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/40 border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {getInitials(meeting.title)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{meeting.title}</span>
                    <FaCalendarAlt className="text-primary-500" size={12} />
                  </div>
                  {meeting.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{meeting.description}</p>
                  )}
                </div>
                <span className="badge badge-info flex-shrink-0">Scheduled</span>
              </div>

              <div className="flex flex-wrap gap-3 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <Schedule style={{ fontSize: 13 }} />
                  {formatDate(meeting.date)}{meeting.startTime ? ` · ${meeting.startTime}` : ''}
                </span>
                {meeting.startTime && meeting.endTime && (
                  <span>{meeting.startTime} – {meeting.endTime}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  )
}
