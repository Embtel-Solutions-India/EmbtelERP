import { Route } from 'react-router-dom'
import MarketingDashboard from '../dashboard/MarketingDashboard'
import MarketingLeads from '../lead-funnels/MarketingLeads'
import MarketingActivities from '../dashboard/MarketingActivities'
import MarketingEmail from '../email-marketing/MarketingEmail'
import MarketingAssets from '../content/MarketingAssets'
import MarketingCampaigns from '../campaigns/MarketingCampaigns'
import MarketingTasks from '../components/MarketingTasks'
import MarketingPerformance from '../reports/MarketingPerformance'
import MarketingReports from '../reports/MarketingReports'
import MarketingTeamPage from '../team/pages/MarketingTeamPage'

// Shared profile/settings pages
import Profile from '../../../pages/Profile'
import Settings from '../../../pages/Settings'

export const marketingRoutes = (
  <>
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
  </>
)
