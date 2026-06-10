import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { FaUsers, FaUserPlus, FaSyncAlt, FaStar } from 'react-icons/fa'
import SectionCard from '../common/SectionCard'

const data = [
  { name: 'Active',    value: 89,  color: '#10b981' },
  { name: 'New',       value: 23,  color: '#6366f1' },
  { name: 'Returning', value: 47,  color: '#f59e0b' },
  { name: 'At Risk',   value: 11,  color: '#ef4444' },
]

const STATS = [
  { label: 'Active Customers',    value: '89',  Icon: FaUsers,    color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'New Customers',       value: '23',  Icon: FaUserPlus, color: 'text-primary-600 dark:text-primary-400' },
  { label: 'Returning Customers', value: '47',  Icon: FaSyncAlt,  color: 'text-amber-600 dark:text-amber-400'    },
  { label: 'Satisfaction Score',  value: '4.7', Icon: FaStar,     color: 'text-purple-600 dark:text-purple-400'  },
]

export default function CustomerInsights() {
  return (
    <SectionCard title="Customer Insights" subtitle="Customer base overview" delay={0.2}>
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
    </SectionCard>
  )
}
