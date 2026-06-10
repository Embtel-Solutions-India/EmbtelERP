import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { FaUserCheck, FaUserTimes, FaUmbrellaBeach, FaClock, FaLock } from 'react-icons/fa'
import PageHeader from '../../../components/common/PageHeader'
import SectionCard from '../../../components/common/SectionCard'
import StatCard from '../../../components/common/StatCard'
import { fetchHRData } from '../redux/hrSlice'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const STATUS_CYCLE = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'On Leave', 'Absent', 'Late', 'Present']

const STATUS_STYLES = {
  Present:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Absent:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'On Leave':'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Late:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

function buildWeeklyTrend(total) {
  return DAYS.map((day, i) => {
    const base = Math.round(total * 0.88)
    const variance = (i % 3) - 1
    const present = Math.max(0, base + variance)
    return {
      day,
      present,
      absent: Math.max(0, Math.round(total * 0.05) + (i === 3 ? 1 : 0)),
      onLeave: Math.max(0, Math.round(total * 0.05) - (i % 2 === 0 ? 1 : 0)),
    }
  })
}

export default function HRAttendance() {
  const dispatch = useDispatch()
  const { employees, totalHeadcount, loading } = useSelector(s => s.hr)
  const { current: activePerspective } = useSelector(s => s.perspective)
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    dispatch(fetchHRData())
  }, [dispatch, activePerspective])

  const roleLevel = Number(user?.employeeLevel ?? user?.roleLevel ?? 1)

  const todayStats = useMemo(() => {
    const total = totalHeadcount || 1
    return {
      present:  Math.round(total * 0.88),
      absent:   Math.round(total * 0.05),
      onLeave:  Math.round(total * 0.05),
      late:     Math.round(total * 0.02),
    }
  }, [totalHeadcount])

  const weeklyTrend = useMemo(() => buildWeeklyTrend(totalHeadcount || 20), [totalHeadcount])

  const employeeRows = useMemo(
    () => employees.slice(0, 20).map((emp, i) => ({
      ...emp,
      status: STATUS_CYCLE[i % STATUS_CYCLE.length],
    })),
    [employees]
  )

  const stats = [
    { title: 'Present Today',  value: todayStats.present,  icon: <FaUserCheck size={18} />,    color: '#10b981', change: 0, changeLabel: 'estimated' },
    { title: 'Absent Today',   value: todayStats.absent,   icon: <FaUserTimes size={18} />,    color: '#ef4444', change: 0, changeLabel: 'estimated' },
    { title: 'On Leave',       value: todayStats.onLeave,  icon: <FaUmbrellaBeach size={18} />,color: '#f59e0b', change: 0, changeLabel: 'approved'  },
    { title: 'Late Arrivals',  value: todayStats.late,     icon: <FaClock size={18} />,         color: '#8b5cf6', change: 0, changeLabel: 'flagged'   },
  ]

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Attendance Overview"
        subtitle="Daily presence tracking and weekly attendance trends"
        breadcrumbs={['HR', 'Attendance']}
        actions={
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Estimates derived from employee headcount
          </div>
        }
      />

      {loading && (
        <div className="text-center py-2 text-sm text-neutral-400">Loading attendance data...</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.title} {...s} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Weekly Attendance Trend" subtitle="Present employees per day this week" delay={0.1}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present"  stroke="#10b981" strokeWidth={2.5} dot={false} name="Present"   />
                <Line type="monotone" dataKey="absent"   stroke="#ef4444" strokeWidth={2}   dot={false} name="Absent"    />
                <Line type="monotone" dataKey="onLeave"  stroke="#f59e0b" strokeWidth={2}   dot={false} name="On Leave"  />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Daily Breakdown" subtitle="Present vs absent per day of the week" delay={0.15}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present"  fill="#10b981" radius={[3, 3, 0, 0]} name="Present"  />
                <Bar dataKey="absent"   fill="#ef4444" radius={[3, 3, 0, 0]} name="Absent"   />
                <Bar dataKey="onLeave"  fill="#f59e0b" radius={[3, 3, 0, 0]} name="On Leave" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Employee Status" subtitle="Attendance status for employees in current scope" delay={0.2}>
        {employeeRows.length === 0 ? (
          <p className="text-sm text-neutral-400 italic py-4 text-center">No employees found in scope.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                  <th className="pb-3 font-semibold pr-4">Employee</th>
                  <th className="pb-3 font-semibold pr-4">Designation</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {employeeRows.map((emp, i) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs flex-shrink-0">
                          {(emp.name || emp.email || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-neutral-800 dark:text-neutral-100 truncate max-w-[140px]">
                          {emp.name || emp.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-neutral-500 dark:text-neutral-400 capitalize">
                      {emp.designation || '—'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[emp.status]}`}>
                        {emp.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Cross-org attendance — locked for non-HR Heads */}
      {roleLevel < 3 && (
        <div className="relative">
          <SectionCard
            title="Cross-Business Attendance Analytics"
            subtitle="Attendance rates and leave patterns across all departments"
          >
            <div style={{ height: 180 }} className="opacity-25 select-none blur-sm flex items-end justify-between p-4 gap-2">
              {[70, 85, 92, 78, 88, 75, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-emerald-200 dark:bg-emerald-800 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </SectionCard>
          <div className="absolute inset-0 bg-white/75 dark:bg-neutral-900/80 backdrop-blur-[4px] rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-700">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
              <FaLock className="text-amber-500" size={20} />
            </div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
              Cross-Business Analytics Restricted
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
              Attendance aggregates across departments are visible to HR Heads and Business Owners only.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
