import { useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { FaLock, FaFileDownload } from 'react-icons/fa'
import PageHeader from '../../../components/common/PageHeader'
import SectionCard from '../../../components/common/SectionCard'
import { formatCurrency } from '../../../utils'

const sourceData = [
  { name: 'LinkedIn Ads',   value: 40, color: '#0a66c2' },
  { name: 'Google Search PPC', value: 25, color: '#6366f1' },
  { name: 'Organic SEO',    value: 20, color: '#10b981' },
  { name: 'Instagram Influencer', value: 10, color: '#e1306c' },
  { name: 'Events / Expos', value: 5,  color: '#ec4899' },
]

export default function MarketingReports() {
  const { monthlyRevenue, funnelData } = useSelector((s) => s.marketingDashboard)

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Marketing Reports"
        subtitle="Campaign acquisition performance & lead funnels"
        breadcrumbs={['Dashboard', 'Reports']}
        actions={
          <button className="btn-primary text-sm flex items-center gap-1.5">
            <FaFileDownload size={13} /> Export Personal Report
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Personal: Lead Sources */}
        <SectionCard title="Lead Acquisition Channels" subtitle="Where campaign lead captures originate">
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

        {/* Personal: Funnel rate */}
        <SectionCard title="Marketing Funnel Rate" subtitle="Acquisition stage conversion percentages">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="convRate" fill="#6366f1" radius={[0, 6, 6, 0]} name="Conversion Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Locked: Department Budget Report */}
        <div className="relative">
          <SectionCard title="Department Budget Allocations" subtitle="Quarterly expenditure across teams">
            <div style={{ height: 280 }} className="flex flex-col items-center justify-center text-center opacity-30 select-none blur-[3px]">
              <div className="w-full h-40 bg-slate-100 dark:bg-gray-800 rounded-lg flex items-end justify-between p-4 mb-4">
                {[50, 40, 80, 60].map((h, i) => (
                  <div key={i} className="w-16 bg-blue-300 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="text-sm font-semibold">Aggregate Quarterly Expenditure Breakdown</p>
            </div>
          </SectionCard>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-white/75 dark:bg-gray-900/80 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
              <FaLock className="text-amber-500" size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Department Report Restricted</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Cross-team department allocations are restricted to Department Owners and Administrators.
            </p>
          </div>
        </div>

        {/* Locked: Owner Profitability Report */}
        <div className="relative">
          <SectionCard title="Business Owner P&L Analysis" subtitle="Annual net return on investment">
            <div style={{ height: 280 }} className="flex flex-col items-center justify-center text-center opacity-30 select-none blur-[3px]">
              <div className="w-full h-40 bg-slate-100 dark:bg-gray-800 rounded-lg flex items-center justify-center p-4 mb-4">
                <div className="w-32 h-32 rounded-full border-8 border-indigo-200 border-t-indigo-500 animate-spin" />
              </div>
              <p className="text-sm font-semibold">Consolidated Company Return on Spend</p>
            </div>
          </SectionCard>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-white/75 dark:bg-gray-900/80 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-3">
              <FaLock className="text-amber-500" size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Business Owner Report Restricted</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Annual consolidated profit and loss metrics require Business Owner or Administrator credentials.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
