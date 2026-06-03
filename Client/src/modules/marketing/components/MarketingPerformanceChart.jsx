import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../../utils'
import SectionCard from '../../../components/common/SectionCard'

const PERIODS    = ['Weekly', 'Monthly', 'Quarterly']
const CHART_TABS = ['Campaign ROI', 'Leads Generated', 'Traffic & Clicks']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-100 dark:border-gray-700 p-3">
      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {p.name.includes('Revenue') || p.name.includes('Target') ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MarketingPerformanceChart() {
  const { monthlyRevenue, weeklyData } = useSelector((s) => s.marketingDashboard)
  const [chartTab, setChartTab] = useState('Campaign ROI')
  const [period, setPeriod]     = useState('Monthly')

  const data      = period === 'Weekly' ? weeklyData : monthlyRevenue
  const isDark    = document.documentElement.classList.contains('dark')
  const axisColor = isDark ? '#6b7280' : '#94a3b8'
  const gridColor = isDark ? '#1f2937' : '#f1f5f9'

  return (
    <SectionCard
      title="Performance Analytics"
      subtitle="Campaign ROI, leads & engagement trends"
      delay={0.2}
      actions={
        <div className="flex gap-1 bg-slate-100 dark:bg-gray-700 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex gap-2 mb-4">
        {CHART_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setChartTab(t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              chartTab === t
                ? 'bg-primary-600 text-white shadow-brand'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <motion.div
        key={`${chartTab}-${period}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ height: 260 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartTab === 'Campaign ROI' ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="tgtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey={period === 'Weekly' ? 'day' : 'month'} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={false} name="Campaign Revenue" />
              <Area type="monotone" dataKey="target"  stroke="#10b981" strokeWidth={2}   fill="url(#tgtGrad)" strokeDasharray="5 5" dot={false} name="Revenue Target" />
            </AreaChart>
          ) : chartTab === 'Leads Generated' ? (
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barSize={16} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey={period === 'Weekly' ? 'day' : 'month'} tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="leads" fill="#6366f1" radius={[4, 4, 0, 0]} name="Leads Generated" />
              <Bar dataKey="won"   fill="#10b981" radius={[4, 4, 0, 0]} name="Converted Clients" />
            </BarChart>
          ) : (
            <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barSize={12} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="clicks" fill="#6366f1" radius={[3, 3, 0, 0]} name="Ad Clicks" />
              <Bar dataKey="emails" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Emails Sent" />
              <Bar dataKey="visits" fill="#10b981" radius={[3, 3, 0, 0]} name="Website Visits" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </motion.div>
    </SectionCard>
  )
}
