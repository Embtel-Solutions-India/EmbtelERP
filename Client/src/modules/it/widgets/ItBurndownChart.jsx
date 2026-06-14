import { useSelector } from 'react-redux'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import SectionCard from '../../../components/common/SectionCard'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 p-3 text-xs">
      <p className="font-bold text-neutral-600 dark:text-neutral-300 mb-1">Day {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-neutral-500 dark:text-neutral-400">{p.name}:</span>
          <span className="font-bold text-neutral-700 dark:text-neutral-200">
            {p.value == null ? '—' : `${p.value} pts`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ItBurndownChart() {
  const { overview, loadingOverview } = useSelector((s) => s.it)
  const points = overview?.burndown ?? []

  const chartData = points.map((p) => ({
    day: p.dayIndex,
    Ideal: p.idealPoints,
    Actual: p.actualPoints,
  }))

  return (
    <SectionCard
      title="Sprint burndown"
      subtitle="Points remaining — ideal vs actual"
      className="h-[340px] flex flex-col"
    >
      {loadingOverview && !overview ? (
        <div className="flex-1 min-h-0 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
          No burndown data for this sprint
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `${v}`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Ideal" stroke="#A5B4FC" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
              <Line type="monotone" dataKey="Actual" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  )
}
