import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'
import { fetchRoleWorkspace, fetchDashboardOverview, fetchDashboardPerformance } from '../../../redux/slices/dashboardSlice'
import { fetchWorkspaceApprovals, fetchWorkspaceActivities } from '../../../redux/slices/workspaceSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { fetchCalendarEvents } from '../../../redux/slices/calendarSlice'

export default function AdminDashboard() {
  const dispatch = useDispatch()
  const { overview, loading } = useSelector(s => s.dashboard)

  useEffect(() => {
    dispatch(fetchRoleWorkspace())
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
    dispatch(fetchWorkspaceApprovals())
    dispatch(fetchWorkspaceActivities())
    dispatch(fetchTasks())
    dispatch(fetchCalendarEvents({}))
  }, [dispatch])

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />

      {loading && <div className="text-center py-2 text-sm text-neutral-400">Loading system data...</div>}

      <DashboardLayoutEngine role="super_admin" />
    </div>
  )
}
