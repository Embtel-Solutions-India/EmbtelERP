import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'
import { lightTheme, darkTheme } from './theme/muiTheme'
import { getHomePath } from './utils/roleRoutes'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import RoleRouteGuard from './components/common/RoleRouteGuard'

// ── Sales Executive (additive) ───────────────────────────────────────────────
import AddLeadForm from './modules/sales/forms/AddLeadForm'
import TaskForm from './modules/sales/forms/TaskForm'
import SalesExecOverview from './modules/sales/pages/SalesExecOverview'

// ── Shared pages ────────────────────────────────────────────────────────────
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import FollowUps from './pages/FollowUps'
import Meetings from './pages/Meetings'
import Customers from './pages/Customers'
import Opportunities from './pages/Opportunities'
import Tasks from './pages/Tasks'
import Performance from './pages/Performance'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import CalendarPage from './pages/CalendarPage'
import AuditLogs from './pages/AuditLogs'
import SalesTeamPage from './modules/sales/team/pages/SalesTeamPage'
import EmployeesPage from './pages/Employees'
import DocumentsPage from './modules/production/pages/DocumentsPage'
import CasesPage from './modules/production/pages/CasesPage'
import VerificationPage from './modules/production/pages/VerificationPage'

// ── Marketing Module ─────────────────────────────────────────────────────────
import MarketingDashboard    from './modules/marketing/dashboard/MarketingDashboard'
import MarketingLeads        from './modules/marketing/lead-funnels/MarketingLeads'
import MarketingActivities   from './modules/marketing/dashboard/MarketingActivities'
import MarketingEmail        from './modules/marketing/email-marketing/MarketingEmail'
import MarketingAssets       from './modules/marketing/content/MarketingAssets'
import MarketingCampaigns    from './modules/marketing/campaigns/MarketingCampaigns'
import MarketingTeamPage     from './modules/marketing/team/pages/MarketingTeamPage'
import MarketingTasks        from './modules/marketing/components/MarketingTasks'
import MarketingPerformance  from './modules/marketing/reports/MarketingPerformance'
import MarketingReports      from './modules/marketing/reports/MarketingReports'

// ── Role-specific dashboards ─────────────────────────────────────────────────
import SalesHeadDashboard       from './modules/sales/dashboard/SalesHeadDashboard'
import SalesInternDashboard     from './modules/sales/dashboard/SalesInternDashboard'
import MarketingManagerDashboard from './modules/marketing/dashboard/MarketingManagerDashboard'
import MarketingInternDashboard from './modules/marketing/dashboard/MarketingInternDashboard'

// ── Module Dashboards ────────────────────────────────────────────────────────
import ProductionDashboard   from './modules/production/dashboard/ProductionDashboard'
import EvaluationDashboard   from './modules/evaluation/dashboard/EvaluationDashboard'
import HRDashboard           from './modules/hr/dashboard/HRDashboard'
import OwnerDashboard        from './modules/owner/dashboard/OwnerDashboard'
import AdminDashboard        from './modules/admin/dashboard/AdminDashboard'
import OrgExplorer           from './modules/admin/dashboard/OrgExplorer'

// ── HR Module screens ────────────────────────────────────────────────────────
import HRRecruitment         from './modules/hr/recruitment/HRRecruitment'
import HRAttendance          from './modules/hr/attendance/HRAttendance'
import HRPerformance         from './modules/hr/performance/HRPerformance'
import HRReports             from './modules/hr/reports/HRReports'

// ── Immigration Module ───────────────────────────────────────────────────────
import HeadDashboard      from './pages/HeadDashboard'
import HeadCasesPage      from './pages/HeadCasesPage'
import HeadTeamPage       from './pages/HeadTeamPage'
import HeadLeadsPage      from './pages/HeadLeadsPage'
import HeadAnalyticsPage  from './pages/HeadAnalyticsPage'
import HeadReportsPage    from './pages/HeadReportsPage'
import HeadApprovalsPage  from './pages/HeadApprovalsPage'

/**
 * Sends authenticated users to the route that matches their role.
 */
function RoleRedirect() {
  const { user } = useSelector((s) => s.auth)
  return <Navigate to={getHomePath(user)} replace />
}

export default function App() {
  const { isDark } = useSelector((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<MainLayout />}>
          {/* Root redirect — goes to the role's home dashboard */}
          <Route index element={<RoleRedirect />} />

          {/* ── Sales module ──────────────────────────────────────────────── */}
          {/* Sales Intern dashboard (Level 0) */}
          <Route path="sales-intern/dashboard" element={<SalesInternDashboard />} />

          {/* Sales Executive dashboard (Level 1) */}
          <Route path="sales/dashboard"     element={<Dashboard />} />
          <Route path="sales/leads"         element={<Leads />} />
          <Route path="sales/tasks"         element={<Tasks />} />
          <Route path="sales/activities"    element={<Tasks />} />
          <Route path="sales/profile"       element={<Profile />} />
          <Route path="sales/settings"      element={<Settings />} />
          <Route path="sales/approvals"     element={<Tasks />} />

          {/* Sales Level >= 1 (Executive+) */}
          <Route element={<RoleRouteGuard allowedLevels={[1, 2, 3, 4, 5]} />}>
            <Route path="sales/add-lead"      element={<AddLeadForm />} />
            <Route path="sales/overview"      element={<SalesExecOverview />} />
            <Route path="sales/tasks/new"     element={<TaskForm />} />
            <Route path="sales/follow-ups"    element={<FollowUps />} />
            <Route path="sales/meetings"      element={<Meetings />} />
            <Route path="sales/customers"     element={<Customers />} />
            <Route path="sales/opportunities" element={<Opportunities />} />
            <Route path="sales/performance"   element={<Performance />} />
          </Route>

          {/* Sales Head / Manager dashboard + team management (Level >= 2) */}
          <Route element={<RoleRouteGuard allowedLevels={[2, 3, 4, 5]} allowedDesignations={['sales head', 'sales manager']} />}>
            <Route path="sales-manager/dashboard" element={<SalesHeadDashboard />} />
            <Route path="sales/team"              element={<SalesTeamPage />} />
            <Route path="sales/reports"           element={<Reports />} />
          </Route>

          {/* ── Marketing module ────────────────────────────────────────── */}
          {/* Marketing Intern dashboard (Level 0) */}
          <Route path="marketing-intern/dashboard" element={<MarketingInternDashboard />} />

          {/* Marketing Executive dashboard */}
          <Route path="marketing/dashboard"       element={<MarketingDashboard />} />
          <Route path="marketing/tasks"           element={<MarketingTasks />} />
          <Route path="marketing/profile"         element={<Profile />} />
          <Route path="marketing/settings"        element={<Settings />} />
          <Route path="marketing/approvals"       element={<MarketingTasks />} />

          {/* Marketing Level >= 1 (Executive+) */}
          <Route element={<RoleRouteGuard allowedLevels={[1, 2, 3, 4, 5]} />}>
            <Route path="marketing/campaigns"       element={<MarketingCampaigns />} />
            <Route path="marketing/activities"      element={<MarketingActivities />} />
            <Route path="marketing/email-marketing" element={<MarketingEmail />} />
            <Route path="marketing/assets"          element={<MarketingAssets />} />
            <Route path="marketing/leads"           element={<MarketingLeads />} />
            <Route path="marketing/reports"         element={<MarketingReports />} />
            <Route path="marketing/performance"     element={<MarketingPerformance />} />
          </Route>

          {/* Marketing Manager dashboard + team (Level >= 2) */}
          <Route element={<RoleRouteGuard allowedLevels={[2, 3, 4, 5]} allowedDesignations={['marketing manager']} />}>
            <Route path="marketing-manager/dashboard" element={<MarketingManagerDashboard />} />
            <Route path="marketing/team"              element={<MarketingTeamPage />} />
          </Route>

          {/* ── Production (Documentation) module ───────────────────────── */}
          <Route element={<RoleRouteGuard allowedLevels={[0, 1, 2, 3, 4, 5]} allowedDesignations={['documentation', 'owner', 'admin']} />}>
            <Route path="production/dashboard"      element={<ProductionDashboard />} />
            <Route path="production/tasks"          element={<Tasks />} />
            <Route path="production/profile"        element={<Profile />} />
            <Route path="production/documents"      element={<DocumentsPage />} />
            <Route path="production/cases"          element={<CasesPage />} />
            <Route path="production/verification"   element={<VerificationPage />} />
            <Route path="production/reports"        element={<Reports />} />
            <Route path="production/approvals"      element={<Tasks />} />
            <Route path="production/team"           element={<SalesTeamPage />} />
          </Route>

          {/* Documentation role-specific dashboards */}
          <Route element={<RoleRouteGuard allowedLevels={[0, 1, 2, 3, 4, 5]} allowedDesignations={['documentation', 'owner', 'admin']} />}>
            <Route path="documentation-intern/dashboard"   element={<ProductionDashboard />} />
            <Route path="documentation/dashboard"          element={<ProductionDashboard />} />
            <Route path="documentation-manager/dashboard"  element={<ProductionDashboard />} />
          </Route>

          {/* ── Evaluation module ────────────────────────────────────────── */}
          <Route element={<RoleRouteGuard allowedLevels={[1, 3, 4, 5]} allowedDesignations={['professor', 'evaluation', 'owner', 'admin']} />}>
            <Route path="evaluation/dashboard"      element={<EvaluationDashboard />} />
            <Route path="head-evaluation/dashboard" element={<EvaluationDashboard />} />
            <Route path="professor/dashboard"       element={<EvaluationDashboard />} />
          </Route>

          {/* ── HR module ─────────────────────────────────────────────────── */}
          <Route element={<RoleRouteGuard allowedLevels={[1, 3, 4, 5]} allowedDesignations={['hr', 'recruitment', 'owner', 'admin']} />}>
            <Route path="hr/dashboard"              element={<HRDashboard />} />
            <Route path="hr-executive/dashboard"    element={<HRDashboard />} />
            <Route path="recruitment/dashboard"     element={<HRDashboard />} />
            <Route path="hr/employees"              element={<EmployeesPage />} />
            <Route path="hr/recruitment"            element={<HRRecruitment />} />
            <Route path="hr/attendance"             element={<HRAttendance />} />
            <Route path="hr/performance"            element={<HRPerformance />} />
            <Route path="hr/reports"                element={<HRReports />} />
            <Route path="hr/profile"                element={<Profile />} />
          </Route>

          {/* ── Owner module — Business Owner + Super Admin only ──────────── */}
          <Route element={<RoleRouteGuard allowedLevels={[4, 5]} allowedDesignations={['business owner', 'owner']} />}>
            <Route path="owner/dashboard"           element={<OwnerDashboard />} />
          </Route>

          {/* Owner sub-pages — accessible to all management levels */}
          <Route element={<RoleRouteGuard allowedLevels={[2, 3, 4, 5]} allowedDesignations={['vertical manager', 'immigration', 'owner', 'admin']} />}>
            <Route path="owner/businesses"          element={<Reports />} />
            <Route path="owner/employees"           element={<EmployeesPage />} />
            <Route path="owner/reports"             element={<Reports />} />
            <Route path="owner/analytics"           element={<Performance />} />
            <Route path="owner/approvals"           element={<Tasks />} />
            <Route path="owner/profile"             element={<Profile />} />
          </Route>

          {/* ── Calendar — module-scoped per role so hierarchy context is kept ── */}
          {[
            'sales-intern', 'sales', 'sales-manager',
            'marketing-intern', 'marketing', 'marketing-manager',
            'production', 'documentation-intern', 'documentation', 'documentation-manager',
            'evaluation', 'head-evaluation', 'professor',
            'hr', 'hr-executive', 'recruitment',
            'owner', 'head', 'vertical',
            'admin', 'super-admin',
          ].map((m) => (
            <Route key={m} path={`${m}/calendar`} element={<CalendarPage />} />
          ))}
          {/* Legacy global calendar → resolve to the user's role home (never a foreign dashboard) */}
          <Route path="calendar" element={<Navigate to="/" replace />} />

          {/* Audit Logs — available to all authenticated roles (RBAC enforced server-side) */}
          <Route path="audit" element={<AuditLogs />} />

          {/* ── Immigration Head module ───────────────────────────────────── */}
          <Route element={<RoleRouteGuard allowedLevels={[3, 4, 5]} allowedDesignations={['immigration']} />}>
            <Route path="head/dashboard"   element={<HeadDashboard />} />
            <Route path="head/cases"       element={<HeadCasesPage />} />
            <Route path="head/employees"   element={<HeadTeamPage />} />
            <Route path="head/businesses"  element={<HeadLeadsPage />} />
            <Route path="head/analytics"   element={<HeadAnalyticsPage />} />
            <Route path="head/reports"     element={<HeadReportsPage />} />
            <Route path="head/approvals"   element={<HeadApprovalsPage />} />
            <Route path="head/profile"     element={<Profile />} />
          </Route>

          {/* ── Vertical Manager module ───────────────────────────────────── */}
          <Route element={<RoleRouteGuard allowedLevels={[2, 3, 4, 5]} allowedDesignations={['vertical manager']} />}>
            <Route path="vertical/dashboard"        element={<OwnerDashboard />} />
          </Route>

          {/* ── Super Admin module ────────────────────────────────────────── */}
          <Route element={<RoleRouteGuard allowedLevels={[5]} allowedDesignations={['super admin', 'it head']} />}>
            <Route path="super-admin/dashboard"     element={<AdminDashboard />} />
          </Route>

          {/* ── Admin module ──────────────────────────────────────────────── */}
          <Route element={<RoleRouteGuard allowedLevels={[3, 4, 5]} allowedDesignations={['it head', 'super admin', 'admin']} />}>
            <Route path="admin/dashboard"           element={<AdminDashboard />} />
            <Route path="admin/org-explorer"        element={<OrgExplorer />} />
            <Route path="admin/users"               element={<EmployeesPage />} />
            <Route path="admin/roles"               element={<Reports />} />
            <Route path="admin/audit"               element={<Reports />} />
            <Route path="admin/settings"            element={<Settings />} />
          </Route>
        </Route>

        {/* Any unmatched path → role home (MainLayout guards auth) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
