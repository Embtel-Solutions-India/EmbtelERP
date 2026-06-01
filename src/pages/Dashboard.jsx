import { useSelector } from 'react-redux'
import {
  FaUsers, FaUserPlus, FaStar, FaFire, FaPhone,
  FaCalendarAlt, FaTrophy, FaTimesCircle, FaDollarSign, FaBullseye,
} from 'react-icons/fa'
import StatCard        from '../components/common/StatCard'
import WelcomeSection  from '../components/dashboard/WelcomeSection'
import PipelineBoard   from '../components/dashboard/PipelineBoard'
import FollowUpsTable  from '../components/dashboard/FollowUpsTable'
import MeetingCards    from '../components/dashboard/MeetingCard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import ActivityTimeline from '../components/dashboard/ActivityTimeline'
import TaskWidget      from '../components/dashboard/TaskWidget'
import TargetProgress  from '../components/dashboard/TargetProgress'
import OpportunityTable from '../components/dashboard/OpportunityTable'
import CustomerInsights from '../components/dashboard/CustomerInsights'
import CalendarWidget  from '../components/dashboard/CalendarWidget'

const SPARK_DATA = {
  leads:     [30, 42, 38, 55, 47, 62, 58, 71, 65, 78, 72, 85],
  revenue:   [280, 310, 295, 340, 380, 360, 420, 410, 450, 440, 480, 510],
  followups: [8, 12, 15, 10, 18, 14, 22, 19, 25, 21, 28, 23],
  won:       [3, 5, 4, 7, 6, 8, 7, 10, 9, 11, 10, 13],
}

export default function Dashboard() {
  const { kpiStats } = useSelector((s) => s.dashboard)

  const statCards = [
    {
      title: 'Total Leads',        value: kpiStats.totalLeads,
      icon: <FaUsers size={18} />, color: '#6366f1',
      change: 12.5, changeLabel: 'vs last month', sparkData: SPARK_DATA.leads,
    },
    {
      title: 'New Leads Today',    value: kpiStats.newLeadsToday,
      icon: <FaUserPlus size={18} />, color: '#06b6d4',
      change: 8.3, changeLabel: 'vs yesterday', sparkData: [2, 4, 3, 5, 4, 6, 7],
    },
    {
      title: 'Qualified Leads',    value: kpiStats.qualifiedLeads,
      icon: <FaStar size={18} />, color: '#8b5cf6',
      change: 5.1, changeLabel: 'vs last month', sparkData: [10, 14, 12, 16, 15, 18, 17, 20, 19, 22, 21, 24],
    },
    {
      title: 'Hot Leads',          value: kpiStats.hotLeads,
      icon: <FaFire size={18} />, color: '#ef4444',
      change: 15.7, changeLabel: 'vs last month', sparkData: [5, 7, 6, 9, 8, 11, 10, 13, 12, 15, 14, 18],
    },
    {
      title: 'Follow Ups Pending', value: kpiStats.followUpsPending,
      icon: <FaPhone size={18} />, color: '#f59e0b',
      change: -3.2, changeLabel: 'vs last week', sparkData: SPARK_DATA.followups,
    },
    {
      title: 'Meetings Scheduled', value: kpiStats.meetingsScheduled,
      icon: <FaCalendarAlt size={18} />, color: '#10b981',
      change: 22.4, changeLabel: 'vs last month', sparkData: [1, 2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 7],
    },
    {
      title: 'Won Deals',          value: kpiStats.wonDeals,
      icon: <FaTrophy size={18} />, color: '#10b981',
      change: 18.6, changeLabel: 'vs last month', sparkData: SPARK_DATA.won,
    },
    {
      title: 'Lost Deals',         value: kpiStats.lostDeals,
      icon: <FaTimesCircle size={18} />, color: '#ef4444',
      change: -8.1, changeLabel: 'vs last month', sparkData: [4, 3, 5, 3, 4, 2, 3, 2, 2, 1, 2, 1],
    },
    {
      title: 'Monthly Revenue',    value: kpiStats.monthlyRevenue,
      icon: <FaDollarSign size={18} />, prefix: '$', color: '#6366f1',
      change: 9.4, changeLabel: 'vs last month', sparkData: SPARK_DATA.revenue, formatValue: false,
    },
    {
      title: 'Target Achievement', value: kpiStats.targetAchievement,
      icon: <FaBullseye size={18} />, suffix: '%', color: '#8b5cf6',
      change: 4.2, changeLabel: 'improvement',
      sparkData: [55, 60, 58, 63, 67, 65, 70, 68, 73, 72, 77, 79], formatValue: false,
    },
  ]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2"><PerformanceChart /></div>
        <TaskWidget />
      </div>

      <PipelineBoard />

      <FollowUpsTable />

      {/* ActivityTimeline and MeetingCards share the same row so the grid
          stretch (no items-start) makes them equal height automatically */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityTimeline />
        <MeetingCards />
      </div>

      <OpportunityTable />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        <CustomerInsights />
        <CalendarWidget />
        <TargetProgress />
      </div>
    </div>
  )
}
