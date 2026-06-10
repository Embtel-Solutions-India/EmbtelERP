import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchTeamLeaderboard, fetchTeamStats, fetchWorkspaceLeads, fetchWorkspacePipeline } from '../../../redux/slices/workspaceSlice'
import { fetchRoleWorkspace, fetchDashboardOverview, fetchDashboardPerformance } from '../../../redux/slices/dashboardSlice'
import { fetchMarketingDashboardData } from '../redux/marketingDashboardSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'

export default function MarketingManagerDashboard() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchTeamLeaderboard())
    dispatch(fetchTeamStats())
    dispatch(fetchWorkspaceLeads())
    dispatch(fetchWorkspacePipeline())
    dispatch(fetchRoleWorkspace())
    dispatch(fetchMarketingDashboardData())
    dispatch(fetchTasks())
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
  }, [dispatch])

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <DashboardLayoutEngine role="marketing_manager" />
    </div>
  )
}
