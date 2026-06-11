import { useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import SectionCard from '../../../components/common/SectionCard'

function fmtRev(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 p-3 text-xs">
      <p className="font-bold text-neutral-600 dark:text-neutral-300 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-neutral-500 dark:text-neutral-400">Revenue:</span>
          <span className="font-bold text-neutral-700 dark:text-neutral-200">{fmtRev(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ImmigrationRevenueChart() {
  const { revenue, loadingRevenue } = useSelector(s => s.immigration)
  const byPeriod = revenue?.byPeriod ?? []

  const chartData = byPeriod.map(d => ({
    month: d.period.slice(5),   // "2026-06" → "06"
    revenue: d.revenue,
    deals: d.deals,
  }))

  return (
    <SectionCard
      title="Revenue"
      subtitle={`Total: ${fmtRev(revenue?.total ?? 0)} · ${revenue?.deals ?? 0} deals`}
      className="h-[420px] flex flex-col"
    >
      {loadingRevenue ? (
        <div className="flex-1 min-h-0 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
          No revenue data for this period
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`}
                  tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top-5 vertical breakdown */}
          {revenue?.byVertical?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex-shrink-0">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">By Vertical</p>
              <div className="space-y-1">
                {revenue.byVertical.slice(0, 4).map(v => (
                  <div key={v.verticalId} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[60%]">{v.verticalName}</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-100">{fmtRev(v.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  )
}
