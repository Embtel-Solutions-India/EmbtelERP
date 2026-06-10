import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  fetchWorkspaceLeads, fetchTeamLeaderboard, fetchWorkspaceFollowUps, fetchTeamStats
} from '../../../redux/slices/workspaceSlice'
import { fetchRoleWorkspace, fetchDashboardTeam, fetchDashboardOverview, fetchDashboardPerformance } from '../../../redux/slices/dashboardSlice'
import { fetchTasks } from '../../../redux/slices/taskSlice'
import { fetchCalendarEvents } from '../../../redux/slices/calendarSlice'
import DashboardLayoutEngine from '../../../components/dashboard/DashboardLayoutEngine'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'

export default function SalesHeadDashboard() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchWorkspaceLeads())
    dispatch(fetchTeamLeaderboard())
    dispatch(fetchWorkspaceFollowUps())
    dispatch(fetchTeamStats())
    dispatch(fetchRoleWorkspace())
    dispatch(fetchDashboardTeam())
    dispatch(fetchTasks())
    dispatch(fetchDashboardOverview())
    dispatch(fetchDashboardPerformance())
    dispatch(fetchCalendarEvents({}))
  }, [dispatch])

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />
      <DashboardLayoutEngine role="sales_head" />
    </div>
  )
}
