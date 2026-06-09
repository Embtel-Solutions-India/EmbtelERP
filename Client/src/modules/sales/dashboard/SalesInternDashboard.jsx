import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchWorkspaceFollowUps, fetchWorkspaceLeads, fetchWorkspaceActivities } from '../../../redux/slices/workspaceSlice'
import { fetchRoleWorkspace, fetchDashboardOverview, fetchDashboardPerformance } from '../../../redux/slices/dashboardSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { fetchCalendarEvents } from '../../../redux/slices/calendarSlice'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'

export default function SalesInternDashboard() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchWorkspaceLeads())
    dispatch(fetchWorkspaceFollowUps())
    dispatch(fetchWorkspaceActivities())
    dispatch(fetchRoleWorkspace())
    dispatch(fetchTasks())
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
    dispatch(fetchCalendarEvents({}))
  }, [dispatch])

  return (
    <div className="space-y-6">
      <DashboardLayoutEngine role="sales_intern" />
    </div>
  )
}
