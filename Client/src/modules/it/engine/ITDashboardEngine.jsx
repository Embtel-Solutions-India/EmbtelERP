import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Add } from '@mui/icons-material'
import PageHeader from '../../../components/common/PageHeader'
import { fetchItOverview, fetchItSprint } from '../redux/itSlice'
import ItKpiSection from '../widgets/ItKpiSection'
import ItBurndownChart from '../widgets/ItBurndownChart'
import ItRecentActivity from '../widgets/ItRecentActivity'
import ItSprintBoard from '../widgets/ItSprintBoard'
import ItEodForm from '../widgets/ItEodForm'
import ItAddTaskPanel from '../widgets/ItAddTaskPanel'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sprint', label: 'Sprint board' },
  { id: 'eod', label: 'EOD report' },
]

export default function ITDashboardEngine() {
  const dispatch = useDispatch()
  const [tab, setTab] = useState('overview')
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchItOverview())
    dispatch(fetchItSprint())
  }, [dispatch])

  return (
    <div className="space-y-6">
      <PageHeader
        title="IT Development"
        subtitle="Sprint board, tasks and reporting for the development team"
        breadcrumbs={['Dashboard', 'IT Development']}
        actions={
          <button onClick={() => setPanelOpen(true)} className="btn-primary text-sm flex items-center gap-2">
            <Add fontSize="small" /> Add task
          </button>
        }
      />

      {/* Tab bar */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1 max-w-md">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-neutral-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        {tab === 'overview' && (
          <div className="space-y-6">
            <ItKpiSection />
            <ItBurndownChart />
            <ItRecentActivity />
          </div>
        )}
        {tab === 'sprint' && <ItSprintBoard />}
        {tab === 'eod' && <ItEodForm />}
      </motion.div>

      <ItAddTaskPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  )
}
