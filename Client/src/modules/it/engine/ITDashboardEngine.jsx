import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Add } from '@mui/icons-material'
import PageHeader from '../../../components/common/PageHeader'
import { fetchItOverview, fetchItSprint } from '../redux/itSlice'
import ItKpiSection from '../widgets/ItKpiSection'
import ItBurndownChart from '../widgets/ItBurndownChart'
import ItRecentActivity from '../widgets/ItRecentActivity'
import ItSprintBoard from '../widgets/ItSprintBoard'
import ItProjectSelector from '../widgets/ItProjectSelector'
import ItTeamLoad from '../widgets/ItTeamLoad'
import ItTaskFlow from '../widgets/ItTaskFlow'
import ItMyTasks from '../widgets/ItMyTasks'
import ItEodForm from '../widgets/ItEodForm'
import ItAddTaskPanel from '../widgets/ItAddTaskPanel'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sprint', label: 'Sprint board' },
  { id: 'team', label: 'Team load' },
  { id: 'mine', label: 'My tasks' },
  { id: 'flow', label: 'Task flow' },
  { id: 'eod', label: 'EOD report' },
]

export default function ITDashboardEngine() {
  const dispatch = useDispatch()
  const [tab, setTab] = useState('overview')
  const [panelOpen, setPanelOpen] = useState(false)
  // Managers (level ≥ 2) can reassign tasks from the board; the server enforces
  // the same rule, so this is purely to surface the control.
  const canAssign = useSelector((s) => Number(s.auth.user?.roleLevel ?? s.auth.user?.employeeLevel ?? 0) >= 2)

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
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1 max-w-2xl">
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
        {tab === 'sprint' && (
          <div className="space-y-4">
            <ItProjectSelector />
            <ItSprintBoard canAssign={canAssign} />
          </div>
        )}
        {tab === 'team' && <ItTeamLoad />}
        {tab === 'mine' && <ItMyTasks />}
        {tab === 'flow' && <ItTaskFlow />}
        {tab === 'eod' && <ItEodForm />}
      </motion.div>

      <ItAddTaskPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  )
}
