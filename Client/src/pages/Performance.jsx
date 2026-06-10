import { useSelector } from 'react-redux'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { FaTrophy, FaDollarSign, FaClock, FaPhone, FaEnvelope, FaBolt } from 'react-icons/fa'
import PageHeader from '../components/common/PageHeader'
import SectionCard from '../components/common/SectionCard'
import { formatCurrency } from '../utils'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const winRatioData = [
  { name: 'Won', value: 42 }, { name: 'Lost', value: 11 }, { name: 'In Progress', value: 95 },
]

const KPIS = [
  { label: 'Win Rate',           value: '79.2%',   change: '+5.2%',  Icon: FaTrophy,      color: 'text-emerald-600' },
  { label: 'Avg Deal Size',      value: '$42.5K',  change: '+12.1%', Icon: FaDollarSign,  color: 'text-primary-600' },
  { label: 'Sales Cycle',        value: '18 days', change: '-3 days',Icon: FaClock,       color: 'text-cyan-600'    },
  { label: 'Calls per Lead',     value: '3.4',     change: '-0.2',   Icon: FaPhone,       color: 'text-purple-600'  },
  { label: 'Email Open Rate',    value: '64.8%',   change: '+8.3%',  Icon: FaEnvelope,    color: 'text-amber-600'   },
  { label: 'Lead Response Time', value: '2.1h',    change: '-0.5h',  Icon: FaBolt,        color: 'text-rose-600'    },
]

export default function Performance() {
  const { monthlyRevenue, weeklyData } = useSelector((s) => s.dashboard)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Performance" subtitle="Your sales performance analytics" breadcrumbs={['Dashboard', 'Performance']} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPIS.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="card p-4 text-center">
            <div className={`flex justify-center mb-2 ${k.color}`}><k.Icon size={22} /></div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{k.label}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{k.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Revenue vs Target" subtitle="Monthly performance comparison" delay={0.1}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#r1)" dot={false} />
                <Area type="monotone" dataKey="target"  stroke="#10b981" strokeWidth={2} fill="none" strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Weekly Activity" subtitle="Calls, emails and meetings breakdown" delay={0.15}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={14} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls"    fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="emails"   fill="#06b6d4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="meetings" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Deal Win Ratio" subtitle="Won vs Lost vs In Progress" delay={0.2}>
          <div style={{ height: 280 }} className="flex items-center gap-6">
            <ResponsiveContainer width={200} height="100%">
              <PieChart>
                <Pie data={winRatioData} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={3}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
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

        <SectionCard title="Lead Acquisition Trend" subtitle="Monthly new leads" delay={0.25}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="won"   stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
