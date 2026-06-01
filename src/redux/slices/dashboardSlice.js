import { createSlice } from '@reduxjs/toolkit'

const monthlyRevenue = [
  { month: 'Jan', revenue: 320000, target: 400000, leads: 45, won: 8 },
  { month: 'Feb', revenue: 285000, target: 400000, leads: 38, won: 6 },
  { month: 'Mar', revenue: 410000, target: 420000, leads: 52, won: 11 },
  { month: 'Apr', revenue: 375000, target: 430000, leads: 48, won: 9 },
  { month: 'May', revenue: 450000, target: 450000, leads: 60, won: 13 },
  { month: 'Jun', revenue: 390000, target: 460000, leads: 55, won: 10 },
  { month: 'Jul', revenue: 480000, target: 470000, leads: 65, won: 14 },
  { month: 'Aug', revenue: 520000, target: 480000, leads: 70, won: 16 },
  { month: 'Sep', revenue: 445000, target: 490000, leads: 58, won: 12 },
  { month: 'Oct', revenue: 510000, target: 500000, leads: 68, won: 15 },
  { month: 'Nov', revenue: 475000, target: 510000, leads: 62, won: 13 },
  { month: 'Dec', revenue: 395000, target: 500000, leads: 42, won: 9 },
]

const weeklyData = [
  { day: 'Mon', calls: 12, emails: 25, meetings: 3, leads: 5 },
  { day: 'Tue', calls: 18, emails: 32, meetings: 4, leads: 8 },
  { day: 'Wed', calls: 15, emails: 28, meetings: 5, leads: 6 },
  { day: 'Thu', calls: 22, emails: 35, meetings: 6, leads: 9 },
  { day: 'Fri', calls: 19, emails: 30, meetings: 4, leads: 7 },
  { day: 'Sat', calls: 8,  emails: 12, meetings: 1, leads: 2 },
  { day: 'Sun', calls: 3,  emails: 5,  meetings: 0, leads: 1 },
]

const activities = [
  { id: 1,  type: 'lead_created',      title: 'New lead created',          description: 'Rajesh Khanna from SAP India added to pipeline',    time: new Date(Date.now() - 10 * 60000).toISOString(),   icon: 'PersonAdd',     color: '#6366f1' },
  { id: 2,  type: 'follow_up',         title: 'Follow-up completed',       description: 'Called Priya Singh at Infosys – positive response',  time: new Date(Date.now() - 35 * 60000).toISOString(),   icon: 'Phone',         color: '#10b981' },
  { id: 3,  type: 'meeting_scheduled', title: 'Meeting scheduled',         description: 'Demo call booked with Tech Mahindra for tomorrow',   time: new Date(Date.now() - 90 * 60000).toISOString(),   icon: 'VideoCall',     color: '#f59e0b' },
  { id: 4,  type: 'deal_closed',       title: 'Deal Won!',                 description: 'Kavita Sharma – Oracle India – ₹4,50,000',          time: new Date(Date.now() - 3 * 3600000).toISOString(),  icon: 'EmojiEvents',   color: '#ec4899' },
  { id: 5,  type: 'quote_sent',        title: 'Quotation sent',            description: 'Proposal emailed to HCL Technologies',              time: new Date(Date.now() - 5 * 3600000).toISOString(),  icon: 'RequestQuote',  color: '#06b6d4' },
  { id: 6,  type: 'lead_qualified',    title: 'Lead qualified',            description: 'Suresh Iyer from Google Cloud moved to Qualified',   time: new Date(Date.now() - 7 * 3600000).toISOString(),  icon: 'Verified',      color: '#8b5cf6' },
  { id: 7,  type: 'follow_up',         title: 'Email follow-up sent',      description: 'Nurture sequence sent to 5 cold leads',             time: new Date(Date.now() - 86400000).toISOString(),     icon: 'Email',         color: '#10b981' },
  { id: 8,  type: 'meeting_completed', title: 'Meeting completed',         description: 'Onboarding session done with Oracle India',          time: new Date(Date.now() - 28 * 3600000).toISOString(), icon: 'CheckCircle',   color: '#10b981' },
]

const opportunities = [
  { id: 1, name: 'Enterprise CRM Suite',    company: 'HCL Technologies', value: 350000, probability: 75, stage: 'Negotiation',   closingDate: new Date(Date.now() + 15 * 86400000).toISOString()  },
  { id: 2, name: 'Cloud Migration Package', company: 'Wipro Systems',    value: 200000, probability: 60, stage: 'Proposal Sent', closingDate: new Date(Date.now() + 22 * 86400000).toISOString()  },
  { id: 3, name: 'Analytics Platform',      company: 'TCS',              value: 175000, probability: 50, stage: 'Negotiation',   closingDate: new Date(Date.now() + 10 * 86400000).toISOString()  },
  { id: 4, name: 'SaaS License Renewal',    company: 'Google Cloud',     value: 280000, probability: 80, stage: 'Qualified',     closingDate: new Date(Date.now() + 30 * 86400000).toISOString()  },
  { id: 5, name: 'Security Module Add-on',  company: 'IBM India',        value: 320000, probability: 65, stage: 'Negotiation',   closingDate: new Date(Date.now() + 8 * 86400000).toISOString()   },
  { id: 6, name: 'Digital Transform Bundle',company: 'Infosys Ltd',      value: 420000, probability: 40, stage: 'Proposal Sent', closingDate: new Date(Date.now() + 45 * 86400000).toISOString()  },
]

const kpiStats = {
  totalLeads: 148,
  newLeadsToday: 7,
  qualifiedLeads: 34,
  hotLeads: 18,
  followUpsPending: 23,
  meetingsScheduled: 7,
  wonDeals: 42,
  lostDeals: 11,
  monthlyRevenue: 395000,
  targetAchievement: 79,
  monthlyTarget: 500000,
}

const funnelData = [
  { stage: 'New Lead',      count: 148, value: 4200000, convRate: 100 },
  { stage: 'Contacted',     count: 112, value: 3850000, convRate: 75.7 },
  { stage: 'Qualified',     count: 68,  value: 2900000, convRate: 60.7 },
  { stage: 'Proposal Sent', count: 42,  value: 1980000, convRate: 61.8 },
  { stage: 'Negotiation',   count: 24,  value: 1350000, convRate: 57.1 },
  { stage: 'Won',           count: 42,  value: 895000,  convRate: 17.5 },
]

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    kpiStats,
    monthlyRevenue,
    weeklyData,
    activities,
    opportunities,
    funnelData,
    chartPeriod: 'monthly',
    loading: false,
  },
  reducers: {
    setChartPeriod(state, { payload }) { state.chartPeriod = payload },
    setLoading(state, { payload }) { state.loading = payload },
    refreshStats(state) { state.kpiStats.newLeadsToday += 1 },
  },
})

export const { setChartPeriod, setLoading, refreshStats } = dashboardSlice.actions
export default dashboardSlice.reducer
