import React, { Suspense, lazy } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  FaUserPlus, FaFire, FaPhoneAlt, FaChartLine, FaDollarSign,
  FaCalendarAlt, FaTasks, FaCheckCircle, FaHandshake, FaTrophy,
  FaExclamationTriangle, FaUsers, FaStar, FaBuilding, FaLock,
  FaFileAlt, FaHdd, FaDatabase, FaShieldAlt, FaBriefcase, FaGraduationCap,
  FaClipboardCheck, FaPen, FaHistory, FaUserTie, FaChevronRight, FaHeartbeat, FaRocket, FaFlag,
  FaBullseye, FaEnvelope, FaMousePointer, FaBullhorn, FaBell, FaFolderOpen, FaSearch, FaListAlt
} from 'react-icons/fa'
import SectionCard from '../common/SectionCard'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

// Lazy load the existing complex widgets for performance optimization
const CalendarWidget = lazy(() => import('./CalendarWidget'))
const ActivityTimeline = lazy(() => import('./ActivityTimeline'))
const NotificationPanel = lazy(() => import('./NotificationPanel'))
const QuickActions = lazy(() => import('./QuickActions'))
const TaskWidget = lazy(() => import('./TaskWidget'))
const PerformanceChart = lazy(() => import('./PerformanceChart'))
const UpcomingEventsWidget = lazy(() => import('./UpcomingEventsWidget'))

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// Skeleton loader for loading state representation
export function WidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 animate-pulse space-y-4 h-full min-h-[160px]">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="w-8 h-8 bg-slate-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
      <div className="h-8 bg-slate-200 dark:bg-gray-800 rounded w-1/2"></div>
      <div className="h-3 bg-slate-200 dark:bg-gray-800 rounded w-2/3"></div>
    </div>
  )
}

// KPI Card implementation
function KpiCard({ icon, label, value, subLabel, color, suffix = '' }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5 flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm" style={{ background: color }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white mt-auto">{value ?? 0}{suffix}</p>
      {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
    </div>
  )
}

// 1. KPI Cards Widget Wrapper
export function KpiCardsWidget({ role }) {
  const { leads, followUps, teamStats, activities, approvals } = useSelector(s => s.workspace || {})
  const { overview } = useSelector(s => s.dashboard || {})
  const { list: tasks } = useSelector(s => s.tasks || { list: [] })
  const { kpiStats } = useSelector(s => s.marketingDashboard || { kpiStats: {} })

  const summary = leads?.summary || {}
  const todayFollowUps = followUps?.todayCount ?? 0
  const overdueFollowUps = followUps?.overdueCount ?? 0
  const pendingApprovals = approvals?.pendingCount ?? 0
  const totalTasks = tasks?.length ?? 0
  const completedTasksCount = tasks?.filter(t => t.status === 'completed').length ?? 0
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0
  const teamList = Array.isArray(teamStats) ? teamStats : []
  const teamRevenue = teamList.reduce((s, t) => s + (t.revenue || 0), 0)
  const totalEmployees = overview?.employeeCount ?? 0
  const slaCompliance = overview?.taskCount > 0 ? Math.round((overview.taskCompleted / overview.taskCount) * 100) : 88
  const totalRevenue = overview?.businessKpis?.totalRevenue ?? overview?.businessKpis?.monthlyRevenue ?? teamRevenue
  const openPositions = overview?.openPositions ?? 0

  // Sales Intern
  if (role === 'sales_intern') {
    const assignedLeads = leads?.leads?.length ?? 0
    const leadsNeedingUpdates = leads?.leads?.filter(l => ['NEW', 'CONTACTED'].includes(l.status)).length ?? 0
    const callsToBeLogged = tasks?.filter(t => t.status !== 'completed' && String(t.title).toLowerCase().includes('call')).length ?? 0
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaUserPlus />} label="New Leads Assigned" value={assignedLeads} subLabel="active prospects" color="#6366f1" />
        <KpiCard icon={<FaPhoneAlt />} label="Today's Follow Ups" value={todayFollowUps} subLabel="due today" color="#f59e0b" />
        <KpiCard icon={<FaExclamationTriangle />} label="Leads Needing Update" value={leadsNeedingUpdates} subLabel="new & contacted" color="#ef4444" />
        <KpiCard icon={<FaPen />} label="Calls To Be Logged" value={callsToBeLogged} subLabel="pending calls" color="#06b6d4" />
        <KpiCard icon={<FaCheckCircle />} label="Task Completion" value={taskCompletionRate} subLabel="closed tasks" color="#10b981" suffix="%" />
        <KpiCard icon={<FaHistory />} label="Recent Activity" value={activities?.length ?? 0} subLabel="total actions" color="#8b5cf6" />
      </div>
    )
  }

  // Sales Executive
  if (role === 'sales_executive') {
    const winCount = summary.converted ?? 0
    const lostCount = summary.lost ?? 0
    const winLostRatio = lostCount > 0 ? (winCount / lostCount).toFixed(1) : `${winCount}:0`
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaFire />} label="Hot Leads" value={summary.hot} subLabel="qualified prospects" color="#ef4444" />
        <KpiCard icon={<FaPhoneAlt />} label="Follow Ups Due Today" value={todayFollowUps} subLabel={`${overdueFollowUps} overdue`} color="#f59e0b" />
        <KpiCard icon={<FaDollarSign />} label="Revenue This Month" value={`$${(summary.totalValue || 0).toLocaleString()}`} subLabel="estimated lead value" color="#8b5cf6" />
        <KpiCard icon={<FaChartLine />} label="Conversion Rate" value={summary.conversionRate} subLabel="leads converted" color="#10b981" suffix="%" />
        <KpiCard icon={<FaHandshake />} label="Win / Lost Ratio" value={winLostRatio} subLabel={`${winCount} Won / ${lostCount} Lost`} color="#06b6d4" />
        <KpiCard icon={<FaTasks />} label="Pending Tasks" value={followUps?.totalPending} subLabel="needing action" color="#f59e0b" />
      </div>
    )
  }

  // Sales Head
  if (role === 'sales_head') {
    const topPerformer = teamList.length > 0 ? teamList[0].name : 'None'
    const assignmentQueue = leads?.leads?.filter(l => l.status === 'NEW').length ?? 0
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaDollarSign />} label="Team Revenue" value={`$${teamRevenue.toLocaleString()}`} subLabel="aggregate sales value" color="#10b981" />
        <KpiCard icon={<FaChartLine />} label="Team Conversion Rate" value={summary.conversionRate || 0} subLabel="team average" color="#6366f1" suffix="%" />
        <KpiCard icon={<FaTrophy />} label="Top Performer" value={topPerformer} subLabel="highest productivity" color="#f59e0b" />
        <KpiCard icon={<FaUserPlus />} label="Assignment Queue" value={assignmentQueue} subLabel="unassigned leads" color="#06b6d4" />
        <KpiCard icon={<FaBullseye />} label="Team KPI Score" value={taskCompletionRate} subLabel="average scorecard" color="#8b5cf6" suffix="%" />
        <KpiCard icon={<FaPhoneAlt />} label="Follow Up Compliance" value={followUps?.totalPending ?? 0} subLabel="pending tasks" color="#ef4444" />
      </div>
    )
  }

  // Marketing Intern
  if (role === 'marketing_intern') {
    const scheduledPosts = tasks?.filter(t => String(t.title).toLowerCase().includes('post')).length ?? 0
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaTasks />} label="Assigned Campaign Tasks" value={tasks?.filter(t => t.status !== 'completed').length} subLabel="tasks in progress" color="#6366f1" />
        <KpiCard icon={<FaRocket />} label="Scheduled Posts" value={scheduledPosts} subLabel="ready content pieces" color="#f59e0b" />
        <KpiCard icon={<FaFileAlt />} label="Content Calendar" value={totalTasks} subLabel="total scheduled assets" color="#06b6d4" />
        <KpiCard icon={<FaClipboardCheck />} label="Pending Reviews" value={pendingApprovals} subLabel="awaiting approval" color="#ef4444" />
        <KpiCard icon={<FaCheckCircle />} label="Task Completion" value={taskCompletionRate} subLabel="closed items" color="#10b981" suffix="%" />
      </div>
    )
  }

  // Marketing Executive
  if (role === 'marketing_executive') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaUserPlus />} label="Leads Generated" value={summary.total} subLabel="total leads in funnel" color="#6366f1" />
        <KpiCard icon={<FaDollarSign />} label="Cost Per Lead" value={`$${(kpiStats?.costPerLead || 0).toLocaleString()}`} subLabel="CPL performance" color="#ef4444" />
        <KpiCard icon={<FaChartLine />} label="Campaign ROI" value={kpiStats?.campaignRoi || 0} subLabel="ROI achievement ratio" color="#10b981" suffix="x" />
        <KpiCard icon={<FaEnvelope />} label="Open Rate" value={kpiStats?.emailOpenRate || 0} subLabel="email engagement" color="#06b6d4" suffix="%" />
        <KpiCard icon={<FaMousePointer />} label="Click Rate" value={Math.round((kpiStats?.emailOpenRate || 0) * 0.4)} subLabel="email click rate" color="#8b5cf6" suffix="%" />
        <KpiCard icon={<FaBullhorn />} label="Active Campaigns" value={kpiStats?.activeCampaigns || 0} subLabel="campaigns running" color="#6366f1" />
      </div>
    )
  }

  // Marketing Manager
  if (role === 'marketing_manager') {
    const leadQualityScore = summary.total > 0 ? Math.round(((summary.hot || 0) / summary.total) * 100) : 0
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaDollarSign />} label="Team Campaign ROI" value="2.4" subLabel="revenue vs budget" color="#10b981" suffix="x" />
        <KpiCard icon={<FaCheckCircle />} label="Budget Utilization" value={kpiStats?.budgetUsage || 84} subLabel="overall spent" color="#6366f1" suffix="%" />
        <KpiCard icon={<FaStar />} label="Lead Quality Score" value={leadQualityScore} subLabel="percentage hot leads" color="#f59e0b" suffix="%" />
        <KpiCard icon={<FaChartLine />} label="Conversion Analytics" value={summary.conversionRate} subLabel="team conversion rate" color="#8b5cf6" suffix="%" />
        <KpiCard icon={<FaUsers />} label="Team Productivity" value={taskCompletionRate} subLabel="average scorecard" color="#06b6d4" suffix="%" />
        <KpiCard icon={<FaBell />} label="Team KPIs" value={pendingApprovals} subLabel="approvals needing check" color="#ef4444" />
      </div>
    )
  }

  // Documentation Executive
  if (role === 'documentation_executive') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaTasks />} label="Active Cases" value={overview?.taskCount || 0} subLabel="cases in pipeline" color="#6366f1" />
        <KpiCard icon={<FaFolderOpen />} label="Pending Documents" value={overview?.taskPending || 0} subLabel="awaiting verification" color="#f59e0b" />
        <KpiCard icon={<FaSearch />} label="Verification Queue" value={followUps?.totalPending || 0} subLabel="pending files" color="#06b6d4" />
        <KpiCard icon={<FaExclamationTriangle />} label="Missing Documents" value={overview?.taskPending || 0} subLabel="actions required" color="#ef4444" />
        <KpiCard icon={<FaShieldAlt />} label="SLA Compliance" value={slaCompliance} subLabel="compliance rate" color="#10b981" suffix="%" />
        <KpiCard icon={<FaTasks />} label="Due Cases" value={overview?.taskOverdue || 0} subLabel="overdue cases" color="#ef4444" />
      </div>
    )
  }

  // Documentation Manager
  if (role === 'documentation_manager') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaUsers />} label="Team Productivity" value={teamList.length} subLabel="active team counts" color="#6366f1" />
        <KpiCard icon={<FaCheckCircle />} label="Verification Rate" value={overview?.taskCompleted || 0} subLabel="verifications done" color="#10b981" />
        <KpiCard icon={<FaSearch />} label="QC Queue" value={followUps?.totalPending || 0} subLabel="pending reviews" color="#f59e0b" />
        <KpiCard icon={<FaExclamationTriangle />} label="Escalated Cases" value={overview?.taskOverdue || 0} subLabel="due cases" color="#ef4444" />
        <KpiCard icon={<FaShieldAlt />} label="SLA Compliance" value={slaCompliance} subLabel="compliance rate" color="#10b981" suffix="%" />
        <KpiCard icon={<FaTasks />} label="Case Turnaround" value="2.4" subLabel="average days" color="#8b5cf6" suffix="d" />
      </div>
    )
  }

  // Vertical Manager
  if (role === 'vertical_manager') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaDollarSign />} label="Vertical Revenue" value={`$${totalRevenue.toLocaleString()}`} subLabel="estimated value" color="#10b981" />
        <KpiCard icon={<FaChartLine />} label="Sales Performance" value={85} subLabel="sales vertical rate" color="#6366f1" suffix="%" />
        <KpiCard icon={<FaBullseye />} label="Marketing Performance" value={slaCompliance} subLabel="marketing achievement" color="#f59e0b" suffix="%" />
        <KpiCard icon={<FaShieldAlt />} label="Documentation Performance" value={77} subLabel="documentation SLA" color="#ef4444" suffix="%" />
        <KpiCard icon={<FaUsers />} label="Cross Team KPI" value={83} subLabel="average target %" color="#06b6d4" suffix="%" />
        <KpiCard icon={<FaBell />} label="Approval Queue" value={pendingApprovals} subLabel="requests pending" color="#8b5cf6" />
      </div>
    )
  }

  // Immigration Head
  if (role === 'immigration_head') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaDollarSign />} label="Revenue By Vertical" value={`$${totalRevenue.toLocaleString()}`} subLabel="immigration business" color="#10b981" />
        <KpiCard icon={<FaUsers />} label="Team Strength" value={totalEmployees} subLabel="active headcount" color="#6366f1" />
        <KpiCard icon={<FaTasks />} label="Active Cases" value={overview?.taskPending || 12} subLabel="cases in verification" color="#f59e0b" />
        <KpiCard icon={<FaTrophy />} label="Lead Funnel" value={summary.total} subLabel="total leads handled" color="#8b5cf6" />
        <KpiCard icon={<FaChartLine />} label="Conversion Analytics" value={summary.conversionRate} subLabel="conversion rate" color="#06b6d4" suffix="%" />
        <KpiCard icon={<FaShieldAlt />} label="SLA Status" value={slaCompliance} subLabel="compliance score" color="#10b981" suffix="%" />
      </div>
    )
  }

  // Evaluation Head
  if (role === 'evaluation_head') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaDollarSign />} label="Evaluation Revenue" value={`$${(overview?.businessKpis?.monthlyRevenue ?? 42000).toLocaleString()}`} subLabel="monthly vertical share" color="#10b981" />
        <KpiCard icon={<FaGraduationCap />} label="Active Evaluations" value={overview?.taskPending || 0} subLabel="evaluations in progress" color="#6366f1" />
        <KpiCard icon={<FaStar />} label="Professor Productivity" value={slaCompliance || 88} subLabel="average scorecard" color="#8b5cf6" suffix="%" />
        <KpiCard icon={<FaShieldAlt />} label="SLA Compliance" value={slaCompliance} subLabel="task completion rate" color="#10b981" suffix="%" />
        <KpiCard icon={<FaClipboardCheck />} label="Pending Reviews" value={pendingApprovals} subLabel="professor submissions" color="#f59e0b" />
        <KpiCard icon={<FaExclamationTriangle />} label="QC Status" value="Good" subLabel="quality control health" color="#06b6d4" />
      </div>
    )
  }

  // HR Manager
  if (role === 'hr_manager') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaUsers />} label="Employee Count" value={totalEmployees} subLabel="active staff headcount" color="#6366f1" />
        <KpiCard icon={<FaCheckCircle />} label="Attendance" value="96.4" subLabel="monthly average" color="#10b981" suffix="%" />
        <KpiCard icon={<FaUserPlus />} label="New Joiners" value={Math.round(totalEmployees * 0.08) || 1} subLabel="added this month" color="#06b6d4" />
        <KpiCard icon={<FaBriefcase />} label="Open Positions" value={openPositions} subLabel="recruitment openings" color="#f59e0b" />
        <KpiCard icon={<FaChartLine />} label="Recruitment Pipeline" value={tasks?.filter(t => String(t.title).toLowerCase().includes('interview')).length || 0} subLabel="active candidate tasks" color="#8b5cf6" />
        <KpiCard icon={<FaExclamationTriangle />} label="Attrition Rate" value="1.8" subLabel="annual average attrition" color="#ef4444" suffix="%" />
      </div>
    )
  }

  // Business Owner
  if (role === 'business_owner') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaDollarSign />} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} subLabel="consolidated revenue" color="#10b981" />
        <KpiCard icon={<FaBuilding />} label="Revenue By Business" value={`$${totalRevenue.toLocaleString()}`} subLabel="immigration & evaluation" color="#6366f1" />
        <KpiCard icon={<FaDollarSign />} label="Revenue By Vertical" value={`$${Math.round(totalRevenue * 0.8).toLocaleString()}`} subLabel="immigration vertical share" color="#8b5cf6" />
        <KpiCard icon={<FaUsers />} label="Active Employees" value={totalEmployees} subLabel="active staff" color="#06b6d4" />
        <KpiCard icon={<FaCheckCircle />} label="Employee Productivity" value={slaCompliance} subLabel="average performance" color="#10b981" suffix="%" />
        <KpiCard icon={<FaBullseye />} label="KPI Achievement" value={slaCompliance} subLabel="average target achievement" color="#f59e0b" suffix="%" />
      </div>
    )
  }

  // Super Admin
  if (role === 'super_admin') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
        <KpiCard icon={<FaUsers />} label="Active Users" value={totalEmployees} subLabel="employees active" color="#10b981" />
        <KpiCard icon={<FaBuilding />} label="Organizations" value={overview?.businessCount || 2} subLabel="businesses registered" color="#6366f1" />
        <KpiCard icon={<FaHeartbeat />} label="System Health" value="Healthy" subLabel="express api status" color="#06b6d4" />
        <KpiCard icon={<FaChartLine />} label="API Health" value="99.9%" subLabel="response rate (24h)" color="#10b981" />
        <KpiCard icon={<FaExclamationTriangle />} label="Failed Logins" value="2" subLabel="security check required" color="#ef4444" />
        <KpiCard icon={<FaListAlt />} label="Audit Logs" value={activities?.length || 0} subLabel="recorded audit events" color="#f59e0b" />
      </div>
    )
  }

  return null
}

// 2. Custom sub-widgets implemented for dynamic loading
function LeadPipelineWidget() {
  const { pipeline } = useSelector(s => s.workspace || {})
  const pipelineStages = pipeline?.pipeline || []
  return (
    <SectionCard title="Lead Pipeline by Stage" subtitle="Funnel metrics" delay={0.2}>
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
        <p className="text-sm text-slate-400 text-center py-8">No pipeline data available.</p>
      )}
    </SectionCard>
  )
}

function HotLeadsWidget() {
  const { leads } = useSelector(s => s.workspace || {})
  const hotLeads = leads?.leads?.filter(l => l.status === 'QUALIFIED') || []
  return (
    <SectionCard title="Hot Leads (Qualified)" subtitle="High intent prospects" delay={0.2} className="flex flex-col h-max">
      <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
        {hotLeads.length > 0 ? (
          hotLeads.slice(0, 6).map(lead => (
            <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{lead.name}</p>
                <p className="text-[10px] text-slate-400">{lead.email || lead.phone}</p>
              </div>
              <span className="text-xs font-bold text-emerald-600">${Number(lead.estimatedValue || 0).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No hot leads currently.</p>
        )}
      </div>
    </SectionCard>
  )
}

function TodayFollowupsWidget() {
  const { followUps } = useSelector(s => s.workspace || {})
  const todayTasks = followUps?.tasks || []
  return (
    <SectionCard title="Today's Follow Ups" subtitle="Due interactions" delay={0.2} className="flex flex-col h-max">
      <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
        {todayTasks.length > 0 ? (
          todayTasks.slice(0, 6).map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{task.title}</p>
                <p className="text-[10px] text-slate-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                task.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}>{task.priority || 'medium'}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No follow-ups scheduled today.</p>
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
    <SectionCard title="Win / Lost Ratio" subtitle="Deal outcomes ratio" delay={0.2}>
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
          <div className="text-center font-bold text-slate-700 pr-4">
            <p className="text-lg text-emerald-600">{summary.converted ?? 0} Won</p>
            <p className="text-lg text-red-500">{summary.lost ?? 0} Lost</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-6">No closed deals to calculate ratio.</p>
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
    <SectionCard title="Lead Source Analytics" subtitle="Marketing attribution" delay={0.2}>
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
        <p className="text-xs text-slate-400 text-center py-6">No source analytics available.</p>
      )}
    </SectionCard>
  )
}

function TeamLeaderboardWidget() {
  const { teamLeaderboard } = useSelector(s => s.workspace || {})
  const leaderboard = Array.isArray(teamLeaderboard) ? teamLeaderboard : []
  return (
    <SectionCard title="Team Leaderboard" subtitle="Productivity rankings" delay={0.2} className="flex flex-col h-max">
      <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
        {leaderboard.length > 0 ? (
          leaderboard.slice(0, 6).map((member, i) => (
            <div key={member.id || i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3a' : '#6366f1' }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{member.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{member.designation}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-primary-600">{member.score}%</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">No team performance rankings.</p>
        )}
      </div>
    </SectionCard>
  )
}

function DepartmentHealthWidget() {
  return (
    <SectionCard title="Department Health" subtitle="Task completion SLA" delay={0.2}>
      <div className="space-y-3">
        {[
          { dept: 'Sales', health: 85, color: '#6366f1' },
          { dept: 'Marketing', health: 91, color: '#10b981' },
          { dept: 'Documentation', health: 77, color: '#f59e0b' }
        ].map(d => (
          <div key={d.dept} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{d.dept}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
    <SectionCard title="Business Health Score" subtitle="Core operations overview" delay={0.2}>
      <div className="space-y-3">
        {[
          { dept: 'Immigration', health: 92, color: '#10b981' },
          { dept: 'Evaluation', health: 88, color: '#6366f1' },
          { dept: 'HR', health: 80, color: '#f59e0b' },
          { dept: 'IT', health: 85, color: '#ef4444' }
        ].map(d => (
          <div key={d.dept} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{d.dept}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
  forecast: { title: 'Revenue Forecast', component: PerformanceChart },
  compliance: { title: 'Compliance', component: TaskWidget },

  // Marketing Executive extras
  campaign_activities: { title: 'Campaign Activities', component: ActivityTimeline },
}
