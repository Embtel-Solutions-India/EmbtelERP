import { useSelector } from 'react-redux'
import SectionCard from '../../../components/common/SectionCard'

const STAGE_COLORS = {
  NEW:         '#6366F1',
  CONTACTED:   '#8B5CF6',
  QUALIFIED:   '#3B82F6',
  PROPOSAL:    '#0EA5E9',
  NEGOTIATION: '#F59E0B',
  WON:         '#10B981',
  LOST:        '#EF4444',
}

export default function ImmigrationLeadFunnel({ verticalId }) {
  const { leads, loadingLeads } = useSelector(s => s.immigration)
  const funnel = leads?.funnel ?? []
  const maxCount = Math.max(...funnel.map(f => f.count), 1)

  return (
    <SectionCard
      title="Lead Funnel"
      subtitle="Leads by pipeline stage"
      className="h-[420px] flex flex-col"
    >
      {loadingLeads ? (
        <div className="flex-1 min-h-0 flex flex-col gap-3 justify-center px-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin">
          {funnel.map((stage) => {
            const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
            const color = STAGE_COLORS[stage.stage] ?? '#9CA3AF'
            const revenue = stage.value >= 1_000_000
              ? `$${(stage.value / 1_000_000).toFixed(1)}M`
              : stage.value >= 1_000
              ? `$${(stage.value / 1_000).toFixed(0)}K`
              : stage.value > 0 ? `$${stage.value}` : ''
            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 capitalize w-24">
                    {stage.stage.toLowerCase()}
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    {revenue && (
                      <span className="text-[10px] text-neutral-400">{revenue}</span>
                    )}
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 w-6 text-right">
                      {stage.count}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(pct, stage.count > 0 ? 2 : 0)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}

          {funnel.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
              No lead data
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}
