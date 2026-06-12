import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'
import {
  fetchDashboardOverview, fetchDashboardPerformance, fetchDashboardInsights,
  fetchDashboardTeam, fetchRoleWorkspace
} from '../../../redux/slices/dashboardSlice'
import { fetchTeamStats, fetchWorkspaceLeads, fetchTeamLeaderboard, fetchWorkspaceApprovals, fetchWorkspaceActivities } from '../../../redux/slices/workspaceSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { fetchCalendarEvents } from '../../../redux/slices/calendarSlice'
import { fetchSalesTargets, fetchTargetSummary } from '../../../redux/slices/salesTargetSlice'

export default function OwnerDashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { overview, loading } = useSelector(s => s.dashboard)
  const { current: activePerspective } = useSelector(s => s.perspective)

  useEffect(() => {
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
    dispatch(fetchDashboardInsights())
    dispatch(fetchDashboardTeam())
    dispatch(fetchRoleWorkspace())
    dispatch(fetchTeamStats())
    dispatch(fetchWorkspaceLeads())
    dispatch(fetchTeamLeaderboard())
    dispatch(fetchWorkspaceApprovals())
    dispatch(fetchWorkspaceActivities())
    dispatch(fetchTasks())
    dispatch(fetchCalendarEvents({}))
    dispatch(fetchSalesTargets())
    dispatch(fetchTargetSummary())
  }, [dispatch, activePerspective])

  const designation = (user?.designation || '').toLowerCase()

  const isVerticalManager = designation.includes('vertical manager')
  const isImmigrationHead = designation.includes('immigration') || designation.includes('business head')

  let roleKey = 'business_owner'
  if (isVerticalManager) {
    roleKey = 'vertical_manager'
  } else if (isImmigrationHead) {
    roleKey = 'immigration_head'
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />

      {loading && <div className="text-center py-2 text-sm text-neutral-400">Loading business data...</div>}

      {overview?.perspective && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-primary-700 dark:text-primary-300">Viewing: {overview.perspective.label}</span>
            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">{overview.perspective.aggregationLevel}</span>
          </div>
        </div>
      )}

      {/* Role-specific insight banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white mb-6">
        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
          {roleKey.replace('_', ' ')} Overview
        </p>
        <h2 className="text-xl font-bold mb-1">
          {isVerticalManager ? 'Cross-Department Performance Monitor'
          : isImmigrationHead ? 'Immigration Business Intelligence'
          : 'Enterprise Business Dashboard'}
        </h2>
      </div>

      <DashboardLayoutEngine role={roleKey} />
    </div>
  )
}
