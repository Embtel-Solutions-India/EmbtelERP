import { useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import PageHeader from '../components/common/PageHeader'
import SectionCard from '../components/common/SectionCard'
import { formatCurrency } from '../utils'

const sourceData = [
  { name: 'LinkedIn',   value: 35, color: '#0077b5' },
  { name: 'Website',    value: 25, color: '#6366f1' },
  { name: 'Referral',   value: 20, color: '#10b981' },
  { name: 'Cold Call',  value: 12, color: '#f59e0b' },
  { name: 'Events',     value: 8,  color: '#ec4899' },
]

const conversionData = [
  { stage: 'New',         rate: 100 },
  { stage: 'Contacted',   rate: 75.7 },
  { stage: 'Qualified',   rate: 60.7 },
  { stage: 'Proposal',    rate: 61.8 },
  { stage: 'Negotiation', rate: 57.1 },
  { stage: 'Won',         rate: 17.5 },
]

export default function Reports() {
  const { monthlyRevenue } = useSelector((s) => s.dashboard)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Reports"
        subtitle="Sales analytics and insights"
        breadcrumbs={['Dashboard', 'Reports']}
        actions={
          <button className="btn-primary text-sm">📊 Export Report</button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Revenue by Month" subtitle="Year-to-date revenue performance">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Revenue" />
                <Bar dataKey="target"  fill="#10b981" radius={[6, 6, 0, 0]} name="Target"  opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Lead Sources" subtitle="Where your leads come from">
          <div style={{ height: 280 }} className="flex items-center gap-6">
            <ResponsiveContainer width={200} height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={3}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {sourceData.map((_, i) => <Cell key={i} fill={sourceData[i].color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {sourceData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{d.name}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Conversion Funnel Rate" subtitle="Stage-by-stage conversion percentages">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="rate" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Monthly Leads & Wins" subtitle="Lead acquisition vs deal closures">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} barSize={14} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#6366f1" radius={[4, 4, 0, 0]} name="Leads" />
                <Bar dataKey="won"   fill="#10b981" radius={[4, 4, 0, 0]} name="Won"   />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
