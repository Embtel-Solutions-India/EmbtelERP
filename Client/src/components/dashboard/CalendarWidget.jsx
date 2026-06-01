import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameDay, isSameMonth, isToday, addMonths, subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import SectionCard from '../common/SectionCard'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function CalendarWidget() {
  const [current, setCurrent] = useState(new Date())
  const { list: meetings } = useSelector((s) => s.meetings)
  const { list: tasks }    = useSelector((s) => s.tasks)

  const getEventsForDay = (day) => {
    const meets = meetings.filter((m) => isSameDay(new Date(m.date), day))
    const tasksDue = tasks.filter((t) => isSameDay(new Date(t.dueDate), day) && t.status !== 'done')
    return { meets, tasksDue }
  }

  const monthStart = startOfMonth(current)
  const monthEnd   = endOfMonth(current)
  const startDate  = startOfWeek(monthStart)
  const endDate    = endOfWeek(monthEnd)

  const rows = []
  let day = startDate
  while (day <= endDate) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(day)
      day = addDays(day, 1)
    }
    rows.push(week)
  }

  return (
    <SectionCard
      title="Calendar"
      subtitle="Schedule overview"
      delay={0.3}
      actions={
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="btn-ghost p-1">
            <ChevronLeft style={{ fontSize: 18 }} />
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 min-w-[100px] text-center">
            {format(current, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="btn-ghost p-1">
            <ChevronRight style={{ fontSize: 18 }} />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {rows.flat().map((day, idx) => {
          const { meets, tasksDue } = getEventsForDay(day)
          const hasEvents = meets.length > 0 || tasksDue.length > 0
          const sameMonth = isSameMonth(day, current)
          const today = isToday(day)

          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.1 }}
              className={`relative flex flex-col items-center py-1 rounded-lg cursor-pointer transition-colors ${
                !sameMonth ? 'opacity-30' : ''
              } ${today ? 'bg-primary-600' : 'hover:bg-slate-100 dark:hover:bg-gray-700/50'}`}
            >
              <span className={`text-xs font-semibold ${today ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                {format(day, 'd')}
              </span>

              {hasEvents && sameMonth && (
                <div className="flex gap-0.5 mt-0.5">
                  {meets.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${today ? 'bg-white/70' : 'bg-primary-500'}`} />
                  )}
                  {tasksDue.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${today ? 'bg-white/70' : 'bg-amber-500'}`} />
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="mt-3 flex gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-primary-500" /> Meetings
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Tasks
        </span>
      </div>
    </SectionCard>
  )
}
