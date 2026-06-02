import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { motion } from 'framer-motion'
import { FaTrophy, FaDollarSign, FaClock, FaUsers, FaEnvelope, FaBolt, FaLock } from 'react-icons/fa'
import PageHeader from '../../../components/common/PageHeader'
import SectionCard from '../../../components/common/SectionCard'
import { formatCurrency } from '../../../utils'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const conversionRatioData = [
  { name: 'PPC Leads', value: 45 }, 
  { name: 'SEO Organic', value: 62 }, 
  { name: 'Email Signups', value: 38 },
  { name: 'Social Clicks', value: 28 },
]

const KPIS = [
  { label: 'Avg ROI',             value: '3.2x',     change: '+0.4x',  Icon: FaTrophy,      color: 'text-indigo-600' },
  { label: 'Avg Cost Per Lead',   value: '$15.50',   change: '-$1.20', Icon: FaDollarSign,  color: 'text-primary-600' },
  { label: 'Web Traffic Growth',  value: '+9.4%',    change: '45k monthly',Icon: FaClock,   color: 'text-cyan-600'    },
  { label: 'Conversion Rate',     value: '12.4%',    change: '+1.5%',  Icon: FaUsers,       color: 'text-purple-600'  },
  { label: 'Email Open Rate',     value: '24.5%',    change: '+2.1%',  Icon: FaEnvelope,    color: 'text-amber-600'   },
  { label: 'Daily Leads Logged',  value: '7.8',      change: '+1.2',   Icon: FaBolt,        color: 'text-rose-600'    },
]

export default function MarketingPerformance() {
  const { monthlyRevenue, weeklyData } = useSelector((s) => s.marketingDashboard)
  const [showPickerAlert, setShowPickerAlert] = useState(false)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader 
        title="Marketing Performance" 
        subtitle="Individual campaign metrics & execution analytics" 
        breadcrumbs={['Dashboard', 'Performance']} 
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowPickerAlert(true)}
              className="btn-secondary text-xs flex items-center gap-1.5 border border-slate-200"
            >
              <FaLock size={10} className="text-amber-500" /> Select Team Member
            </button>
          </div>
        }
      />

      {showPickerAlert && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 text-amber-800 dark:text-amber-300 p-4 rounded-xl flex items-start gap-3 relative">
          <FaLock className="mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Team Picker Access Blocked</p>
            <p className="mt-0.5">Team metrics aggregation is restricted to Department Owner or Business Administrator roles. Marketing Executive is limited to personal campaign outputs.</p>
          </div>
          <button onClick={() => setShowPickerAlert(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPIS.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="card p-4 text-center">
            <div className={`flex justify-center mb-2 ${k.color}`}><k.Icon size={22} /></div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{k.label}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{k.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Allocated Budget vs Revenue" subtitle="Monthly campaign spend compared to generated revenue" delay={0.1}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#m1)" dot={false} name="Revenue Generated" />
                <Area type="monotone" dataKey="target"  stroke="#10b981" strokeWidth={2} fill="none" strokeDasharray="5 5" dot={false} name="Budget Target" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Weekly Activities - showing clicks and visits */}
        <SectionCard title="Weekly Channel Engagement" subtitle="Clicks, page visits, and email dispatches breakdown" delay={0.15}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={14} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicks"   fill="#6366f1" radius={[3, 3, 0, 0]} name="Link Clicks" />
                <Bar dataKey="visits"   fill="#06b6d4" radius={[3, 3, 0, 0]} name="Page Visits" />
                <Bar dataKey="leads"    fill="#10b981" radius={[3, 3, 0, 0]} name="Leads Captured" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Leads by Acquisition Channel" subtitle="Source breakdown of closed won conversions" delay={0.2}>
          <div style={{ height: 280 }} className="flex items-center gap-6">
            <ResponsiveContainer width={200} height="100%">
              <PieChart>
                <Pie data={conversionRatioData} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={3}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {conversionRatioData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {conversionRatioData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{d.name}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Locked Team Performance Card */}
        <div className="relative">
          <SectionCard title="Team Performance Metrics" subtitle="Multi-member budget efficiency and CPL tracking" delay={0.25}>
            <div style={{ height: 280 }} className="flex flex-col items-center justify-center text-center opacity-30 select-none blur-[2px]">
              {/* Dummy chart contents under the blur */}
              <div className="w-full h-40 bg-slate-100 dark:bg-gray-800 rounded-lg flex items-end justify-between p-4 mb-4">
                {[40, 70, 50, 90, 30].map((h, i) => (
                  <div key={i} className="w-12 bg-indigo-200 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="text-sm font-semibold">Department aggregates comparison chart</p>
            </div>
          </SectionCard>
          
          {/* Restricted overlay */}
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/80 backdrop-blur-[4px] rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
              <FaLock className="text-amber-500" size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Department Metrics Restricted</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Team efficiency comparisons are restricted to Department Owners. Individual performance is displayed in the other sections.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
