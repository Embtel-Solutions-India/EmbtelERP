import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { FaBullseye } from 'react-icons/fa'
import { formatCurrency } from '../../../utils'
import SectionCard from '../../../components/common/SectionCard'

export default function MarketingTargetProgress() {
  const { kpiStats } = useSelector((s) => s.marketingDashboard)
  const { monthlyTarget, monthlyRevenue, targetAchievement } = kpiStats
  const remaining = monthlyTarget - monthlyRevenue
  const projectedDays = Math.round((remaining / (monthlyRevenue || 1)) * 30)

  const radialData = [
    { name: 'Achievement', value: targetAchievement, fill: '#6366f1' },
  ]

  return (
    <SectionCard title="Marketing Target" subtitle="Monthly performance tracker" delay={0.2}>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0" style={{ width: 120, height: 104 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="80%" outerRadius="100%"
              data={radialData}
              startAngle={90} endAngle={-270}
            >
              <RadialBar
                background={{ fill: '#f1f5f9' }}
                dataKey="value"
                cornerRadius={6}
                max={100}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{targetAchievement}%</span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">achieved</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {[
            { label: 'Monthly Target', val: formatCurrency(monthlyTarget), color: 'text-neutral-600 dark:text-neutral-400' },
            { label: 'Revenue Generated',       val: formatCurrency(monthlyRevenue), color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Remaining Target',      val: formatCurrency(remaining > 0 ? remaining : 0),     color: 'text-amber-600 dark:text-amber-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.label}</span>
              <span className={`text-sm font-bold ${item.color}`}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500 mb-1.5">
          <span>Progress</span>
          <span>{targetAchievement}% of 100%</span>
        </div>
        <div className="h-2.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${targetAchievement}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
          <FaBullseye className="text-primary-500" size={16} />
          <div>
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">
              {targetAchievement >= 100
                ? 'Target achieved!'
                : `Projected completion in ~${projectedDays} days`}
            </p>
            <p className="text-xs text-primary-500">
              {remaining > 0 ? `${formatCurrency(remaining)} more to go` : 'Great work!'}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
