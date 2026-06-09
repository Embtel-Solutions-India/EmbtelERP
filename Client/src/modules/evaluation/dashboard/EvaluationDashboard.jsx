import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'
import {
  fetchDashboardOverview,
  fetchDashboardPerformance,
  fetchDashboardInsights,
  fetchRoleWorkspace
} from '../../../redux/slices/dashboardSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { fetchWorkspaceApprovals, fetchWorkspaceActivities } from '../../../redux/slices/workspaceSlice'

export default function EvaluationDashboard() {
  const dispatch = useDispatch()
  const { overview, loading } = useSelector((s) => s.dashboard)
  const { current: activePerspective } = useSelector((s) => s.perspective)

  useEffect(() => {
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
    dispatch(fetchDashboardInsights())
    dispatch(fetchRoleWorkspace())
    dispatch(fetchTasks())
    dispatch(fetchWorkspaceApprovals())
    dispatch(fetchWorkspaceActivities())
  }, [dispatch, activePerspective])

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />

      {loading && (
        <div className="text-center py-2 text-sm text-slate-400">
          Loading evaluation dashboard data...
        </div>
      )}

      {overview?.perspective && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-primary-700 dark:text-primary-300">
              Viewing Perspective: {overview.perspective.label}
            </span>
            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
              {overview.perspective.aggregationLevel}
            </span>
          </div>
        </div>
      )}

      <DashboardLayoutEngine role="evaluation_head" />
    </div>
  )
}
