import { useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { FaTrophy, FaDollarSign, FaUsers, FaHandshake, FaTasks, FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa'
import PageHeader from '../components/common/PageHeader'
import SectionCard from '../components/common/SectionCard'
import { fetchLeads } from '../redux/slices/leadSlice'
import { fetchSalesTasks } from '../redux/slices/salesTaskSlice'
import { fetchDashboardPerformance } from '../redux/slices/dashboardSlice'
import { formatCurrency } from '../utils'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#8b5cf6']
const monthKey = (d) => new Date(d).toISOString().slice(0, 7)
const leadRevenue = (l) => Number(l.paymentAmount ?? l.estimatedValue ?? 0) || 0
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0)

// Weekday buckets for the activity chart (Mon-first).
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TASK_CATEGORY = {
  CALL: 'calls',
  EMAIL_FOLLOWUP: 'emails', WHATSAPP_FOLLOWUP: 'emails',
  CONSULTATION_MEETING: 'meetings', CLIENT_MEETING: 'meetings',
}

export default function Performance() {
  const dispatch = useDispatch()
  const { list: leads, summary, loading, error } = useSelector((s) => s.leads)
  const { list: tasks, summary: taskSummary } = useSelector((s) => s.salesTasks)
  const perf = useSelector((s) => s.dashboard?.performance) || []
  const activePerspective = useSelector((s) => s.perspective?.current)

  // Load on mount + refetch on perspective change. Derived values below also
  // update instantly from Redux whenever a lead/task is mutated in-app.
  useEffect(() => {
    dispatch(fetchLeads())
    dispatch(fetchSalesTasks())
    dispatch(fetchDashboardPerformance())
  }, [dispatch, activePerspective])

  // ── Monthly trend (single pass over the real lead list) ───────────────────
  const monthlyTrend = useMemo(() => {
    const map = new Map()
    const get = (k) => map.get(k) ?? { key: k, leads: 0, converted: 0, revenue: 0 }
    for (const l of leads) {
      if (!l.createdAt) continue
      const k = monthKey(l.createdAt)
      const e = get(k)
      e.leads += 1
      const status = String(l.status).toUpperCase()
      if (status === 'CONVERTED' || status === 'TRANSFERRED') {
        e.converted += 1
        e.revenue += leadRevenue(l)
      }
      map.set(k, e)
    }
    // Merge backend performance targets where the month matches (if any exist).
    const targetByPeriod = new Map((perf || []).map((p) => [p.period, Number(p.target) || 0]))
    return [...map.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12)
      .map((e) => ({
        month: new Date(`${e.key}-01`).toLocaleString('en', { month: 'short' }),
        leads: e.leads,
        won: e.converted,
        revenue: Math.round(e.revenue),
        target: targetByPeriod.get(e.key) || 0,
      }))
  }, [leads, perf])

  const hasTarget = useMemo(() => monthlyTrend.some((m) => m.target > 0), [monthlyTrend])

  // ── Weekly activity from real sales tasks (by weekday + type) ─────────────
  const weeklyActivity = useMemo(() => {
    const base = WEEKDAYS.map((day) => ({ day, calls: 0, emails: 0, meetings: 0 }))
    for (const t of tasks) {
      const when = t.dueDate || t.createdAt
      if (!when) continue
      const jsDay = new Date(when).getDay() // 0=Sun
      const idx = (jsDay + 6) % 7 // shift to Mon-first
      const cat = TASK_CATEGORY[String(t.taskType).toUpperCase()]
      if (cat) base[idx][cat] += 1
    }
    return base
  }, [tasks])

  // ── Deal win ratio (real pipeline split) ──────────────────────────────────
  const winRatioData = useMemo(() => {
    const converted = summary.converted ?? 0
    const lost = summary.lost ?? 0
    const inProgress = Math.max(0, (summary.total ?? 0) - converted - lost)
    return [
      { name: 'Converted', value: converted },
      { name: 'Lost', value: lost },
      { name: 'In Progress', value: inProgress },
    ]
  }, [summary])

  // ── KPIs (all derived from real data) ──────────────────────────────────────
  const kpis = useMemo(() => {
    const converted = summary.converted ?? 0
    const lost = summary.lost ?? 0
    const total = summary.total ?? 0
    const winRate = pct(converted, converted + lost)
    const convertedLeads = leads.filter((l) => {
      const s = String(l.status).toUpperCase()
      return s === 'CONVERTED' || s === 'TRANSFERRED'
    })
    const avgDeal = convertedLeads.length
      ? convertedLeads.reduce((s, l) => s + leadRevenue(l), 0) / convertedLeads.length
      : 0
    const taskCompletion = pct(taskSummary?.completed ?? 0, taskSummary?.total ?? 0)

    // Month-over-month deltas from the real trend.
    const last = monthlyTrend[monthlyTrend.length - 1]
    const prev = monthlyTrend[monthlyTrend.length - 2]
    const delta = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : (a > 0 ? 100 : 0))

    return [
      { label: 'Total Leads', value: total, Icon: FaUsers, color: 'text-primary-600' },
      { label: 'Win Rate', value: `${winRate}%`, Icon: FaTrophy, color: 'text-emerald-600' },
      {
        label: 'Converted', value: converted, Icon: FaHandshake, color: 'text-emerald-600',
        change: last && prev ? delta(last.won, prev.won) : undefined,
      },
      { label: 'Avg Deal Size', value: formatCurrency(avgDeal), Icon: FaDollarSign, color: 'text-cyan-600' },
      {
        label: 'Monthly Revenue', value: formatCurrency(summary.monthlyRevenue ?? 0), Icon: FaChartLine, color: 'text-purple-600',
        change: last && prev ? delta(last.revenue, prev.revenue) : undefined,
      },
      { label: 'Task Completion', value: `${taskCompletion}%`, Icon: FaTasks, color: 'text-amber-600' },
    ]
  }, [summary, leads, taskSummary, monthlyTrend])

  const hasData = (summary.total ?? 0) > 0

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Performance" subtitle="Your sales performance analytics" breadcrumbs={['Dashboard', 'Performance']} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {(loading && !hasData ? Array.from({ length: 6 }) : kpis).map((k, i) =>
          k ? (
            <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card p-4 text-center">
              <div className={`flex justify-center mb-2 ${k.color}`}><k.Icon size={22} /></div>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{k.label}</p>
              {k.change !== undefined && (
                <p className={`text-xs font-semibold mt-1 flex items-center justify-center gap-1 ${
                  k.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {k.change >= 0 ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}{Math.abs(k.change)}% MoM
                </p>
              )}
            </motion.div>
          ) : (
            <div key={i} className="card p-4 h-[120px] animate-pulse bg-neutral-100 dark:bg-neutral-800" />
          ),
        )}
      </div>

      {error && !hasData ? (
        <div className="card p-10 text-center text-sm text-red-500">Failed to load performance data: {String(error)}</div>
      ) : !loading && !hasData ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No performance data yet</p>
          <p className="mt-1 text-xs text-neutral-400">Analytics appear once you have leads and tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SectionCard title="Revenue Trend" subtitle={hasTarget ? 'Monthly revenue vs target' : 'Monthly converted revenue'} delay={0.1}>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#r1)" dot={false} />
                  {hasTarget && (
                    <Area type="monotone" dataKey="target" name="Target" stroke="#10b981" strokeWidth={2} fill="none" strokeDasharray="5 5" dot={false} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Weekly Activity" subtitle="Tasks by type across the week" delay={0.15}>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity} barSize={14} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="emails" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="meetings" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Deal Win Ratio" subtitle="Converted vs Lost vs In Progress" delay={0.2}>
            <div style={{ height: 280 }} className="flex items-center gap-6">
              <ResponsiveContainer width={200} height="100%">
                <PieChart>
                  <Pie data={winRatioData} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={3}
                    label={({ percent }) => (percent > 0 ? `${(percent * 100).toFixed(0)}%` : '')}>
                    {winRatioData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {winRatioData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{d.name}</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-100 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Lead Acquisition Trend" subtitle="Monthly new leads vs converted" delay={0.25}>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" name="New Leads" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="won" name="Converted" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}
