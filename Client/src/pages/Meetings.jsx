import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Add, VideoCall, LocationOn, Schedule, Cancel, Edit } from '@mui/icons-material'
import {
  FaDesktop, FaSearch, FaClipboardList, FaHandshake,
  FaFileSignature, FaRocket, FaPhoneAlt, FaCalendarAlt, FaCheckCircle,
} from 'react-icons/fa'
import { cancelMeeting } from '../redux/slices/meetingSlice'
import PageHeader from '../components/common/PageHeader'
import { formatDate, formatTime, getInitials } from '../utils'

const STATUS_COLORS = {
  Scheduled: 'badge-info', Ongoing: 'badge-warning', Completed: 'badge-success', Cancelled: 'badge-error',
}
const TYPE_MAP = {
  'Product Demo':    { Icon: FaDesktop,        color: 'text-indigo-500'  },
  'Discovery Call':  { Icon: FaSearch,         color: 'text-cyan-500'    },
  'Proposal Review': { Icon: FaClipboardList,  color: 'text-amber-500'   },
  'Negotiation':     { Icon: FaHandshake,      color: 'text-emerald-500' },
  'Contract Signing':{ Icon: FaFileSignature,  color: 'text-purple-500'  },
  'Onboarding':      { Icon: FaRocket,         color: 'text-rose-500'    },
  'Check-in Call':   { Icon: FaPhoneAlt,       color: 'text-teal-500'    },
}
const DEFAULT_TYPE = { Icon: FaCalendarAlt, color: 'text-primary-500' }

export default function Meetings() {
  const dispatch = useDispatch()
  const { list: meetings } = useSelector((s) => s.meetings)

  const upcoming = meetings.filter(m => m.status === 'Scheduled')
  const completed = meetings.filter(m => m.status === 'Completed')

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Meetings"
        subtitle={`${upcoming.length} upcoming · ${completed.length} completed`}
        breadcrumbs={['Dashboard', 'Meetings']}
        actions={
          <button className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Schedule Meeting
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Upcoming', value: upcoming.length, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', Icon: FaCalendarAlt },
          { label: 'Completed', value: completed.length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', Icon: FaCheckCircle },
          { label: 'This Week', value: meetings.filter(m => {
            const d = new Date(m.date); const now = new Date()
            return d >= now && d <= new Date(now.getTime() + 7*86400000)
          }).length, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', Icon: FaCalendarAlt },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {meetings.map((meeting, i) => (
          <motion.div
            key={meeting.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {getInitials(meeting.client)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{meeting.client}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{meeting.company}</p>
                </div>
              </div>
              <span className={STATUS_COLORS[meeting.status] || 'badge-primary'}>{meeting.status}</span>
            </div>

            <div className="flex items-center gap-2 mb-1">
              {(() => { const t = TYPE_MAP[meeting.type] || DEFAULT_TYPE; return <t.Icon className={t.color} size={16} /> })()}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{meeting.type}</span>
            </div>

            <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Schedule fontSize="small" /> {formatDate(meeting.date)} · {formatTime(meeting.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <LocationOn fontSize="small" /> {meeting.location}
              </span>
              <span>{meeting.duration} minutes</span>
            </div>

            {meeting.status === 'Scheduled' && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-gray-700">
                {meeting.link && (
                  <a href={meeting.link} target="_blank" rel="noopener noreferrer"
                    className="btn-primary flex items-center gap-1.5 text-sm">
                    <VideoCall fontSize="small" /> Join Meeting
                  </a>
                )}
                <button className="btn-secondary flex items-center gap-1.5 text-sm">
                  <Edit fontSize="small" /> Reschedule
                </button>
                <button
                  onClick={() => dispatch(cancelMeeting(meeting.id))}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold"
                >
                  <Cancel fontSize="small" /> Cancel
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
