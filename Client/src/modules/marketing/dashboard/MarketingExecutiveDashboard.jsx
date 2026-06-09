import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchWorkspaceLeads, fetchWorkspacePipeline, fetchWorkspaceActivities } from '../../../redux/slices/workspaceSlice'
import { fetchRoleWorkspace, fetchDashboardOverview, fetchDashboardPerformance } from '../../../redux/slices/dashboardSlice'
import { fetchMarketingDashboardData } from '../redux/marketingDashboardSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { fetchCalendarEvents } from '../../../redux/slices/calendarSlice'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'

export default function MarketingExecutiveDashboard() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchWorkspaceLeads())
    dispatch(fetchWorkspacePipeline())
    dispatch(fetchWorkspaceActivities())
    dispatch(fetchRoleWorkspace())
    dispatch(fetchMarketingDashboardData())
    dispatch(fetchTasks())
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
    dispatch(fetchCalendarEvents({}))
  }, [dispatch])

  return (
    <div className="space-y-6">
      <DashboardLayoutEngine role="marketing_executive" />
    </div>
  )
}
