import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { formatCurrency, formatNumber } from '../../utils'
import SectionCard from '../common/SectionCard'

const FUNNEL_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#f59e0b','#ec4899','#10b981']

export default function SalesFunnel() {
  const { funnelData } = useSelector((s) => s.dashboard)
  const maxCount = funnelData[0]?.count || 1

  return (
    <SectionCard
      title="Sales Funnel"
      subtitle="Lead conversion across pipeline stages"
      delay={0.15}
    >
      <div className="space-y-3">
        {funnelData.map((stage, i) => {
          const pct = (stage.count / maxCount) * 100
          const color = FUNNEL_COLORS[i]

          return (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i + 0.2 }}
              className="group"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{stage.stage}</span>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <span>{stage.count} leads</span>
                  <span className="font-semibold" style={{ color }}>{stage.convRate}%</span>
                  <span className="hidden sm:block">{formatCurrency(stage.value)}</span>
                </div>
              </div>
              <div className="relative h-8 bg-slate-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, delay: 0.1 * i + 0.3, ease: 'easeOut' }}
                  className="h-full rounded-lg flex items-center px-3"
                  style={{ background: `linear-gradient(90deg, ${color}dd, ${color}88)` }}
                >
                  {pct > 20 && (
                    <span className="text-white text-xs font-bold">{stage.count}</span>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700 grid grid-cols-3 gap-3">
        {[
          { label: 'Total Leads', val: funnelData[0]?.count, color: '#6366f1' },
          { label: 'Win Rate',    val: `${funnelData[funnelData.length - 1]?.convRate}%`, color: '#10b981' },
          { label: 'Total Value', val: formatCurrency(funnelData[0]?.value || 0), color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
