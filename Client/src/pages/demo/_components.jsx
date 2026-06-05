import { motion } from 'framer-motion'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import StatCard from '../../components/common/StatCard'
import SectionCard from '../../components/common/SectionCard'

// ─── Demo Banner ─────────────────────────────────────────────────────────────
export function DemoBanner({ role }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative rounded-2xl bg-gradient-to-r ${role.bannerClass} p-6 mb-6 text-white shadow-xl overflow-hidden`}
    >
      {/* Background decorative circles */}
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase rounded-full bg-white/20 border border-white/30">
              DEMO
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-white/15">
              Level {role.level}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{role.label} Dashboard</h1>
          <p className="text-white/75 text-sm mt-0.5">{role.designation} · {role.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-0.5">Scope</p>
          <p className="text-sm text-white/85 font-medium leading-snug max-w-xs text-right">{role.scope}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── KPI Grid ─────────────────────────────────────────────────────────────────
export function DemoKPIGrid({ kpis }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi, i) => (
        <StatCard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          icon={kpi.icon}
          color={kpi.color}
          sparkData={kpi.sparkData}
          delay={i * 0.06}
          formatValue={kpi.formatValue !== false}
        />
      ))}
    </div>
  )
}

// ─── Performance Chart ────────────────────────────────────────────────────────
export function DemoChart({ config }) {
  const { title, color, data } = config
  return (
    <SectionCard title={title} delay={0.2}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.55 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.55 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12 }}
            cursor={{ fill: 'currentColor', opacity: 0.05 }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="completed" name="Completed" fill={color} radius={[4,4,0,0]} maxBarSize={32} />
          <Bar dataKey="target"    name="Target"    fill={color} fillOpacity={0.25} radius={[4,4,0,0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>
  )
}

// ─── Task Table ───────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  'Done':        'badge-success',
  'In Progress': 'badge-info',
  'Pending':     'badge-warning',
}
const PRIORITY_STYLE = {
  'High':   'badge-error',
  'Medium': 'badge-warning',
  'Low':    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export function DemoTaskTable({ tasks }) {
  return (
    <SectionCard title="Tasks" delay={0.25}>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <th className="pb-2 pr-3 text-left font-semibold">Task</th>
              <th className="pb-2 pr-3 text-left font-semibold">Priority</th>
              <th className="pb-2 pr-3 text-left font-semibold">Status</th>
              <th className="pb-2 pr-3 text-left font-semibold">Assignee</th>
              <th className="pb-2 text-left font-semibold">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((t, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{t.title}</td>
                <td className="py-2.5 pr-3">
                  <span className={`badge text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className={`badge text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                </td>
                <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.assignee}</td>
                <td className="py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

// ─── Team Metrics Table ───────────────────────────────────────────────────────
export function DemoTeamTable({ metrics, color }) {
  return (
    <SectionCard title="Team Metrics" delay={0.3}>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <th className="pb-2 pr-4 text-left font-semibold">Team / Member</th>
              <th className="pb-2 pr-4 text-left font-semibold">Members</th>
              <th className="pb-2 pr-4 text-left font-semibold">Performance</th>
              <th className="pb-2 pr-4 text-left font-semibold">Tasks</th>
              <th className="pb-2 pr-4 text-left font-semibold">Completion</th>
              <th className="pb-2 text-left font-semibold">Lead</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {metrics.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 pr-4 font-semibold text-slate-700 dark:text-slate-200">{row.team}</td>
                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{row.members}</td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 max-w-[80px]">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${row.performance}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{row.performance}%</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{row.tasks}</td>
                <td className="py-2.5 pr-4 font-semibold text-slate-600 dark:text-slate-300">{row.completion}</td>
                <td className="py-2.5 text-slate-500 dark:text-slate-400">{row.lead}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
