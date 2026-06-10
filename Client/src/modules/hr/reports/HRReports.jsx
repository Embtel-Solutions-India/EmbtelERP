import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { FaFileDownload, FaLock, FaUsers, FaUserPlus, FaUserMinus, FaBuilding } from 'react-icons/fa'
import PageHeader from '../../../components/common/PageHeader'
import SectionCard from '../../../components/common/SectionCard'
import StatCard from '../../../components/common/StatCard'
import { fetchHRData } from '../redux/hrSlice'

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

export default function HRReports() {
  const dispatch = useDispatch()
  const {
    totalHeadcount,
    activeCount,
    inactiveCount,
    recentHiresCount,
    headcountByDesignation,
    headcountByLevel,
    loading,
  } = useSelector(s => s.hr)
  const { current: activePerspective } = useSelector(s => s.perspective)
  const { user } = useSelector(s => s.auth)

  useEffect(() => {
    dispatch(fetchHRData())
  }, [dispatch, activePerspective])

  const roleLevel = Number(user?.employeeLevel ?? user?.roleLevel ?? 1)

  const activeRatio = totalHeadcount > 0
    ? Math.round((activeCount / totalHeadcount) * 100)
    : 0

  const stats = [
    { title: 'Total Headcount',  value: totalHeadcount,    icon: <FaUsers size={18} />,      color: '#6366f1', change: 0, changeLabel: 'in scope'          },
    { title: 'Active Employees', value: activeCount,       icon: <FaBuilding size={18} />,   color: '#10b981', change: 0, changeLabel: `${activeRatio}% active` },
    { title: 'New Hires (30d)',  value: recentHiresCount,  icon: <FaUserPlus size={18} />,   color: '#06b6d4', change: 0, changeLabel: 'last 30 days'       },
    { title: 'Deactivated',      value: inactiveCount,     icon: <FaUserMinus size={18} />,  color: '#ef4444', change: 0, changeLabel: 'inactive records'   },
  ]

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="HR Reports"
        subtitle="Headcount analytics, role composition, and workforce trends"
        breadcrumbs={['HR', 'Reports']}
        actions={
          <button className="btn-primary text-sm flex items-center gap-1.5">
            <FaFileDownload size={13} /> Export Headcount Report
          </button>
        }
      />

      {loading && (
        <div className="text-center py-2 text-sm text-neutral-400">Loading HR data...</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.title} {...s} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Headcount by Role/Designation */}
        <SectionCard title="Headcount by Designation" subtitle="Employee count broken down by job designation" delay={0.1}>
          {headcountByDesignation.length === 0 ? (
            <p className="text-sm text-neutral-400 italic py-4 text-center">
              No data available in current scope.
            </p>
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={headcountByDesignation} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip formatter={v => [`${v} employees`, 'Headcount']} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} name="Headcount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* Headcount by Level — Pie */}
        <SectionCard title="Role Level Distribution" subtitle="Workforce composition by organisational level" delay={0.15}>
          <div style={{ height: 280 }} className="flex items-center gap-6">
            <ResponsiveContainer width={200} height="100%">
              <PieChart>
                <Pie
                  data={headcountByLevel.filter(l => l.count > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="count"
                  nameKey="level"
                  paddingAngle={3}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {headcountByLevel.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [`${v} employees`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {headcountByLevel.filter(l => l.count > 0).map((l, i) => (
                <div key={l.level} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">{l.level}</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-100">{l.count}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Cross-org financial report — locked for non-Heads */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {roleLevel < 3 ? (
          <div className="relative">
            <SectionCard title="Department Budget vs Headcount" subtitle="Cost-per-employee ratios across business units">
              <div style={{ height: 240 }} className="opacity-25 select-none blur-sm flex items-end justify-between p-4 gap-4">
                {[60, 40, 75, 55, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-300 dark:bg-blue-800 rounded-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </SectionCard>
            <div className="absolute inset-0 bg-white/75 dark:bg-neutral-900/80 backdrop-blur-[4px] rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-700">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
                <FaLock className="text-amber-500" size={18} />
              </div>
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">Department Report Restricted</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
                Cross-department cost analytics require HR Head or Business Owner credentials.
              </p>
            </div>
          </div>
        ) : (
          <SectionCard title="Department Budget vs Headcount" subtitle="Cost-per-employee ratios across business units" delay={0.2}>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={headcountByDesignation.slice(0, 5)} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Headcount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        )}

        {roleLevel < 4 ? (
          <div className="relative">
            <SectionCard title="Business Owner P&L vs Workforce Cost" subtitle="Annual net return on workforce investment">
              <div style={{ height: 240 }} className="opacity-25 select-none blur-sm flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-8 border-indigo-200 border-t-indigo-500" />
              </div>
            </SectionCard>
            <div className="absolute inset-0 bg-white/75 dark:bg-neutral-900/80 backdrop-blur-[4px] rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-700">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
                <FaLock className="text-amber-500" size={18} />
              </div>
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">Owner Report Restricted</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
                Workforce cost vs. business return analysis requires Business Owner or Administrator credentials.
              </p>
            </div>
          </div>
        ) : (
          <SectionCard title="Business Owner P&L vs Workforce Cost" subtitle="Annual net return on workforce investment" delay={0.25}>
            <div className="flex items-center justify-center" style={{ height: 240 }}>
              <div className="text-center text-neutral-400 dark:text-neutral-500">
                <FaBuilding size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Connect payroll data source to enable this view.</p>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
