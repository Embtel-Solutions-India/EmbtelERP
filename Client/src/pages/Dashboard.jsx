import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaUsers, FaStar, FaFire, FaCalendarAlt, FaDollarSign, FaBullseye,
  FaTasks, FaCheckCircle, FaExclamationTriangle, FaChartLine, FaLightbulb, FaTachometerAlt,
} from "react-icons/fa";
import StatCard from "../components/common/StatCard";
import WelcomeSection from "../components/dashboard/WelcomeSection";
import PipelineBoard from "../components/dashboard/PipelineBoard";
import FollowUpsTable from "../components/dashboard/FollowUpsTable";
import MeetingCards from "../components/dashboard/MeetingCard";
import PerformanceChart from "../components/dashboard/PerformanceChart";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import TaskWidget from "../components/dashboard/TaskWidget";
import TargetProgress from "../components/dashboard/TargetProgress";
import OpportunityTable from "../components/dashboard/OpportunityTable";
import CustomerInsights from "../components/dashboard/CustomerInsights";
import CalendarWidget from "../components/dashboard/CalendarWidget";
import {
  fetchDashboardOverview, fetchDashboardPerformance, fetchDashboardInsights,
  fetchDashboardTeam, fetchRoleWorkspace,
} from "../redux/slices/dashboardSlice";
import { fetchTasks } from "../redux/slices/taskSlice";
import { fetchLeads } from "../redux/slices/leadSlice";
import RoleWorkspacePanel from "../components/dashboard/RoleWorkspacePanel";

// Role-specific sales dashboard components
import SalesInternDashboard from '../modules/sales/dashboard/SalesInternDashboard'
import SalesExecutiveDashboard from '../modules/sales/dashboard/SalesExecutiveDashboard'
import SalesHeadDashboard from '../modules/sales/dashboard/SalesHeadDashboard'

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { overview, performance, insights, teams, workspace, loading } = useSelector(
    (s) => s.dashboard,
  );
  const { current: activePerspective } = useSelector((s) => s.perspective);

  useEffect(() => {
    dispatch(fetchDashboardOverview());
    dispatch(fetchDashboardPerformance());
    dispatch(fetchDashboardInsights());
    dispatch(fetchDashboardTeam());
    dispatch(fetchRoleWorkspace());
    dispatch(fetchTasks());
    dispatch(fetchLeads());
  }, [dispatch, activePerspective]);

  // Role-aware routing: render dedicated sales role dashboards
  const level = Number(user?.employeeLevel ?? user?.roleLevel ?? 1);
  const designation = (user?.designation || '').toLowerCase();
  const isSalesRole = designation.includes('sales') || (
    !designation.includes('marketing') &&
    !designation.includes('documentation') &&
    !designation.includes('hr') &&
    !designation.includes('owner') &&
    !designation.includes('admin') &&
    !designation.includes('professor') &&
    !designation.includes('immigration') &&
    !designation.includes('evaluation') &&
    !designation.includes('it head') &&
    level <= 2
  );

  if (isSalesRole) {
    if (level <= 0) return <div className="space-y-6 max-w-[1600px] mx-auto"><WelcomeSection /><SalesInternDashboard /></div>
    if (level === 1) return <div className="space-y-6 max-w-[1600px] mx-auto"><WelcomeSection /><SalesExecutiveDashboard /></div>
    if (level === 2) return <div className="space-y-6 max-w-[1600px] mx-auto"><WelcomeSection /><SalesHeadDashboard /></div>
  }

  // Generic / higher-level fallback dashboard
  const statCards = [
    {
      title: "Total Employees",
      value: overview?.employeeCount ?? 0,
      icon: <FaUsers size={18} />,
      color: "#6366f1",
      change: 0,
      changeLabel: "in scope",
    },
    {
      title: "Total Tasks",
      value: overview?.taskCount ?? 0,
      icon: <FaTasks size={18} />,
      color: "#06b6d4",
      change: 0,
      changeLabel: "total",
    },
    {
      title: "Completed Tasks",
      value: overview?.taskCompleted ?? 0,
      icon: <FaCheckCircle size={18} />,
      color: "#10b981",
      change:
        overview?.taskCount > 0
          ? Math.round((overview.taskCompleted / overview.taskCount) * 100)
          : 0,
      changeLabel: "completion rate",
    },
    {
      title: "Pending Tasks",
      value: overview?.taskPending ?? 0,
      icon: <FaStar size={18} />,
      color: "#f59e0b",
      change: 0,
      changeLabel: "need attention",
    },
    {
      title: "Overdue Tasks",
      value: overview?.taskOverdue ?? 0,
      icon: <FaExclamationTriangle size={18} />,
      color: "#ef4444",
      change: overview?.taskOverdue > 0 ? -overview.taskOverdue : 0,
      changeLabel: "overdue",
    },
    {
      title: "Activities",
      value: overview?.activityCount ?? 0,
      icon: <FaChartLine size={18} />,
      color: "#8b5cf6",
      change: 0,
      changeLabel: "total activities",
    },
    {
      title: "Target Achievement",
      value:
        overview?.businessKpis?.targetAchievement ??
        overview?.teamKpis?.targetAchievement ??
        0,
      icon: <FaBullseye size={18} />,
      suffix: "%",
      color: "#10b981",
      change: 0,
      changeLabel: "achievement",
      formatValue: false,
    },
  ];

  if (overview?.teamKpis) {
    statCards.push({
      title: `Team: ${overview.teamKpis.teamName}`,
      value: overview.teamKpis.memberCount,
      icon: <FaUsers size={18} />,
      color: "#06b6d4",
      change: overview.teamKpis.completionRate,
      changeLabel: "completion %",
    });
  }

  if (overview?.employeeKpis) {
    statCards.push({
      title: overview.employeeKpis.name,
      value: overview.employeeKpis.performanceScore,
      icon: <FaTachometerAlt size={18} />,
      suffix: "%",
      color: "#8b5cf6",
      change: overview.employeeKpis.productivity,
      changeLabel: "productivity",
      formatValue: false,
    });
  }

  if (overview?.businessKpis) {
    statCards.push({
      title: overview.businessKpis.businessName,
      value: overview.businessKpis.employeeCount,
      icon: <FaUsers size={18} />,
      color: "#6366f1",
      change: overview.businessKpis.targetAchievement,
      changeLabel: "target %",
    });
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <WelcomeSection />

      {loading && (
        <div className="text-center py-2 text-sm text-slate-400">
          Loading dashboard data...
        </div>
      )}

      {overview?.perspective && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <FaLightbulb className="text-primary-600 dark:text-primary-400" />
            <span className="font-medium text-primary-700 dark:text-primary-300">
              Viewing: {overview.perspective.label}
            </span>
            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
              {overview.perspective.aggregationLevel}
            </span>
          </div>
        </div>
      )}

      {insights && insights.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
            <FaLightbulb className="text-amber-500" />
            Insights
          </h3>
          <div className="space-y-1.5">
            {insights.slice(0, 5).map((insight, index) => (
              <div
                key={index}
                className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                  insight.type === "positive"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : insight.type === "negative"
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                      : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    insight.trend === "up"
                      ? "bg-green-500"
                      : insight.trend === "down"
                        ? "bg-red-500"
                        : "bg-blue-500"
                  }`}
                />
                {insight.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <RoleWorkspacePanel workspace={workspace} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PerformanceChart data={performance} />
        </div>
        <TaskWidget tasks={overview} />
      </div>

      {teams && teams.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Team Rankings
          </h3>
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      team.ranking === 1
                        ? "bg-yellow-500"
                        : team.ranking === 2
                          ? "bg-slate-400"
                          : team.ranking === 3
                            ? "bg-amber-600"
                            : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    {team.ranking}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {team.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{team.memberCount} members</span>
                  <span
                    className={`font-semibold ${
                      team.completionRate >= 70
                        ? "text-green-600"
                        : team.completionRate >= 40
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {team.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PipelineBoard />
      <FollowUpsTable />

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
  );
}
