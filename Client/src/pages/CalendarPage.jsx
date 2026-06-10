import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchCalendarEvents } from '../redux/slices/calendarSlice'
import { motion } from 'framer-motion'
import CalendarWidget from '../components/dashboard/CalendarWidget'

export default function CalendarPage() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchCalendarEvents({}))
  }, [dispatch])

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Calendar</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Manage your schedule, meetings and events
        </p>
      </motion.div>

      <CalendarWidget />
    </div>
  )
}
