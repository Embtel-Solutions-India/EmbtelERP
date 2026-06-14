import { useAutoRefresh } from '../../../hooks/useAutoRefresh'
import { useDispatch } from 'react-redux'
import { fetchWorkspaceFollowUps, fetchWorkspaceLeads, fetchWorkspaceActivities } from '../../../redux/slices/workspaceSlice'
import { fetchRoleWorkspace, fetchDashboardOverview, fetchDashboardPerformance } from '../../../redux/slices/dashboardSlice'
import { fetchLeads } from '../../../redux/slices/leadSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { fetchSalesTasks } from '../../../redux/slices/salesTaskSlice'
import { fetchTargetSummary } from '../../../redux/slices/salesTargetSlice'
import { fetchCalendarEvents } from '../../../redux/slices/calendarSlice'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'

export default function SalesInternDashboard() {
  const dispatch = useDispatch()

  useAutoRefresh(() => {
    dispatch(fetchLeads())
    dispatch(fetchWorkspaceLeads())
    dispatch(fetchWorkspaceFollowUps())
    dispatch(fetchWorkspaceActivities())
    dispatch(fetchRoleWorkspace())
    dispatch(fetchTasks())
    dispatch(fetchSalesTasks())
    dispatch(fetchTargetSummary())
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
    dispatch(fetchCalendarEvents({}))
  }, [dispatch])

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <DashboardLayoutEngine role="sales_intern" />
    </div>
  )
}
