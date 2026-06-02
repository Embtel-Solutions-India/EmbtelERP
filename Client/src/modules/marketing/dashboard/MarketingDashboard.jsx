import { useSelector } from 'react-redux'
import {
  FaUsers, FaUserPlus, FaStar, FaTrophy, FaDollarSign, FaBullseye, FaBullhorn, FaEnvelope,
} from 'react-icons/fa'
import StatCard        from '../../../components/common/StatCard'
import MarketingWelcomeSection from './MarketingWelcomeSection'
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

const SPARK_DATA = {
  leads:     [210, 220, 215, 230, 240, 235, 245, 240, 250, 245, 255, 260],
  traffic:   [35000, 38000, 36000, 39000, 41000, 40000, 42000, 41000, 43000, 42000, 44000, 45000],
  roi:       [2.8, 2.9, 2.85, 3.0, 3.1, 3.05, 3.15, 3.1, 3.2, 3.15, 3.25, 3.3],
}

export default function MarketingDashboard() {
  const { kpiStats } = useSelector((s) => s.marketingDashboard)

  const statCards = [
    {
      title: 'Leads Generated', value: kpiStats.leadsGenerated,
      icon: <FaUserPlus size={18} />, color: '#6366f1',
      change: 12.5, changeLabel: 'vs last month', sparkData: SPARK_DATA.leads,
    },
    {
      title: 'Active Campaigns', value: kpiStats.activeCampaigns,
      icon: <FaBullhorn size={18} />, color: '#06b6d4',
      change: 8.3, changeLabel: 'vs yesterday', sparkData: [3, 4, 3, 5, 4, 5, 5],
    },
    {
      title: 'Cost Per Lead (CPL)', value: kpiStats.costPerLead,
      icon: <FaDollarSign size={18} />, prefix: '$', color: '#ef4444',
      change: -4.2, changeLabel: 'vs last month', sparkData: [18.2, 17.5, 17.1, 16.8, 16.2, 15.9, 15.5],
    },
    {
      title: 'Conversion Rate', value: kpiStats.conversionRate,
      icon: <FaTrophy size={18} />, suffix: '%', color: '#10b981',
      change: 5.1, changeLabel: 'vs last month', sparkData: [10.8, 11.2, 11.5, 11.9, 12.0, 12.2, 12.4],
    },
    {
      title: 'Campaign ROI', value: kpiStats.campaignRoi,
      icon: <FaBullseye size={18} />, suffix: 'x', color: '#8b5cf6',
      change: 15.7, changeLabel: 'vs last month', sparkData: SPARK_DATA.roi,
    },
    {
      title: 'Website Traffic', value: kpiStats.websiteTraffic,
      icon: <FaUsers size={18} />, color: '#6366f1',
      change: 9.4, changeLabel: 'vs last month', sparkData: SPARK_DATA.traffic,
    },
    {
      title: 'Social Engagement', value: kpiStats.socialEngagement,
      icon: <FaStar size={18} />, suffix: '%', color: '#f59e0b',
      change: 2.1, changeLabel: 'vs last week', sparkData: [4.1, 4.3, 4.2, 4.5, 4.6, 4.7, 4.8],
    },
    {
      title: 'Email Open Rate', value: kpiStats.emailOpenRate,
      icon: <FaEnvelope size={18} />, suffix: '%', color: '#10b981',
      change: 4.2, changeLabel: 'vs last month', sparkData: [21.5, 22.1, 22.8, 23.4, 23.9, 24.1, 24.5],
    },
  ]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <MarketingWelcomeSection />

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
