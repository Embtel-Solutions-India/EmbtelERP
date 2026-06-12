import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { FaUsers, FaHandshake, FaChartLine, FaPercent } from 'react-icons/fa'
import SectionCard from '../common/SectionCard'

// Customer-base insights derived from the sales lead pipeline (no demo data).
export default function CustomerInsights() {
  const summary = useSelector((s) => s.leads?.summary) || {}

  const converted = summary.converted ?? summary.won ?? 0
  const fresh     = summary.new ?? 0
  const inPipe    = (summary.contacted ?? 0) + (summary.consultationScheduled ?? 0) +
                    (summary.documentsRequested ?? 0) + (summary.qualified ?? 0)
  const lost      = summary.lost ?? 0
  const total     = summary.total ?? 0
  const convRate  = summary.conversionRate ?? 0

  const data = [
    { name: 'Converted',   value: converted, color: '#10b981' },
    { name: 'New',         value: fresh,     color: '#6366f1' },
    { name: 'In Pipeline', value: inPipe,    color: '#f59e0b' },
    { name: 'Lost',        value: lost,      color: '#ef4444' },
  ]

  const STATS = [
    { label: 'Total Leads',     value: total,            Icon: FaUsers,     color: 'text-primary-600 dark:text-primary-400' },
    { label: 'Converted',       value: converted,        Icon: FaHandshake, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'In Pipeline',     value: inPipe,           Icon: FaChartLine, color: 'text-amber-600 dark:text-amber-400'    },
    { label: 'Conversion Rate', value: `${convRate}%`,   Icon: FaPercent,   color: 'text-purple-600 dark:text-purple-400'  },
  ]

  const hasData = total > 0

  return (
    <SectionCard title="Customer Insights" subtitle="Customer base overview" delay={0.2} className="h-[420px] flex flex-col">
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-neutral-400 dark:text-neutral-500">
          <FaUsers size={28} />
          <p className="text-sm">No customer data yet</p>
          <p className="text-xs">Insights appear once leads are added to your pipeline.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div style={{ width: 120, height: 160 }} className="flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3}>
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2.5">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <s.Icon className={s.color} size={13} />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            {data.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  )
}
