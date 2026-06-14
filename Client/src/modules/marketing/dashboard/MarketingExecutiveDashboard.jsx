import { useAutoRefresh } from '../../../hooks/useAutoRefresh'
import { useDispatch } from 'react-redux'
import { fetchWorkspaceLeads, fetchWorkspacePipeline, fetchWorkspaceActivities } from '../../../redux/slices/workspaceSlice'
import { fetchRoleWorkspace, fetchDashboardOverview, fetchDashboardPerformance } from '../../../redux/slices/dashboardSlice'
import { fetchMarketingDashboardData } from '../redux/marketingDashboardSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { fetchCalendarEvents } from '../../../redux/slices/calendarSlice'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'

export default function MarketingExecutiveDashboard() {
  const dispatch = useDispatch()

  useAutoRefresh(() => {
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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <DashboardLayoutEngine role="marketing_executive" />
    </div>
  )
}
