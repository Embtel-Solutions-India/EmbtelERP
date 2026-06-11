import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import WelcomeSection from '../components/dashboard/WelcomeSection'
import ImmigrationRevenueChart from '../modules/immigration/widgets/ImmigrationRevenueChart'
import ImmigrationLeadFunnel  from '../modules/immigration/widgets/ImmigrationLeadFunnel'
import {
  fetchImmigrationRevenue,
  fetchImmigrationLeads,
} from '../modules/immigration/redux/immigrationSlice'
import { useImmigrationScope } from '../hooks/useImmigrationScope'
import ImmigrationBreadcrumb from '../modules/immigration/widgets/ImmigrationBreadcrumb'

const PERIODS = [
  { value: 'month',   label: 'This Month'   },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year',    label: 'This Year'    },
]

export default function HeadAnalyticsPage() {
  const dispatch = useDispatch()
  const [period, setPeriod] = useState('month')
  const scope = useImmigrationScope()
  const scopedVertical = scope.scopeType === 'VERTICAL' ? scope.scopeId : undefined

  // Re-fetch when scope or period changes
  useEffect(() => {
    dispatch(fetchImmigrationRevenue({ period, verticalId: scopedVertical }))
    dispatch(fetchImmigrationLeads({ verticalId: scopedVertical }))
  }, [dispatch, period, scopedVertical])

  const applyPeriod = (p) => {
    setPeriod(p)
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <ImmigrationBreadcrumb />

      {/* Header + period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">Analytics</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Revenue and lead performance across the immigration division</p>
        </div>
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => applyPeriod(p.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === p.value
                  ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <ImmigrationRevenueChart />
        </div>
        <div className="md:col-span-2">
          <ImmigrationLeadFunnel />
        </div>
      </div>
    </div>
  )
}
