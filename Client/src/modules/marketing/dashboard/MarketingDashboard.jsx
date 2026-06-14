import { useDispatch, useSelector } from 'react-redux'
import { useAutoRefresh } from '../../../hooks/useAutoRefresh'
import {
  FaUsers, FaUserPlus, FaStar, FaTrophy, FaDollarSign, FaBullseye, FaBullhorn, FaEnvelope,
} from 'react-icons/fa'
import StatCard        from '../../../components/common/StatCard'
import RoleWorkspacePanel from '../../../components/dashboard/RoleWorkspacePanel'
import WelcomeSection from '../../../components/dashboard/WelcomeSection'
import MarketingPipelineBoard  from '../campaigns/MarketingPipelineBoard'
import MarketingCampaignPerformanceTable from '../components/MarketingCampaignPerformanceTable'
import MarketingLaunchCards    from '../components/MarketingLaunchCards'
import MarketingPerformanceChart from '../components/MarketingPerformanceChart'
import MarketingActivityTimeline from '../components/MarketingActivityTimeline'
import MarketingTaskWidget     from '../components/MarketingTaskWidget'
import MarketingTargetProgress from '../components/MarketingTargetProgress'
import MarketingTopCampaignsTable from '../components/MarketingTopCampaignsTable'
import MarketingSocialEngagement from '../components/MarketingSocialEngagement'
import MarketingCalendarWidget from '../components/MarketingCalendarWidget'
import { fetchMarketingDashboardData } from '../redux/marketingDashboardSlice'
import { fetchMarketingTasks } from '../redux/marketingTaskSlice'
import { fetchRoleWorkspace } from '../../../redux/slices/dashboardSlice'

// Role-specific dashboards
import MarketingInternDashboard from './MarketingInternDashboard'
import MarketingExecutiveDashboard from './MarketingExecutiveDashboard'
import MarketingManagerDashboard from './MarketingManagerDashboard'

export default function MarketingDashboard() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { kpiStats, loading } = useSelector((s) => s.marketingDashboard)
  const { workspace } = useSelector((s) => s.dashboard)
  const { current: activePerspective } = useSelector((s) => s.perspective)

  useAutoRefresh(() => {
    dispatch(fetchMarketingDashboardData())
    dispatch(fetchMarketingTasks())
    dispatch(fetchRoleWorkspace())
  }, [dispatch, activePerspective])

  // Role-aware routing
  const level = Number(user?.employeeLevel ?? user?.roleLevel ?? 1)
  const designation = (user?.designation || '').toLowerCase()
  if (designation.includes('marketing') || level <= 2) {
    if (level <= 0) return <MarketingInternDashboard />
    if (level === 1) return <MarketingExecutiveDashboard />
    if (level === 2) return <MarketingManagerDashboard />
  }

  const statCards = [
    {
      title: 'Leads Generated', value: kpiStats.leadsGenerated,
      icon: <FaUserPlus size={18} />, color: '#6366f1',
      change: 0, changeLabel: 'from API',
    },
    {
      title: 'Active Campaigns', value: kpiStats.activeCampaigns,
      icon: <FaBullhorn size={18} />, color: '#06b6d4',
      change: 0, changeLabel: 'active now',
    },
    {
      title: 'Cost Per Lead (CPL)', value: kpiStats.costPerLead,
      icon: <FaDollarSign size={18} />, prefix: '$', color: '#ef4444',
      change: 0, changeLabel: 'current cost',
    },
    {
      title: 'Conversion Rate', value: kpiStats.conversionRate,
      icon: <FaTrophy size={18} />, suffix: '%', color: '#10b981',
      change: 0, changeLabel: 'current rate',
    },
    {
      title: 'Campaign ROI', value: kpiStats.campaignRoi,
      icon: <FaBullseye size={18} />, suffix: 'x', color: '#8b5cf6',
      change: 0, changeLabel: 'budget ratio',
    },
  ]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />

      {loading && (
        <div className="text-center py-2 text-sm text-neutral-400">
          Loading marketing metrics...
        </div>
      )}

      <RoleWorkspacePanel workspace={workspace} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2"><MarketingPerformanceChart /></div>
        <MarketingTaskWidget />
      </div>

      <MarketingPipelineBoard />

      <MarketingCampaignPerformanceTable />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MarketingActivityTimeline />
        <MarketingLaunchCards />
      </div>

      <MarketingTopCampaignsTable />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        <MarketingSocialEngagement />
        <MarketingCalendarWidget />
        <MarketingTargetProgress />
      </div>
    </div>
  )
}
