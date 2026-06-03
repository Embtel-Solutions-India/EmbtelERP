import { createSlice } from '@reduxjs/toolkit'

const monthlyRevenue = [
  { month: 'Jan', revenue: 320000, target: 400000, leads: 450, won: 48 },
  { month: 'Feb', revenue: 285000, target: 400000, leads: 380, won: 36 },
  { month: 'Mar', revenue: 410000, target: 420000, leads: 520, won: 66 },
  { month: 'Apr', revenue: 375000, target: 430000, leads: 480, won: 54 },
  { month: 'May', revenue: 450000, target: 450000, leads: 600, won: 78 },
  { month: 'Jun', revenue: 390000, target: 460000, leads: 550, won: 60 },
  { month: 'Jul', revenue: 480000, target: 470000, leads: 650, won: 84 },
  { month: 'Aug', revenue: 520000, target: 480000, leads: 700, won: 96 },
  { month: 'Sep', revenue: 445000, target: 490000, leads: 580, won: 72 },
  { month: 'Oct', revenue: 510000, target: 500000, leads: 680, won: 90 },
  { month: 'Nov', revenue: 475000, target: 510000, leads: 620, won: 78 },
  { month: 'Dec', revenue: 395000, target: 500000, leads: 420, won: 54 },
]

const weeklyData = [
  { day: 'Mon', clicks: 120, emails: 250, visits: 300, leads: 5 },
  { day: 'Tue', clicks: 180, emails: 320, visits: 400, leads: 8 },
  { day: 'Wed', clicks: 150, emails: 280, visits: 350, leads: 6 },
  { day: 'Thu', clicks: 220, emails: 350, visits: 450, leads: 9 },
  { day: 'Fri', clicks: 190, emails: 300, visits: 380, leads: 7 },
  { day: 'Sat', clicks: 80,  emails: 120, visits: 150, leads: 2 },
  { day: 'Sun', clicks: 30,  emails: 50,  visits: 60,  leads: 1 },
]

const activities = [
  { id: 1, type: 'campaign_created', title: 'Campaign Created', description: 'Summer Sale PPC launched on Google Ads', time: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: 2, type: 'campaign_updated', title: 'Campaign Updated', description: 'Q2 Newsletter Blast budget optimized for conversion', time: new Date(Date.now() - 35 * 60000).toISOString() },
  { id: 3, type: 'leads_generated', title: 'Leads Generated', description: '15 new organic search leads recorded', time: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: 4, type: 'email_sent', title: 'Email Campaign Sent', description: 'Promo sequence delivered to 10k subscribers', time: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 5, type: 'content_published', title: 'Content Published', description: 'New landing page blog post published for SEO', time: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 6, type: 'asset_uploaded', title: 'New Asset Uploaded', description: 'Banner Creative v2 added to assets library', time: new Date(Date.now() - 7 * 3600000).toISOString() },
]

const opportunities = [
  {
    id: 1,
    campaign_name: 'Summer Sale PPC',
    campaign_type: 'PPC',
    target_audience: 'E-commerce Owners',
    service_promoted: 'Cloud Hosting',
    budget: 50000,
    start_date: '2026-06-01',
    end_date: '2026-06-30',
    status: 'Active',
    leads_generated: 450,
    conversions: 55,
    emails_sent: 0,
    open_rate: 0,
    click_rate: 0,
    revenue_generated: 165000,
  },
  {
    id: 2,
    campaign_name: 'Q2 Newsletter Blast',
    campaign_type: 'Email',
    target_audience: 'Existing Leads',
    service_promoted: 'Premium Support Add-on',
    budget: 15000,
    start_date: '2026-05-15',
    end_date: '2026-06-15',
    status: 'Active',
    leads_generated: 380,
    conversions: 42,
    emails_sent: 10000,
    open_rate: 28.5,
    click_rate: 6.2,
    revenue_generated: 45000,
  },
  {
    id: 3,
    campaign_name: 'SEO Blog Optimization',
    campaign_type: 'SEO',
    target_audience: 'Developers & SaaS Founders',
    service_promoted: 'DBaaS Platforms',
    budget: 20000,
    start_date: '2026-04-01',
    end_date: '2026-09-30',
    status: 'Active',
    leads_generated: 620,
    conversions: 80,
    emails_sent: 0,
    open_rate: 0,
    click_rate: 0,
    revenue_generated: 96000,
  },
  {
    id: 4,
    campaign_name: 'Instagram Influencer Run',
    campaign_type: 'Social',
    target_audience: 'Gen Z Tech Enthusiasts',
    service_promoted: 'Smart Office Hub',
    budget: 35000,
    start_date: '2026-05-20',
    end_date: '2026-06-20',
    status: 'Paused',
    leads_generated: 280,
    conversions: 30,
    emails_sent: 0,
    open_rate: 0,
    click_rate: 0,
    revenue_generated: 52000,
  },
  {
    id: 5,
    campaign_name: 'Spring Tech Expo 2026',
    campaign_type: 'Event',
    target_audience: 'Enterprise CTOs & VPs',
    service_promoted: 'Enterprise Security CRM',
    budget: 120000,
    start_date: '2026-03-10',
    end_date: '2026-03-15',
    status: 'Completed',
    leads_generated: 650,
    conversions: 95,
    emails_sent: 0,
    open_rate: 0,
    click_rate: 0,
    revenue_generated: 380000,
  },
  {
    id: 6,
    campaign_name: 'Q3 Product Hunt Launch Prep',
    campaign_type: 'Content',
    target_audience: 'Early Adopters',
    service_promoted: 'AI CRM Co-pilot',
    budget: 8000,
    start_date: '2026-06-10',
    end_date: '2026-07-10',
    status: 'Draft',
    leads_generated: 0,
    conversions: 0,
    emails_sent: 0,
    open_rate: 0,
    click_rate: 0,
    revenue_generated: 0,
  },
]

const kpiStats = {
  leadsGenerated: 2480,
  activeCampaigns: 5,
  costPerLead: 15.5,
  conversionRate: 12.4,
  campaignRoi: 3.2,
  websiteTraffic: 45000,
  socialEngagement: 4.8,
  emailOpenRate: 24.5,
  monthlyRevenue: 395000,
  targetAchievement: 79,
  monthlyTarget: 500000,
}

const funnelData = [
  { stage: 'Impressions', count: 120000, value: 0, convRate: 100 },
  { stage: 'Clicks', count: 25000, value: 0, convRate: 20.8 },
  { stage: 'Landing Page Visits', count: 18000, value: 0, convRate: 72.0 },
  { stage: 'Leads Generated', count: 2480, value: 0, convRate: 13.8 },
  { stage: 'Qualified Leads', count: 620, value: 0, convRate: 25.0 },
  { stage: 'Converted Clients', count: 308, value: 0, convRate: 49.7 },
]

const marketingDashboardSlice = createSlice({
  name: 'marketingDashboard',
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
    addCampaign(state, { payload }) { state.opportunities.unshift(payload) },
    updateCampaign(state, { payload }) {
      const idx = state.opportunities.findIndex(o => o.id === payload.id)
      if (idx !== -1) {
        state.opportunities[idx] = { ...state.opportunities[idx], ...payload }
      }
    },
    updateCampaignStatus(state, { payload: { id, status } }) {
      const opp = state.opportunities.find(o => o.id === id)
      if (opp) opp.status = status
    },
    setChartPeriod(state, { payload }) { state.chartPeriod = payload },
    setLoading(state, { payload }) { state.loading = payload },
    refreshStats(state) { state.kpiStats.leadsGenerated += 1 },
  },
})

export const { addCampaign, updateCampaign, updateCampaignStatus, setChartPeriod, setLoading, refreshStats } = marketingDashboardSlice.actions
export default marketingDashboardSlice.reducer
