import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'
import { lightTheme, darkTheme } from './theme/muiTheme'
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

// Marketing Components
import MarketingDashboard from './modules/marketing/dashboard/MarketingDashboard'
import MarketingLeads from './modules/marketing/lead-funnels/MarketingLeads'
import MarketingActivities from './modules/marketing/dashboard/MarketingActivities'
import MarketingEmail from './modules/marketing/email-marketing/MarketingEmail'
import MarketingAssets from './modules/marketing/content/MarketingAssets'
import MarketingCampaigns from './modules/marketing/campaigns/MarketingCampaigns'
import MarketingTeamPage from './modules/marketing/team/pages/MarketingTeamPage'
import MarketingTasks from './modules/marketing/components/MarketingTasks'
import MarketingPerformance from './modules/marketing/reports/MarketingPerformance'
import MarketingReports from './modules/marketing/reports/MarketingReports'

export default function App() {
  const { isDark } = useSelector((s) => s.theme)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          {/* Default entry redirect */}
          <Route index element={<Navigate to="/sales/dashboard" replace />} />
          
          {/* Sales Executive Routes Module */}
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

          {/* Marketing Executive Routes Module */}
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
        {/* Wildcard fallback redirect */}
        <Route path="*" element={<Navigate to="/sales/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
