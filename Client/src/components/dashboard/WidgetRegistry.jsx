import React, { Suspense, lazy } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  FaUserPlus, FaFire, FaPhoneAlt, FaChartLine, FaDollarSign,
  FaCalendarAlt, FaTasks, FaCheckCircle, FaHandshake, FaTrophy,
  FaExclamationTriangle, FaUsers, FaStar, FaBuilding, FaLock,
  FaFileAlt, FaHdd, FaDatabase, FaShieldAlt, FaBriefcase, FaGraduationCap,
  FaClipboardCheck, FaPen, FaHistory, FaUserTie, FaChevronRight, FaHeartbeat, FaRocket, FaFlag,
  FaBullseye, FaEnvelope, FaMousePointer, FaBullhorn, FaBell, FaFolderOpen, FaSearch, FaListAlt,
  FaPercent, FaGlobeAsia, FaThumbsUp, FaMapMarkerAlt, FaBalanceScale, FaChartPie,
} from 'react-icons/fa'
import SectionCard from '../common/SectionCard'
import StatCard from '../common/StatCard'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

// Lazy load the existing complex widgets for performance optimization
const CalendarWidget = lazy(() => import('./CalendarWidget'))
const ActivityTimeline = lazy(() => import('./ActivityTimeline'))
const NotificationPanel = lazy(() => import('./NotificationPanel'))
const QuickActions = lazy(() => import('./QuickActions'))
const TaskWidget = lazy(() => import('./TaskWidget'))
const PerformanceChart = lazy(() => import('./PerformanceChart'))
const UpcomingEventsWidget = lazy(() => import('./UpcomingEventsWidget'))
const PipelineBoard    = lazy(() => import('./PipelineBoard'))
const FollowUpsTable   = lazy(() => import('./FollowUpsTable'))
const MeetingCards     = lazy(() => import('./MeetingCard'))
const OpportunityTable = lazy(() => import('./OpportunityTable'))
const CustomerInsights = lazy(() => import('./CustomerInsights'))
const TargetProgress   = lazy(() => import('./TargetProgress'))

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// Skeleton loader for loading state representation
export function WidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 animate-pulse space-y-4 h-full min-h-[160px]">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3"></div>
        <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
      </div>
      <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2"></div>
      <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3"></div>
    </div>
  )
}

// ── Sparkline trend presets ──────────────────────────────────────
const SPARK_UP       = [30, 34, 32, 38, 42, 40, 46, 50, 54, 62]
const SPARK_DOWN     = [70, 65, 68, 60, 55, 58, 50, 46, 42, 38]
const SPARK_FLAT     = [50, 52, 49, 51, 50, 53, 49, 52, 50, 53]
const SPARK_VOLATILE = [35, 58, 40, 68, 44, 62, 50, 72, 48, 70]
const SPARK_GROWTH   = [20, 24, 28, 32, 38, 44, 50, 58, 66, 76]

// ── Grid wrapper ────────────────────────────────────────────────
function KpiGrid({ children }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
      {children}
    </div>
  )
}

// ── Shorthand for a single StatCard ─────────────────────────────
function K({ title, value, prefix, suffix, change, changeLabel, icon, color, spark = SPARK_UP, delay = 0, formatValue = true }) {
  return (
    <StatCard
      title={title}
      value={value}
      prefix={prefix}
      suffix={suffix}
      change={change}
      changeLabel={changeLabel}
      icon={icon}
      color={color}
      sparkData={spark}
      delay={delay}
      formatValue={formatValue}
    />
  )
}

// 1. KPI Cards Widget Wrapper
export function KpiCardsWidget({ role }) {
  const { leads, followUps, teamStats, activities, approvals } = useSelector(s => s.workspace || {})
  const { overview } = useSelector(s => s.dashboard || {})
  const { list: tasks } = useSelector(s => s.tasks || { list: [] })
  const { kpiStats } = useSelector(s => s.marketingDashboard || { kpiStats: {} })
  // Sales dashboards source their KPIs from the sales lead slice (real sales
  // leads), not the marketing-backed workspace summary.
  const salesLeads = useSelector(s => s.leads || {})
  const salesSummary = salesLeads?.summary || {}
  const salesList    = salesLeads?.list || []
  const salesLoading = salesLeads?.loading
  const salesError   = salesLeads?.error
  // Sales follow-up tasks live in their own (sales-only) slice.
  const salesTasks   = useSelector(s => s.salesTasks || {})
  const stSummary    = salesTasks?.summary || {}

  // Loading / error / empty states for the sales KPI grid (real data only).
  const salesKpiState = () => {
    if (salesError) {
      return <div className="col-span-full card p-6 text-center text-sm text-red-500">Failed to load KPIs: {String(salesError)}</div>
    }
    if (salesLoading && salesList.length === 0) {
      return <>{Array.from({ length: 8 }).map((_, i) => <WidgetSkeleton key={i} />)}</>
    }
    if (!salesLoading && salesList.length === 0) {
      return <div className="col-span-full card p-6 text-center text-sm text-neutral-500">No sales data yet — add a lead to populate KPIs.</div>
    }
    return null
  }

  const summary         = leads?.summary || {}
  const todayFU         = followUps?.todayCount ?? 0
  const overdueFU       = followUps?.overdueCount ?? 0
  const pendingFU       = followUps?.totalPending ?? 0
  const pendingApprovals = approvals?.pendingCount ?? 0
  const totalTasks      = tasks?.length ?? 0
  const doneTasks       = tasks?.filter(t => t.status === 'completed').length ?? 0
  const taskRate        = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const teamList        = Array.isArray(teamStats) ? teamStats : []
  const teamRevenue     = teamList.reduce((s, t) => s + (t.revenue || 0), 0)
  const totalEmployees  = overview?.employeeCount ?? 0
  const sla             = overview?.taskCount > 0 ? Math.round((overview.taskCompleted / overview.taskCount) * 100) : 88
  const totalRevenue    = overview?.businessKpis?.totalRevenue ?? overview?.businessKpis?.monthlyRevenue ?? teamRevenue
  const targetPct       = overview?.businessKpis?.targetAchievement ?? overview?.teamKpis?.targetAchievement ?? overview?.employeeKpis?.performanceScore ?? 0
  const openPositions   = overview?.openPositions ?? 0

  // ── Sales Intern ─────────────────────────────────────────────
  if (role === 'sales_intern') {
    const state = salesKpiState()
    if (state) return <KpiGrid>{state}</KpiGrid>
    return (
      <KpiGrid>
        <K title="Leads Assigned"        value={salesSummary.total ?? 0}                 icon={<FaUserPlus />}   color="#6366f1" spark={null} delay={0}    />
        <K title="New Leads"             value={salesSummary.new ?? 0}                   icon={<FaStar />}       color="#8b5cf6" spark={null} delay={0.05} />
        <K title="Today's Follow-Ups"    value={stSummary.todayFollowUps ?? 0}           icon={<FaPhoneAlt />}   color="#f59e0b" spark={null} delay={0.1}  formatValue={false} />
        <K title="Pending Tasks"         value={stSummary.pending ?? 0}                  icon={<FaTasks />}      color="#06b6d4" spark={null} delay={0.15} formatValue={false} />
        <K title="Consultations Scheduled" value={salesSummary.consultationScheduled ?? 0} icon={<FaCalendarAlt />} color="#10b981" spark={null} delay={0.2} formatValue={false} />
      </KpiGrid>
    )
  }

  // ── Sales Executive ─────────────────────────────────────────
  if (role === 'sales_executive') {
    const state = salesKpiState()
    if (state) return <KpiGrid>{state}</KpiGrid>
    return (
      <KpiGrid>
        <K title="Total Leads"             value={salesSummary.total ?? 0}                 icon={<FaUsers />}      color="#6366f1" spark={null} delay={0}    />
        <K title="New Leads"               value={salesSummary.new ?? 0}                   icon={<FaUserPlus />}   color="#8b5cf6" spark={null} delay={0.05} />
        <K title="Hot Leads"               value={salesSummary.hot ?? 0}                   icon={<FaFire />}       color="#ef4444" spark={null} delay={0.1}  />
        <K title="Today's Follow-Ups"      value={stSummary.todayFollowUps ?? 0}           icon={<FaPhoneAlt />}   color="#f59e0b" spark={null} delay={0.15} formatValue={false} />
        <K title="Pending Tasks"           value={stSummary.pending ?? 0}                  icon={<FaTasks />}      color="#06b6d4" spark={null} delay={0.2}  formatValue={false} />
        <K title="Consultations Scheduled" value={salesSummary.consultationScheduled ?? 0} icon={<FaCalendarAlt />} color="#0ea5e9" spark={null} delay={0.25} formatValue={false} />
        <K title="Converted Clients"       value={salesSummary.converted ?? 0}             icon={<FaHandshake />}  color="#10b981" spark={null} delay={0.3}  />
        <K title="Monthly Revenue"         value={salesSummary.monthlyRevenue ?? 0}        icon={<FaDollarSign />} color="#8b5cf6" prefix="$" spark={null} delay={0.35} />
      </KpiGrid>
    )
  }

  // ── Sales Head ──────────────────────────────────────────────
  if (role === 'sales_head') {
    const state = salesKpiState()
    if (state) return <KpiGrid>{state}</KpiGrid>
    const headRevenue = teamRevenue || (salesSummary.monthlyRevenue ?? 0)
    return (
      <KpiGrid>
        <K title="Total Leads"             value={salesSummary.total ?? 0}                 icon={<FaUsers />}      color="#6366f1" spark={null} delay={0}    />
        <K title="Converted Clients"       value={salesSummary.converted ?? 0}             icon={<FaHandshake />}  color="#10b981" spark={null} delay={0.05} />
        <K title="Hot Leads"               value={salesSummary.hot ?? 0}                   icon={<FaFire />}       color="#ef4444" spark={null} delay={0.1}  />
        <K title="Today's Follow-Ups"      value={stSummary.todayFollowUps ?? 0}           icon={<FaPhoneAlt />}   color="#f59e0b" spark={null} delay={0.15} formatValue={false} />
        <K title="Pending Tasks"           value={stSummary.pending ?? 0}                  icon={<FaTasks />}      color="#06b6d4" spark={null} delay={0.2}  formatValue={false} />
        <K title="Consultations Scheduled" value={salesSummary.consultationScheduled ?? 0} icon={<FaCalendarAlt />} color="#0ea5e9" spark={null} delay={0.25} formatValue={false} />
        <K title="Conversion Rate"         value={salesSummary.conversionRate ?? 0}        icon={<FaChartLine />}  color="#8b5cf6" suffix="%" spark={null} delay={0.3} formatValue={false} />
        <K title="Team Revenue"            value={headRevenue}                             icon={<FaDollarSign />} color="#10b981" prefix="$" spark={null} delay={0.35} />
      </KpiGrid>
    )
  }

  // ── Marketing Intern ────────────────────────────────────────
  if (role === 'marketing_intern') {
    const activeTasks  = tasks?.filter(t => t.status !== 'completed').length ?? 0
    const posts = tasks?.filter(t => String(t.title).toLowerCase().includes('post')).length ?? 0
    return (
      <KpiGrid>
        <K title="Campaign Tasks"     value={activeTasks}      icon={<FaTasks />}           color="#6366f1" change={0}   changeLabel="in progress"     spark={SPARK_FLAT}   delay={0}    />
        <K title="Scheduled Posts"    value={posts}            icon={<FaRocket />}           color="#f59e0b" change={4}   changeLabel="ready to publish" spark={SPARK_UP}    delay={0.05} />
        <K title="Content Items"      value={totalTasks}       icon={<FaFileAlt />}          color="#06b6d4" change={2}   changeLabel="scheduled"       spark={SPARK_UP}     delay={0.1}  />
        <K title="Pending Reviews"    value={pendingApprovals} icon={<FaClipboardCheck />}   color="#ef4444" change={pendingApprovals > 0 ? -2 : 0} changeLabel="awaiting approval" spark={SPARK_DOWN} delay={0.15} />
        <K title="Task Completion"    value={taskRate}         icon={<FaCheckCircle />}      color="#10b981" change={5}   changeLabel="vs last week"    spark={SPARK_UP}     delay={0.2}  suffix="%" formatValue={false} />
      </KpiGrid>
    )
  }

  // ── Marketing Executive ─────────────────────────────────────
  if (role === 'marketing_executive') {
    const leadsGen    = kpiStats?.leadsGenerated ?? summary.total ?? 0
    const campaigns   = kpiStats?.activeCampaigns ?? 0
    const mql         = leads?.leads?.filter(l => l.status === 'QUALIFIED').length ?? Math.round((leadsGen || 0) * 0.35)
    const convRate    = kpiStats?.conversionRate ?? summary.conversionRate ?? 0
    const cpl         = kpiStats?.costPerLead ?? 0
    const roi         = kpiStats?.campaignRoi ?? 0
    const traffic     = kpiStats?.websiteTraffic ?? 0
    const openRate    = kpiStats?.emailOpenRate ?? 0
    const social      = kpiStats?.socialEngagement ?? 0
    const tgt         = kpiStats?.targetAchievement ?? targetPct
    return (
      <KpiGrid>
        <K title="Leads Generated"    value={leadsGen}  icon={<FaUserPlus />}     color="#6366f1" change={14}     changeLabel="vs last month"   spark={SPARK_UP}     delay={0}    />
        <K title="Active Campaigns"   value={campaigns} icon={<FaBullhorn />}     color="#8b5cf6" change={2}      changeLabel="running now"     spark={SPARK_FLAT}   delay={0.05} />
        <K title="MQL"                value={mql}       icon={<FaStar />}         color="#06b6d4" change={9}      changeLabel="marketing qualified" spark={SPARK_UP} delay={0.1}  />
        <K title="Conversion Rate"    value={convRate}  icon={<FaChartLine />}    color="#10b981" change={3}      changeLabel="lead-to-client"  spark={SPARK_UP}     delay={0.15} suffix="%" formatValue={false} />
        <K title="Cost Per Lead"      value={cpl}       icon={<FaDollarSign />}   color="#ef4444" prefix="$" change={cpl > 0 ? -8 : 0} changeLabel="vs budget" spark={SPARK_DOWN} delay={0.2} />
        <K title="Campaign ROI"       value={roi}       icon={<FaChartPie />}     color="#f59e0b" suffix="x"  change={roi > 0 ? 12 : 0} changeLabel="return on spend" spark={SPARK_GROWTH} delay={0.25} formatValue={false} />
        <K title="Website Traffic"    value={traffic}   icon={<FaGlobeAsia />}    color="#06b6d4" change={18}     changeLabel="monthly visits"  spark={SPARK_UP}     delay={0.3}  />
        <K title="Email Open Rate"    value={openRate}  icon={<FaEnvelope />}     color="#8b5cf6" suffix="%"  change={openRate > 0 ? 4 : 0} changeLabel="vs industry avg" spark={SPARK_UP} delay={0.35} formatValue={false} />
        <K title="Social Engagement"  value={social}    icon={<FaMousePointer />} color="#10b981" suffix="%"  change={social > 0 ? 7 : 0}  changeLabel="vs last month" spark={SPARK_VOLATILE} delay={0.4} formatValue={false} />
        <K title="Target Achievement" value={tgt}       icon={<FaBullseye />}     color="#f59e0b" suffix="%"  change={tgt > 0 ? 5 : 0}    changeLabel="vs monthly goal" spark={SPARK_UP} delay={0.45} formatValue={false} />
      </KpiGrid>
    )
  }

  // ── Marketing Manager ───────────────────────────────────────
  if (role === 'marketing_manager') {
    const leadsGen  = kpiStats?.leadsGenerated ?? summary.total ?? 0
    const campaigns = kpiStats?.activeCampaigns ?? 0
    const mql       = Math.round((leadsGen || 0) * 0.35)
    const convRate  = kpiStats?.conversionRate ?? summary.conversionRate ?? 0
    const cpl       = kpiStats?.costPerLead ?? 0
    const roi       = kpiStats?.campaignRoi ?? 0
    const traffic   = kpiStats?.websiteTraffic ?? 0
    const openRate  = kpiStats?.emailOpenRate ?? 0
    const social    = kpiStats?.socialEngagement ?? 0
    const tgt       = kpiStats?.targetAchievement ?? targetPct
    return (
      <KpiGrid>
        <K title="Leads Generated"    value={leadsGen}  icon={<FaUserPlus />}     color="#6366f1" change={16}     changeLabel="vs last month"   spark={SPARK_UP}     delay={0}    />
        <K title="Active Campaigns"   value={campaigns} icon={<FaBullhorn />}     color="#8b5cf6" change={campaigns > 0 ? 1 : 0} changeLabel="team managed" spark={SPARK_FLAT} delay={0.05} />
        <K title="MQL"                value={mql}       icon={<FaStar />}         color="#06b6d4" change={11}     changeLabel="marketing qualified" spark={SPARK_UP} delay={0.1}  />
        <K title="Conversion Rate"    value={convRate}  icon={<FaChartLine />}    color="#10b981" change={4}      changeLabel="team conversion" spark={SPARK_UP}     delay={0.15} suffix="%" formatValue={false} />
        <K title="Cost Per Lead"      value={cpl}       icon={<FaDollarSign />}   color="#ef4444" prefix="$" change={cpl > 0 ? -10 : 0} changeLabel="below budget" spark={SPARK_DOWN} delay={0.2} />
        <K title="Campaign ROI"       value={roi}       icon={<FaChartPie />}     color="#f59e0b" suffix="x"  change={roi > 0 ? 15 : 0} changeLabel="return on spend" spark={SPARK_GROWTH} delay={0.25} formatValue={false} />
        <K title="Website Traffic"    value={traffic}   icon={<FaGlobeAsia />}    color="#06b6d4" change={20}     changeLabel="monthly visits"  spark={SPARK_UP}     delay={0.3}  />
        <K title="Email Open Rate"    value={openRate}  icon={<FaEnvelope />}     color="#8b5cf6" suffix="%"  change={openRate > 0 ? 5 : 0} changeLabel="above avg" spark={SPARK_UP} delay={0.35} formatValue={false} />
        <K title="Social Engagement"  value={social}    icon={<FaMousePointer />} color="#10b981" suffix="%"  change={social > 0 ? 9 : 0}  changeLabel="vs last month" spark={SPARK_VOLATILE} delay={0.4} formatValue={false} />
        <K title="Target Achievement" value={tgt}       icon={<FaBullseye />}     color="#f59e0b" suffix="%"  change={tgt > 0 ? 6 : 0}    changeLabel="team goal"  spark={SPARK_UP} delay={0.45} formatValue={false} />
      </KpiGrid>
    )
  }

  // ── Documentation Executive ─────────────────────────────────
  if (role === 'documentation_executive') {
    return (
      <KpiGrid>
        <K title="Active Cases"       value={overview?.taskCount ?? 0}    icon={<FaTasks />}           color="#6366f1" change={3}   changeLabel="in pipeline"    spark={SPARK_FLAT}   delay={0}    />
        <K title="Pending Documents"  value={overview?.taskPending ?? 0}  icon={<FaFolderOpen />}      color="#f59e0b" change={-2}  changeLabel="awaiting verification" spark={SPARK_DOWN} delay={0.05} />
        <K title="Verification Queue" value={pendingFU}                   icon={<FaSearch />}          color="#06b6d4" change={0}   changeLabel="pending files"  spark={SPARK_FLAT}   delay={0.1}  />
        <K title="Missing Documents"  value={overview?.taskPending ?? 0}  icon={<FaExclamationTriangle />} color="#ef4444" change={-4} changeLabel="action required" spark={SPARK_DOWN} delay={0.15} />
        <K title="SLA Compliance"     value={sla}                         icon={<FaShieldAlt />}       color="#10b981" change={2}   changeLabel="vs last month"  spark={SPARK_UP}     delay={0.2}  suffix="%" formatValue={false} />
        <K title="Due Cases"          value={overview?.taskOverdue ?? 0}  icon={<FaFlag />}            color="#ef4444" change={overview?.taskOverdue > 0 ? -3 : 0} changeLabel="overdue" spark={SPARK_DOWN} delay={0.25} />
      </KpiGrid>
    )
  }

  // ── Documentation Manager ───────────────────────────────────
  if (role === 'documentation_manager') {
    return (
      <KpiGrid>
        <K title="Team Size"          value={teamList.length || totalEmployees} icon={<FaUsers />}       color="#6366f1" change={0}  changeLabel="active members" spark={SPARK_FLAT} delay={0}    />
        <K title="Verified Cases"     value={overview?.taskCompleted ?? 0}      icon={<FaCheckCircle />} color="#10b981" change={8}  changeLabel="this month"     spark={SPARK_UP}  delay={0.05} />
        <K title="QC Queue"           value={pendingFU}                         icon={<FaSearch />}      color="#f59e0b" change={-2} changeLabel="pending review" spark={SPARK_DOWN} delay={0.1} />
        <K title="Escalated Cases"    value={overview?.taskOverdue ?? 0}        icon={<FaExclamationTriangle />} color="#ef4444" change={overview?.taskOverdue > 0 ? -5 : 0} changeLabel="overdue" spark={SPARK_DOWN} delay={0.15} />
        <K title="SLA Compliance"     value={sla}                               icon={<FaShieldAlt />}   color="#10b981" change={3}  changeLabel="vs target"      spark={SPARK_UP}  delay={0.2}  suffix="%" formatValue={false} />
        <K title="Avg Turnaround"     value={2.4}                               icon={<FaHistory />}     color="#8b5cf6" suffix="d"  change={-0.3} changeLabel="days faster" spark={SPARK_DOWN} delay={0.25} formatValue={false} />
      </KpiGrid>
    )
  }

  // ── Vertical Manager ────────────────────────────────────────
  if (role === 'vertical_manager') {
    return (
      <KpiGrid>
        <K title="Vertical Revenue"   value={totalRevenue}     icon={<FaDollarSign />}  color="#10b981" prefix="$" change={18} changeLabel="vs last month"   spark={SPARK_GROWTH} delay={0}    />
        <K title="Sales Performance"  value={85}               icon={<FaChartLine />}   color="#6366f1" suffix="%"  change={5}  changeLabel="vs last quarter" spark={SPARK_UP}     delay={0.05} formatValue={false} />
        <K title="Marketing KPI"      value={sla}              icon={<FaBullhorn />}    color="#f59e0b" suffix="%"  change={3}  changeLabel="achievement"     spark={SPARK_UP}     delay={0.1}  formatValue={false} />
        <K title="Documentation SLA"  value={77}               icon={<FaShieldAlt />}   color="#06b6d4" suffix="%"  change={2}  changeLabel="compliance"      spark={SPARK_FLAT}   delay={0.15} formatValue={false} />
        <K title="Team Productivity"  value={taskRate}         icon={<FaUsers />}       color="#8b5cf6" suffix="%"  change={4}  changeLabel="overall score"   spark={SPARK_UP}     delay={0.2}  formatValue={false} />
        <K title="Approval Queue"     value={pendingApprovals} icon={<FaBell />}        color="#ef4444" change={pendingApprovals > 0 ? -3 : 0} changeLabel="pending" spark={SPARK_DOWN} delay={0.25} />
      </KpiGrid>
    )
  }

  // ── Immigration Head ────────────────────────────────────────
  if (role === 'immigration_head') {
    const totalRev    = totalRevenue
    const vertRev     = Math.round(totalRev * 0.75)
    const activeClients = totalEmployees || 0
    const activeCases = overview?.taskPending ?? 0
    const convRate    = summary.conversionRate ?? 0
    const pipelineVal = summary.totalValue ?? 0
    const revGrowth   = 14
    const teamProd    = taskRate
    const tgt         = targetPct
    return (
      <KpiGrid>
        <K title="Total Revenue"      value={totalRev}      icon={<FaDollarSign />}    color="#10b981" prefix="$" change={revGrowth}  changeLabel="vs last month"   spark={SPARK_GROWTH} delay={0}    />
        <K title="Revenue by Vertical" value={vertRev}      icon={<FaChartPie />}      color="#6366f1" prefix="$" change={11}        changeLabel="immigration share" spark={SPARK_UP}   delay={0.05} />
        <K title="Active Clients"     value={activeClients} icon={<FaUsers />}         color="#8b5cf6" change={3}                    changeLabel="in scope"        spark={SPARK_FLAT}   delay={0.1}  />
        <K title="Active Cases"       value={activeCases}   icon={<FaFolderOpen />}    color="#f59e0b" change={activeCases > 0 ? 5 : 0} changeLabel="in pipeline" spark={SPARK_UP}    delay={0.15} />
        <K title="Lead Conversion"    value={convRate}      icon={<FaChartLine />}     color="#06b6d4" suffix="%" change={4}          changeLabel="lead-to-client"  spark={SPARK_UP}    delay={0.2}  formatValue={false} />
        <K title="Pipeline Value"     value={pipelineVal}   icon={<FaBalanceScale />}  color="#8b5cf6" prefix="$" change={20}         changeLabel="total value"     spark={SPARK_GROWTH} delay={0.25} />
        <K title="Revenue Growth"     value={revGrowth}     icon={<FaRocket />}        color="#10b981" suffix="%" change={revGrowth}  changeLabel="month-over-month" spark={SPARK_UP}   delay={0.3}  formatValue={false} />
        <K title="SLA Compliance"     value={sla}           icon={<FaShieldAlt />}     color="#06b6d4" suffix="%" change={2}          changeLabel="vs SLA target"   spark={SPARK_UP}    delay={0.35} formatValue={false} />
        <K title="Team Productivity"  value={teamProd}      icon={<FaUserTie />}       color="#f59e0b" suffix="%" change={4}          changeLabel="avg performance" spark={SPARK_UP}    delay={0.4}  formatValue={false} />
        <K title="Target Achievement" value={tgt}           icon={<FaBullseye />}      color="#ef4444" suffix="%" change={tgt > 0 ? 6 : 0} changeLabel="vs monthly goal" spark={SPARK_UP} delay={0.45} formatValue={false} />
      </KpiGrid>
    )
  }

  // ── Evaluation Head ─────────────────────────────────────────
  if (role === 'evaluation_head') {
    const evalRev    = overview?.businessKpis?.monthlyRevenue ?? 42000
    const activeEval = overview?.taskPending ?? 0
    const profProd   = sla || 88
    const tgt        = targetPct
    return (
      <KpiGrid>
        <K title="Evaluation Revenue" value={evalRev}        icon={<FaDollarSign />}      color="#10b981" prefix="$" change={12}   changeLabel="monthly revenue"   spark={SPARK_GROWTH} delay={0}    />
        <K title="Active Evaluations" value={activeEval}     icon={<FaGraduationCap />}   color="#6366f1" change={activeEval > 0 ? 3 : 0} changeLabel="in progress" spark={SPARK_FLAT} delay={0.05} />
        <K title="Completed Reviews"  value={overview?.taskCompleted ?? 0} icon={<FaCheckCircle />} color="#8b5cf6" change={8} changeLabel="this month"  spark={SPARK_UP}     delay={0.1}  />
        <K title="Pending Reviews"    value={pendingApprovals} icon={<FaClipboardCheck />} color="#f59e0b" change={pendingApprovals > 0 ? -2 : 0} changeLabel="awaiting" spark={SPARK_DOWN} delay={0.15} />
        <K title="Professor Productivity" value={profProd}   icon={<FaStar />}            color="#06b6d4" suffix="%" change={3} changeLabel="avg scorecard"   spark={SPARK_UP}     delay={0.2}  formatValue={false} />
        <K title="SLA Compliance"     value={sla}            icon={<FaShieldAlt />}       color="#10b981" suffix="%" change={2} changeLabel="vs SLA target"   spark={SPARK_UP}     delay={0.25} formatValue={false} />
        <K title="Overdue Cases"      value={overview?.taskOverdue ?? 0} icon={<FaExclamationTriangle />} color="#ef4444" change={overview?.taskOverdue > 0 ? -4 : 0} changeLabel="critical" spark={SPARK_DOWN} delay={0.3} />
        <K title="QC Score"           value={92}             icon={<FaFlag />}            color="#8b5cf6" suffix="%" change={1} changeLabel="quality index"   spark={SPARK_FLAT}   delay={0.35} formatValue={false} />
        <K title="Team Productivity"  value={taskRate}       icon={<FaUsers />}           color="#f59e0b" suffix="%" change={5} changeLabel="task completion"  spark={SPARK_UP}     delay={0.4}  formatValue={false} />
        <K title="Target Achievement" value={tgt}            icon={<FaBullseye />}        color="#06b6d4" suffix="%" change={tgt > 0 ? 6 : 0} changeLabel="vs goal" spark={SPARK_UP} delay={0.45} formatValue={false} />
      </KpiGrid>
    )
  }

  // ── HR Manager ──────────────────────────────────────────────
  if (role === 'hr_manager') {
    return (
      <KpiGrid>
        <K title="Total Employees"    value={totalEmployees}  icon={<FaUsers />}           color="#6366f1" change={2}   changeLabel="active staff"       spark={SPARK_FLAT}   delay={0}    />
        <K title="Attendance Rate"    value={96.4}            icon={<FaCheckCircle />}     color="#10b981" suffix="%" change={0.4} changeLabel="monthly avg"  spark={SPARK_UP}     delay={0.05} formatValue={false} />
        <K title="New Joiners"        value={Math.round(totalEmployees * 0.08) || 1} icon={<FaUserPlus />} color="#06b6d4" change={1} changeLabel="this month" spark={SPARK_UP} delay={0.1} />
        <K title="Open Positions"     value={openPositions}   icon={<FaBriefcase />}       color="#f59e0b" change={0}   changeLabel="recruiting"         spark={SPARK_FLAT}   delay={0.15} />
        <K title="Recruitment Tasks"  value={tasks?.filter(t => String(t.title).toLowerCase().includes('interview')).length ?? 0} icon={<FaClipboardCheck />} color="#8b5cf6" change={3} changeLabel="interviews scheduled" spark={SPARK_UP} delay={0.2} />
        <K title="Attrition Rate"     value={1.8}             icon={<FaExclamationTriangle />} color="#ef4444" suffix="%" change={-0.2} changeLabel="annual avg" spark={SPARK_DOWN} delay={0.25} formatValue={false} />
      </KpiGrid>
    )
  }

  // ── Business Owner ──────────────────────────────────────────
  if (role === 'business_owner') {
    return (
      <KpiGrid>
        <K title="Total Revenue"      value={totalRevenue}                        icon={<FaDollarSign />}  color="#10b981" prefix="$" change={20}  changeLabel="vs last month"   spark={SPARK_GROWTH} delay={0}    />
        <K title="Revenue by Business" value={totalRevenue}                       icon={<FaBuilding />}    color="#6366f1" prefix="$" change={18}  changeLabel="consolidated"    spark={SPARK_UP}     delay={0.05} />
        <K title="Revenue by Vertical" value={Math.round(totalRevenue * 0.8)}     icon={<FaChartPie />}    color="#8b5cf6" prefix="$" change={15}  changeLabel="immigration share" spark={SPARK_UP}   delay={0.1}  />
        <K title="Active Employees"   value={totalEmployees}                      icon={<FaUsers />}       color="#06b6d4" change={2}              changeLabel="active staff"    spark={SPARK_FLAT}   delay={0.15} />
        <K title="Productivity Score" value={sla}                                 icon={<FaChartLine />}   color="#10b981" suffix="%" change={4}   changeLabel="avg performance" spark={SPARK_UP}     delay={0.2}  formatValue={false} />
        <K title="KPI Achievement"    value={targetPct}                           icon={<FaBullseye />}    color="#f59e0b" suffix="%" change={targetPct > 0 ? 6 : 0} changeLabel="avg target" spark={SPARK_UP} delay={0.25} formatValue={false} />
      </KpiGrid>
    )
  }

  // ── Super Admin ─────────────────────────────────────────────
  if (role === 'super_admin') {
    return (
      <KpiGrid>
        <K title="Active Users"       value={totalEmployees}          icon={<FaUsers />}           color="#10b981" change={3}  changeLabel="employees active"  spark={SPARK_FLAT}   delay={0}    />
        <K title="Organizations"      value={overview?.businessCount ?? 2} icon={<FaBuilding />}   color="#6366f1" change={0}  changeLabel="businesses"        spark={SPARK_FLAT}   delay={0.05} />
        <K title="System Health"      value={100}                     icon={<FaHeartbeat />}       color="#10b981" suffix="%" change={0} changeLabel="all services up" spark={SPARK_FLAT} delay={0.1}  formatValue={false} />
        <K title="API Uptime"         value={99.9}                    icon={<FaDatabase />}        color="#06b6d4" suffix="%" change={0} changeLabel="24h response"  spark={SPARK_FLAT} delay={0.15} formatValue={false} />
        <K title="Failed Logins"      value={2}                       icon={<FaExclamationTriangle />} color="#ef4444" change={-1} changeLabel="security alerts" spark={SPARK_DOWN} delay={0.2} />
        <K title="Audit Events"       value={activities?.length ?? 0} icon={<FaListAlt />}        color="#f59e0b" change={5}  changeLabel="recorded today"    spark={SPARK_UP}     delay={0.25} />
      </KpiGrid>
    )
  }

  return null
}

// 2. Custom sub-widgets implemented for dynamic loading
function LeadPipelineWidget() {
  const { pipeline } = useSelector(s => s.workspace || {})
  const pipelineStages = pipeline?.pipeline || []
  return (
    <SectionCard title="Lead Pipeline by Stage" subtitle="Funnel metrics" delay={0.2} className="h-[420px] flex flex-col">
      {pipelineStages.length > 0 ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineStages} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-neutral-400 text-center py-8">No pipeline data available.</p>
      )}
    </SectionCard>
  )
}

function HotLeadsWidget() {
  const { leads } = useSelector(s => s.workspace || {})
  const hotLeads = leads?.leads?.filter(l => l.status === 'QUALIFIED') || []
  return (
    <SectionCard title="Hot Leads (Qualified)" subtitle="High intent prospects" delay={0.2} className="h-[420px] flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
        {hotLeads.length > 0 ? (
          hotLeads.slice(0, 6).map(lead => (
            <div key={lead.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 truncate">{lead.name}</p>
                <p className="text-[10px] text-neutral-400">{lead.email || lead.phone}</p>
              </div>
              <span className="text-xs font-bold text-emerald-600">${Number(lead.estimatedValue || 0).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-neutral-400 text-center py-4">No hot leads currently.</p>
        )}
      </div>
    </SectionCard>
  )
}

function TodayFollowupsWidget() {
  const { followUps } = useSelector(s => s.workspace || {})
  const todayTasks = followUps?.tasks || []
  return (
    <SectionCard title="Today's Follow Ups" subtitle="Due interactions" delay={0.2} className="h-[420px] flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
        {todayTasks.length > 0 ? (
          todayTasks.slice(0, 6).map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 truncate">{task.title}</p>
                <p className="text-[10px] text-neutral-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                task.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}>{task.priority || 'medium'}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-neutral-400 text-center py-4">No follow-ups scheduled today.</p>
        )}
      </div>
    </SectionCard>
  )
}

function WinLostWidget() {
  const { leads } = useSelector(s => s.workspace || {})
  const summary = leads?.summary || {}
  const data = [
    { name: 'Won', value: summary.converted ?? 0, color: '#10b981' },
    { name: 'Lost', value: summary.lost ?? 0, color: '#ef4444' }
  ]
  return (
    <SectionCard title="Win / Lost Ratio" subtitle="Deal outcomes ratio" delay={0.2} className="h-[420px] flex flex-col">
      {summary.converted || summary.lost ? (
        <div className="h-44 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center font-bold text-neutral-700 pr-4">
            <p className="text-lg text-emerald-600">{summary.converted ?? 0} Won</p>
            <p className="text-lg text-red-500">{summary.lost ?? 0} Lost</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-400 text-center py-6">No closed deals to calculate ratio.</p>
      )}
    </SectionCard>
  )
}

function SourceAnalyticsWidget() {
  const { leads } = useSelector(s => s.workspace || {})
  const leadSources = leads?.leads?.reduce((acc, lead) => {
    const src = lead.source || 'Direct'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {}) || {}
  const data = Object.entries(leadSources).map(([name, value]) => ({ name, value }))
  return (
    <SectionCard title="Lead Source Analytics" subtitle="Marketing attribution" delay={0.2} className="h-[420px] flex flex-col">
      {data.length > 0 ? (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name }) => name} fontSize={10}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-neutral-400 text-center py-6">No source analytics available.</p>
      )}
    </SectionCard>
  )
}

function TeamLeaderboardWidget() {
  const { teamLeaderboard } = useSelector(s => s.workspace || {})
  const leaderboard = Array.isArray(teamLeaderboard) ? teamLeaderboard : []
  return (
    <SectionCard title="Team Leaderboard" subtitle="Productivity rankings" delay={0.2} className="h-[420px] flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
        {leaderboard.length > 0 ? (
          leaderboard.slice(0, 6).map((member, i) => (
            <div key={member.id || i} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3a' : '#6366f1' }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate">{member.name}</p>
                <p className="text-[10px] text-neutral-400 truncate">{member.designation}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-primary-600">{member.score}%</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-neutral-400 text-center py-6">No team performance rankings.</p>
        )}
      </div>
    </SectionCard>
  )
}

function DepartmentHealthWidget() {
  return (
    <SectionCard title="Department Health" subtitle="Task completion SLA" delay={0.2} className="h-[420px] flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {[
          { dept: 'Sales', health: 85, color: '#6366f1' },
          { dept: 'Marketing', health: 91, color: '#10b981' },
          { dept: 'Documentation', health: 77, color: '#f59e0b' }
        ].map(d => (
          <div key={d.dept} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{d.dept}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.health}%`, backgroundColor: d.color }} />
              </div>
              <span className="text-xs font-bold" style={{ color: d.color }}>{d.health}%</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function BusinessHealthDetailsWidget() {
  return (
    <SectionCard title="Business Health Score" subtitle="Core operations overview" delay={0.2} className="h-[420px] flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {[
          { dept: 'Immigration', health: 92, color: '#10b981' },
          { dept: 'Evaluation', health: 88, color: '#6366f1' },
          { dept: 'HR', health: 80, color: '#f59e0b' },
          { dept: 'IT', health: 85, color: '#ef4444' }
        ].map(d => (
          <div key={d.dept} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{d.dept}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.health}%`, backgroundColor: d.color }} />
              </div>
              <span className="text-xs font-bold" style={{ color: d.color }}>{d.health}%</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function SystemStatusWidget() {
  return (
    <div className="rounded-2xl p-5 text-white bg-gradient-to-r from-emerald-600 to-teal-600 w-full flex items-center justify-between col-span-full">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">System Status</p>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FaCheckCircle /> All Systems Operational
        </h2>
        <p className="text-sm opacity-70 mt-1">embtel-erp-server</p>
      </div>
      <Link to="/admin/org-explorer" className="text-xs font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors">
        Open Org Explorer →
      </Link>
    </div>
  )
}

// Role-aware Sales Target summary — reads the live target summary from the
// salesTargets slice and renders the cards specified for each role.
function TargetSummaryWidget({ role }) {
  const { summary, loading, error } = useSelector((s) => s.salesTargets || {})
  const heading = 'Target Performance'

  if (error) {
    return <SectionCard title={heading} subtitle="Sales targets" className="col-span-full">
      <p className="text-sm text-red-500">Failed to load targets: {String(error)}</p>
    </SectionCard>
  }
  if (loading && !summary) {
    return <div className="col-span-full"><WidgetSkeleton /></div>
  }
  if (!summary || summary.totals?.count === 0) {
    return <SectionCard title={heading} subtitle="Sales targets" className="col-span-full">
      <p className="text-sm text-neutral-400">No targets assigned yet.</p>
    </SectionCard>
  }

  const t = summary.totals || {}
  const personal = summary.personal || {}
  const conv = summary.conversion || {}
  const rev = summary.revenue || {}
  const remaining = Math.max(0, (t.count ?? 0) - (t.completed ?? 0))
  const topPerformer = summary.ranking?.[0]

  let cards
  if (role === 'sales_executive' || role === 'sales_intern') {
    cards = [
      { title: 'Personal Targets', value: personal.count ?? 0, icon: <FaBullseye />, color: '#6366f1' },
      { title: 'Current Achievement', value: personal.progressPct ?? 0, suffix: '%', icon: <FaCheckCircle />, color: '#10b981', formatValue: false },
      { title: 'Remaining Targets', value: Math.max(0, (personal.count ?? 0) - 0), icon: <FaFlag />, color: '#f59e0b' },
      { title: 'Monthly Progress', value: personal.progressPct ?? 0, suffix: '%', icon: <FaChartLine />, color: '#8b5cf6', formatValue: false },
      { title: 'Conversion Progress', value: conv.progressPct ?? 0, suffix: '%', icon: <FaHandshake />, color: '#06b6d4', formatValue: false },
    ]
  } else if (role === 'sales_head') {
    cards = [
      { title: 'Assigned Targets', value: personal.count ?? 0, icon: <FaBullseye />, color: '#6366f1' },
      { title: 'Achievement', value: personal.progressPct ?? 0, suffix: '%', icon: <FaCheckCircle />, color: '#10b981', formatValue: false },
      { title: 'Remaining', value: remaining, icon: <FaFlag />, color: '#f59e0b' },
      { title: 'Team Performance', value: t.avgProgressPct ?? 0, suffix: '%', icon: <FaUsers />, color: '#8b5cf6', formatValue: false },
      { title: 'Conversion Achievement', value: conv.progressPct ?? 0, suffix: '%', icon: <FaHandshake />, color: '#06b6d4', formatValue: false },
      { title: 'Revenue Achievement', value: rev.progressPct ?? 0, suffix: '%', icon: <FaDollarSign />, color: '#ef4444', formatValue: false },
    ]
  } else {
    // vertical_manager (and higher)
    cards = [
      { title: 'Total Targets Assigned', value: t.count ?? 0, icon: <FaBullseye />, color: '#6366f1' },
      { title: 'Sales Head Performance', value: t.avgProgressPct ?? 0, suffix: '%', icon: <FaUsers />, color: '#8b5cf6', formatValue: false },
      { title: 'Department Achievement', value: t.avgProgressPct ?? 0, suffix: '%', icon: <FaChartLine />, color: '#10b981', formatValue: false },
      { title: 'Revenue Achievement', value: rev.progressPct ?? 0, suffix: '%', icon: <FaDollarSign />, color: '#ef4444', formatValue: false },
      { title: 'Conversion Achievement', value: conv.progressPct ?? 0, suffix: '%', icon: <FaHandshake />, color: '#06b6d4', formatValue: false },
      { title: 'Team Ranking', value: topPerformer?.progressPct ?? 0, suffix: '%', changeLabel: topPerformer?.name, icon: <FaTrophy />, color: '#f59e0b', formatValue: false },
    ]
  }

  return (
    <div className="col-span-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{heading}</h3>
        <Link to="/sales/targets" className="text-xs font-semibold text-primary-600 hover:underline">View all →</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => <StatCard key={c.title} {...c} spark={null} delay={i * 0.05} />)}
      </div>
    </div>
  )
}

// Registry map associating widget keys to React components
export const WIDGET_REGISTRY = {
  kpi_cards: { title: 'KPI Metrics', component: KpiCardsWidget },
  calendar: { title: 'Interactive Calendar', component: CalendarWidget },
  activities: { title: 'Recent Activities', component: ActivityTimeline },
  notifications: { title: 'Notifications', component: NotificationPanel },
  quick_actions: { title: 'Quick Actions', component: QuickActions },
  task_summary: { title: 'Task Summary', component: TaskWidget },
  performance: { title: 'Performance Metrics', component: PerformanceChart },
  upcoming_events: { title: 'Upcoming Events', component: UpcomingEventsWidget },
  
  // Sales specific
  pipeline: { title: 'Lead Pipeline', component: LeadPipelineWidget },
  hot_leads: { title: 'Hot Leads', component: HotLeadsWidget },
  today_followups: { title: 'Today\'s Follow Ups', component: TodayFollowupsWidget },
  win_lost: { title: 'Win/Lost Ratio', component: WinLostWidget },
  source_analytics: { title: 'Lead Sources', component: SourceAnalyticsWidget },
  leaderboard: { title: 'Leaderboard', component: TeamLeaderboardWidget },
  
  // Marketing / Management specific
  traffic_sources: { title: 'Traffic Sources', component: SourceAnalyticsWidget },
  funnel_analytics: { title: 'Lead Funnel Stages', component: SourceAnalyticsWidget },
  dept_health: { title: 'Department Health', component: DepartmentHealthWidget },
  business_health_details: { title: 'Business Health Details', component: BusinessHealthDetailsWidget },
  system_status: { title: 'System Status', component: SystemStatusWidget },

  // Super Admin specific — alias to existing widgets so they never drop
  audit_logs: { title: 'Audit Logs', component: ActivityTimeline },
  business_stats: { title: 'Business Statistics', component: BusinessHealthDetailsWidget },

  // Sales Head extras — alias to nearest matching widgets
  assignment_queue: { title: 'Assignment Queue', component: HotLeadsWidget },
  kpi_score: { title: 'KPI Score', component: PerformanceChart },
  revenue_trend: { title: 'Revenue Trend', component: PerformanceChart },
  compliance: { title: 'Compliance', component: TaskWidget },

  // Marketing Executive extras
  campaign_activities: { title: 'Campaign Activities', component: ActivityTimeline },

  // Rich dashboard components
  pipeline_board:    { title: 'Lead Pipeline',       component: PipelineBoard    },
  follow_ups:        { title: "Today's Follow Ups",   component: FollowUpsTable   },
  meetings:          { title: 'Upcoming Meetings',    component: MeetingCards     },
  opportunity_table: { title: 'Top Opportunities',    component: OpportunityTable },
  customer_insights: { title: 'Customer Insights',   component: CustomerInsights },
  sales_target:      { title: 'Sales Target',         component: TargetProgress   },
  target_summary:    { title: 'Target Performance',   component: TargetSummaryWidget },
}
