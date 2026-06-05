import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'
import { lightTheme, darkTheme } from './theme/muiTheme'
import { getHomePath } from './utils/roleRoutes'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'

// Sales Components
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
import SalesTeamPage from './modules/sales/team/pages/SalesTeamPage'

// Demo Dashboards
import SuperAdminDashboard    from './pages/demo/SuperAdminDashboard'
import BusinessOwnerDashboard from './pages/demo/BusinessOwnerDashboard'
import BusinessHeadDashboard  from './pages/demo/BusinessHeadDashboard'
import VerticalDashboard      from './pages/demo/VerticalDashboard'
import ManagerDashboard       from './pages/demo/ManagerDashboard'
import ExecutiveDashboard     from './pages/demo/ExecutiveDashboard'
import InternDashboard        from './pages/demo/InternDashboard'

// Marketing Components
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

/**
 * Sends authenticated users to the route that matches their role level.
 * Used for both the index ("/") and the wildcard ("*") route so that
 * no path ever dead-ends at a hardcoded Sales URL.
 */
function RoleRedirect() {
  const { user } = useSelector((s) => s.auth)
  return <Navigate to={getHomePath(user?.roleLevel)} replace />
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

          {/* ── Sales module ──────────────────────────────────────── */}
          <Route path="sales/dashboard"     element={<Dashboard />} />
          <Route path="sales/leads"         element={<Leads />} />
          <Route path="sales/follow-ups"    element={<FollowUps />} />
          <Route path="sales/meetings"      element={<Meetings />} />
          <Route path="sales/customers"     element={<Customers />} />
          <Route path="sales/opportunities" element={<Opportunities />} />
          <Route path="sales/team"          element={<SalesTeamPage />} />
          <Route path="sales/tasks"         element={<Tasks />} />
          <Route path="sales/performance"   element={<Performance />} />
          <Route path="sales/reports"       element={<Reports />} />
          <Route path="sales/profile"       element={<Profile />} />
          <Route path="sales/settings"      element={<Settings />} />

          {/* ── Role demo dashboards ──────────────────────────────── */}
          <Route path="demo/super-admin"    element={<SuperAdminDashboard />} />
          <Route path="demo/business-owner" element={<BusinessOwnerDashboard />} />
          <Route path="demo/business"       element={<BusinessHeadDashboard />} />
          <Route path="demo/vertical"       element={<VerticalDashboard />} />
          <Route path="demo/manager"        element={<ManagerDashboard />} />
          <Route path="demo/executive"      element={<ExecutiveDashboard />} />
          <Route path="demo/intern"         element={<InternDashboard />} />

          {/* ── Marketing module ──────────────────────────────────── */}
          <Route path="marketing/dashboard"       element={<MarketingDashboard />} />
          <Route path="marketing/leads"           element={<MarketingLeads />} />
          <Route path="marketing/activities"      element={<MarketingActivities />} />
          <Route path="marketing/email-marketing" element={<MarketingEmail />} />
          <Route path="marketing/assets"          element={<MarketingAssets />} />
          <Route path="marketing/campaigns"       element={<MarketingCampaigns />} />
          <Route path="marketing/team"            element={<MarketingTeamPage />} />
          <Route path="marketing/tasks"           element={<MarketingTasks />} />
          <Route path="marketing/performance"     element={<MarketingPerformance />} />
          <Route path="marketing/reports"         element={<MarketingReports />} />
          <Route path="marketing/profile"         element={<Profile />} />
          <Route path="marketing/settings"        element={<Settings />} />
        </Route>

        {/* Any unmatched path → role home (MainLayout guards auth) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
