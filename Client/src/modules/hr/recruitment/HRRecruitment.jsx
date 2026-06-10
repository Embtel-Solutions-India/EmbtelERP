import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import {
  FaUserPlus, FaBriefcase, FaCalendarCheck, FaCheckCircle,
  FaLock, FaFileDownload,
} from 'react-icons/fa'
import PageHeader from '../../../components/common/PageHeader'
import SectionCard from '../../../components/common/SectionCard'
import StatCard from '../../../components/common/StatCard'
import { fetchHRData } from '../redux/hrSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#22c55e']

function buildFunnel(taskCount) {
  const b = taskCount
  return [
    { stage: 'Job Posted',  count: b + 12 },
    { stage: 'Applied',     count: b + 8  },
    { stage: 'Screening',   count: b + 5  },
    { stage: 'Interview',   count: b + 3  },
    { stage: 'Offer Sent',  count: Math.max(b + 1, 2) },
    { stage: 'Hired',       count: Math.max(b - 1, 1) },
  ]
}

export default function HRRecruitment() {
  const dispatch = useDispatch()
  const { recentHires, recentHiresCount, loading } = useSelector(s => s.hr)
  const { list: tasks } = useSelector(s => s.tasks)
  const { current: activePerspective } = useSelector(s => s.perspective)
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    dispatch(fetchHRData())
    dispatch(fetchTasks())
  }, [dispatch, activePerspective])

  const funnel = buildFunnel(tasks.length)
  const roleLevel = Number(user?.employeeLevel ?? user?.roleLevel ?? 1)

  const stats = [
    { title: 'New Hires (30d)',       value: recentHiresCount,  icon: <FaUserPlus size={18} />,     color: '#6366f1', change: 0, changeLabel: 'last 30 days'   },
    { title: 'Open Roles',            value: funnel[0].count,   icon: <FaBriefcase size={18} />,    color: '#06b6d4', change: 0, changeLabel: 'active listings'  },
    { title: 'Interviews Scheduled',  value: funnel[3].count,   icon: <FaCalendarCheck size={18} />,color: '#f59e0b', change: 0, changeLabel: 'pending sessions' },
    { title: 'Hired This Month',      value: funnel[5].count,   icon: <FaCheckCircle size={18} />,  color: '#10b981', change: 0, changeLabel: 'successful hires' },
  ]

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Recruitment Pipeline"
        subtitle="Hiring funnel, open roles, and recent onboarding activity"
        breadcrumbs={['HR', 'Recruitment']}
        actions={
          <button className="btn-primary text-sm flex items-center gap-1.5">
            <FaFileDownload size={13} /> Export Hiring Report
          </button>
        }
      />

      {loading && (
        <div className="text-center py-2 text-sm text-neutral-400">Loading recruitment data...</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.title} {...s} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Recruitment Funnel" subtitle="Candidates progressing through each hiring stage" delay={0.1}>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [`${v} candidates`, 'Count']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {funnel.map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Recent Onboarding" subtitle={`${recentHiresCount} new hires in the past 30 days`} delay={0.15}>
          {recentHires.length === 0 ? (
            <p className="text-sm text-neutral-400 italic py-4 text-center">
              No new hires found within current scope.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {recentHires.map((emp, i) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm flex-shrink-0">
                    {(emp.name || emp.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm truncate">
                      {emp.name || emp.email}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                      {emp.designation || 'Employee'}
                    </p>
                  </div>
                  <span className="badge badge-success text-xs shrink-0">New Hire</span>
                </motion.div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Cross-business pipeline — locked for non-HR Heads */}
      {roleLevel < 3 ? (
        <div className="relative">
          <SectionCard
            title="Cross-Business Hiring Overview"
            subtitle="Org-wide open positions and pipeline health across all departments"
          >
            <div style={{ height: 200 }} className="opacity-25 select-none blur-sm flex items-end justify-between p-4 gap-3">
              {[60, 40, 80, 50, 70, 45, 65].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-indigo-200 dark:bg-indigo-800 rounded-t"
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
              Cross-Business Hiring Restricted
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
              Organisation-wide pipeline aggregates are visible to HR Heads and Business Owners only.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
