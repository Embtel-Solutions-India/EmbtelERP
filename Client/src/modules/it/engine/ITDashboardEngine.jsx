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
import ItAssignTask from '../widgets/ItAssignTask'
import ItEodForm from '../widgets/ItEodForm'
import ItAddTaskPanel from '../widgets/ItAddTaskPanel'

// Per-view header copy. Each view is its own page (reached from the sidebar);
// there is no internal tab bar anymore.
const VIEW_META = {
  overview: { title: 'IT Development', subtitle: 'Sprint health, burndown and recent activity', crumb: 'Overview' },
  board:    { title: 'Sprint Board',   subtitle: 'Project boards for the development team', crumb: 'Board' },
  team:     { title: 'Team Load',      subtitle: 'Workload across all active projects', crumb: 'Team load' },
  mine:     { title: 'My Tasks',       subtitle: 'Tasks assigned to you and your own', crumb: 'My tasks' },
  assign:   { title: 'Assign Task',    subtitle: 'Create and hand a task to a team member', crumb: 'Assign task' },
  flow:     { title: 'Task Flow',      subtitle: 'How a task moves through the IT department', crumb: 'Task flow' },
  eod:      { title: 'EOD Report',     subtitle: 'Submit and review end-of-day reports', crumb: 'EOD report' },
}

export default function ITDashboardEngine({ view = 'overview' }) {
  const dispatch = useDispatch()
  const [panelOpen, setPanelOpen] = useState(false)
  // Managers (level ≥ 2) can reassign tasks from the board; the server enforces
  // the same rule, so this is purely to surface the control.
  const canAssign = useSelector((s) => Number(s.auth.user?.roleLevel ?? s.auth.user?.employeeLevel ?? 0) >= 2)

  // Each view loads only the data it needs (most widgets self-fetch).
  useEffect(() => {
    if (view === 'overview') dispatch(fetchItOverview())
    if (view === 'board') dispatch(fetchItSprint())
  }, [dispatch, view])

  const meta = VIEW_META[view] ?? VIEW_META.overview
  const showAddTask = view === 'overview' || view === 'board'

  return (
    <div className="space-y-6">
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        breadcrumbs={['IT Development', meta.crumb]}
        actions={
          showAddTask ? (
            <button onClick={() => setPanelOpen(true)} className="btn-primary text-sm flex items-center gap-2">
              <Add fontSize="small" /> Add task
            </button>
          ) : null
        }
      />

      <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        {view === 'overview' && (
          <div className="space-y-6">
            <ItKpiSection />
            <ItBurndownChart />
            <ItRecentActivity />
          </div>
        )}
        {view === 'board' && (
          <div className="space-y-4">
            <ItProjectSelector />
            <ItSprintBoard canAssign={canAssign} />
          </div>
        )}
        {view === 'team' && <ItTeamLoad />}
        {view === 'mine' && <ItMyTasks />}
        {view === 'assign' && <ItAssignTask />}
        {view === 'flow' && <ItTaskFlow />}
        {view === 'eod' && <ItEodForm />}
      </motion.div>

      {showAddTask && <ItAddTaskPanel open={panelOpen} onClose={() => setPanelOpen(false)} />}
    </div>
  )
}
