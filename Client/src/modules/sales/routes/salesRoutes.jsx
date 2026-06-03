import { Route } from 'react-router-dom'
import Dashboard from '../../../pages/Dashboard'
import Leads from '../../../pages/Leads'
import FollowUps from '../../../pages/FollowUps'
import Meetings from '../../../pages/Meetings'
import Customers from '../../../pages/Customers'
import Opportunities from '../../../pages/Opportunities'
import Tasks from '../../../pages/Tasks'
import Performance from '../../../pages/Performance'
import Reports from '../../../pages/Reports'
import Profile from '../../../pages/Profile'
import Settings from '../../../pages/Settings'
import SalesTeamPage from '../team/pages/SalesTeamPage'

export const salesRoutes = (
  <>
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
  </>
)
