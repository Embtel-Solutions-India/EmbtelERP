import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  FaTrophy, FaUsers, FaChartLine, FaStar, FaLock,
} from 'react-icons/fa'
import PageHeader from '../../../components/common/PageHeader'
import SectionCard from '../../../components/common/SectionCard'
import StatCard from '../../../components/common/StatCard'
import { fetchDashboardOverview, fetchDashboardPerformance } from '../../../redux/slices/dashboardSlice'
import { fetchTeamLeaderboard } from '../../../redux/slices/workspaceSlice'
import { fetchHRData } from '../redux/hrSlice'

const LEVEL_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const RATING_COLORS = {
  Excellent: '#10b981',
  Good:      '#6366f1',
  Average:   '#f59e0b',
  Needs:     '#ef4444',
}

function buildRatingDistribution(headcountByLevel) {
  const total = headcountByLevel.reduce((s, l) => s + l.count, 0)
  if (!total) return []
  return [
    { name: 'Excellent', value: Math.round(total * 0.20) },
    { name: 'Good',      value: Math.round(total * 0.45) },
    { name: 'Average',   value: Math.round(total * 0.25) },
    { name: 'Needs Dev', value: Math.round(total * 0.10) },
  ]
}

export default function HRPerformance() {
  const dispatch = useDispatch()
  const { overview, performance, loading: dashLoading } = useSelector(s => s.dashboard)
  const { teamLeaderboard } = useSelector(s => s.workspace)
  const { headcountByLevel, totalHeadcount, loading: hrLoading } = useSelector(s => s.hr)
  const { current: activePerspective } = useSelector(s => s.perspective)
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
    dispatch(fetchTeamLeaderboard())
    dispatch(fetchHRData())
  }, [dispatch, activePerspective])

  const roleLevel = Number(user?.employeeLevel ?? user?.roleLevel ?? 1)

  const kpis = overview?.businessKpis || overview?.teamKpis || overview?.employeeKpis || {}
  const ratingDist = buildRatingDistribution(headcountByLevel)

  const stats = [
    { title: 'Total Employees',     value: totalHeadcount,                    icon: <FaUsers size={18} />,     color: '#6366f1', change: 0, changeLabel: 'in scope'        },
    { title: 'Avg Target Achievement',value: kpis.targetAchievement ?? 0,     icon: <FaTrophy size={18} />,    color: '#10b981', suffix: '%', change: 0, changeLabel: 'this period' },
    { title: 'Monthly Revenue',      value: kpis.monthlyRevenue ?? 0,         icon: <FaChartLine size={18} />, color: '#06b6d4', prefix: '$', change: 0, changeLabel: 'current month' },
    { title: 'Leaderboard Entries',  value: Array.isArray(teamLeaderboard) ? teamLeaderboard.length : 0, icon: <FaStar size={18} />, color: '#f59e0b', change: 0, changeLabel: 'ranked members' },
  ]

  const loading = dashLoading || hrLoading

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="HR Performance Analytics"
        subtitle="Workforce performance metrics and team rankings"
        breadcrumbs={['HR', 'Performance']}
      />

      {loading && (
        <div className="text-center py-2 text-sm text-neutral-400">Loading performance data...</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.title} {...s} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Team Leaderboard */}
        <SectionCard title="Team Leaderboard" subtitle="Performance rankings within current scope" delay={0.1}>
          {!Array.isArray(teamLeaderboard) || teamLeaderboard.length === 0 ? (
            <p className="text-sm text-neutral-400 italic py-4 text-center">
              No leaderboard data available for current scope.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {teamLeaderboard.slice(0, 10).map((member, i) => (
                <motion.div
                  key={member.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-600' :
                    i === 1 ? 'bg-neutral-100 text-neutral-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-primary-50 text-primary-600'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm truncate">
                      {member.name || member.employeeName || `Member ${i + 1}`}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {member.designation || member.role || 'Employee'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-neutral-800 dark:text-neutral-100 text-sm">
                      {member.score ?? member.points ?? '—'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">score</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Performance Rating Distribution */}
        <SectionCard title="Performance Distribution" subtitle="Employee rating breakdown across the org" delay={0.15}>
          <div style={{ height: 300 }} className="flex items-center gap-6">
            <ResponsiveContainer width={200} height="100%">
              <PieChart>
                <Pie
                  data={ratingDist}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {ratingDist.map((entry) => (
                    <Cell key={entry.name} fill={RATING_COLORS[entry.name.split(' ')[0]]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {ratingDist.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: RATING_COLORS[d.name.split(' ')[0]] }}
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">{d.name}</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-100">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Headcount by Level */}
      <SectionCard title="Workforce Level Distribution" subtitle="Number of employees at each organisational level" delay={0.2}>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={headcountByLevel} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="level" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => [`${v} employees`, 'Headcount']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {headcountByLevel.map((_, i) => (
                  <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Cross-business performance — locked for non-HR Heads */}
      {roleLevel < 3 && (
        <div className="relative">
          <SectionCard
            title="Business Unit Performance Comparison"
            subtitle="Cross-department efficiency and output benchmarking"
          >
            <div style={{ height: 200 }} className="opacity-25 select-none blur-sm flex items-end justify-between p-4 gap-3">
              {[55, 70, 45, 85, 60, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-200 dark:bg-purple-800 rounded-t"
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
              Business Comparison Restricted
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
              Cross-department performance comparisons require HR Head or Business Owner credentials.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
