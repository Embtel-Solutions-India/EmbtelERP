import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../services/api'
import { campaignService } from '../../../services/campaignService'

const emptyKpiStats = {
  leadsGenerated: 0,
  activeCampaigns: 0,
  costPerLead: 0,
  conversionRate: 0,
  campaignRoi: 0,
  websiteTraffic: 0,
  socialEngagement: 0,
  emailOpenRate: 0,
  monthlyRevenue: 0,
  targetAchievement: 0,
  monthlyTarget: 0,
}

const statusLabel = (status = '') =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

const monthKey = (value) => {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleString('en-US', { month: 'short' })
}

const mapCampaign = (campaign) => {
  const leadsGenerated = Number(campaign.actualLeads ?? campaign.leads?.length ?? 0)
  const conversions = campaign.leads?.filter?.((lead) => lead.status === 'CONVERTED').length ?? 0
  const budget = Number(campaign.budget ?? 0)
  const spent = Number(campaign.budgetSpent ?? 0)

  return {
    id: campaign.id,
    campaign_name: campaign.name,
    campaign_type: campaign.channel,
    target_audience: campaign.description || 'Assigned audience',
    service_promoted: campaign.successMetric || campaign.channel,
    budget,
    start_date: campaign.startDate,
    end_date: campaign.endDate,
    status: statusLabel(campaign.status),
    leads_generated: leadsGenerated,
    conversions,
    emails_sent: 0,
    open_rate: 0,
    click_rate: 0,
    revenue_generated: spent,
  }
}

const summarizeMonthly = (campaigns, leads) => {
  const map = new Map()

  campaigns.forEach((campaign) => {
    const key = monthKey(campaign.startDate || campaign.createdAt)
    const current = map.get(key) || { month: key, revenue: 0, target: 0, leads: 0, won: 0 }
    current.revenue += Number(campaign.budgetSpent ?? 0)
    current.target += Number(campaign.budget ?? 0)
    current.leads += Number(campaign.actualLeads ?? 0)
    map.set(key, current)
  })

  leads.forEach((lead) => {
    const key = monthKey(lead.createdAt)
    const current = map.get(key) || { month: key, revenue: 0, target: 0, leads: 0, won: 0 }
    current.leads += 1
    if (lead.status === 'CONVERTED') current.won += 1
    map.set(key, current)
  })

  return [...map.values()]
}

const summarizeWeekly = (activities, leads) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const map = new Map(days.map((day) => [day, { day, clicks: 0, emails: 0, visits: 0, leads: 0 }]))

  activities.forEach((activity) => {
    const day = days[new Date(activity.reportDate || activity.createdAt).getDay()]
    const current = map.get(day)
    current.visits += 1
  })

  leads.forEach((lead) => {
    const day = days[new Date(lead.createdAt).getDay()]
    const current = map.get(day)
    current.leads += 1
  })

  return [...map.values()]
}

const summarizeFunnel = (leads) => {
  const total = leads.length
  const contacted = leads.filter((lead) => ['CONTACTED', 'QUALIFIED', 'CONVERTED'].includes(lead.status)).length
  const qualified = leads.filter((lead) => ['QUALIFIED', 'CONVERTED'].includes(lead.status)).length
  const converted = leads.filter((lead) => lead.status === 'CONVERTED').length
  const rate = (count) => (total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0)

  return [
    { stage: 'Leads Generated', count: total, value: 0, convRate: total ? 100 : 0 },
    { stage: 'Contacted', count: contacted, value: 0, convRate: rate(contacted) },
    { stage: 'Qualified Leads', count: qualified, value: 0, convRate: rate(qualified) },
    { stage: 'Converted Clients', count: converted, value: 0, convRate: rate(converted) },
  ]
}

const summarizeStats = (campaigns, leads) => {
  const budget = campaigns.reduce(
    (acc, campaign) => ({
      allocated: acc.allocated + Number(campaign.budget ?? 0),
      spent: acc.spent + Number(campaign.budgetSpent ?? 0),
    }),
    { allocated: 0, spent: 0 },
  )
  const converted = leads.filter((lead) => lead.status === 'CONVERTED').length

  return {
    leadsGenerated: leads.length,
    activeCampaigns: campaigns.filter((campaign) => campaign.status === 'ACTIVE').length,
    costPerLead: leads.length > 0 ? Number((budget.spent / leads.length).toFixed(2)) : 0,
    conversionRate: leads.length > 0 ? Number(((converted / leads.length) * 100).toFixed(1)) : 0,
    campaignRoi: budget.allocated > 0 ? Number((budget.spent / budget.allocated).toFixed(1)) : 0,
    websiteTraffic: 0,
    socialEngagement: 0,
    emailOpenRate: 0,
    monthlyRevenue: budget.spent,
    targetAchievement: budget.allocated > 0 ? Math.round((budget.spent / budget.allocated) * 100) : 0,
    monthlyTarget: budget.allocated,
  }
}

export const fetchMarketingDashboardData = createAsyncThunk(
  'marketingDashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const [campaignsRes, leadsRes, activitiesRes] = await Promise.all([
        api.get('/marketing/campaigns'),
        api.get('/marketing/leads'),
        api.get('/marketing/activities'),
      ])
      const campaigns = campaignsRes.data || []
      const leads = leadsRes.data || []
      const activities = activitiesRes.data || []

      return {
        kpiStats: summarizeStats(campaigns, leads),
        opportunities: campaigns.map(mapCampaign),
        monthlyRevenue: summarizeMonthly(campaigns, leads),
        weeklyData: summarizeWeekly(activities, leads),
        activities: activities.map((activity) => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.description || activity.campaign?.name || 'Marketing activity',
          time: activity.reportDate || activity.createdAt,
        })),
        funnelData: summarizeFunnel(leads),
      }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  },
)

export const createCampaignAsync = createAsyncThunk(
  'marketingDashboard/createCampaign',
  async (campaignData, { rejectWithValue }) => {
    try {
      const res = await campaignService.create({
        name: campaignData.campaign_name,
        channel: campaignData.campaign_type,
        description: campaignData.target_audience,
        budget: campaignData.budget,
        startDate: campaignData.start_date ? new Date(campaignData.start_date).toISOString() : null,
        endDate: campaignData.end_date ? new Date(campaignData.end_date).toISOString() : null,
        status: String(campaignData.status).toUpperCase(),
        successMetric: campaignData.service_promoted || 'General',
      })
      return mapCampaign(res.data)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateCampaignAsync = createAsyncThunk(
  'marketingDashboard/updateCampaign',
  async ({ id, ...campaignData }, { rejectWithValue }) => {
    try {
      const res = await campaignService.update(id, {
        name: campaignData.campaign_name,
        channel: campaignData.campaign_type,
        description: campaignData.target_audience,
        budget: campaignData.budget,
        startDate: campaignData.start_date ? new Date(campaignData.start_date).toISOString() : null,
        endDate: campaignData.end_date ? new Date(campaignData.end_date).toISOString() : null,
        status: String(campaignData.status).toUpperCase(),
        successMetric: campaignData.service_promoted || 'General',
      })
      return mapCampaign(res.data)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const deleteCampaignAsync = createAsyncThunk(
  'marketingDashboard/deleteCampaign',
  async (id, { rejectWithValue }) => {
    try {
      await campaignService.delete(id)
      return id
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateCampaignStatus = createAsyncThunk(
  'marketingDashboard/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const dbStatus = String(status).toUpperCase()
      const res = await campaignService.update(id, { status: dbStatus })
      return mapCampaign(res.data)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)


const marketingDashboardSlice = createSlice({
  name: 'marketingDashboard',
  initialState: {
    kpiStats: emptyKpiStats,
    monthlyRevenue: [],
    weeklyData: [],
    activities: [],
    opportunities: [],
    funnelData: summarizeFunnel([]),
    chartPeriod: 'monthly',
    loading: false,
    error: null,
  },
  reducers: {
    setChartPeriod(state, { payload }) { state.chartPeriod = payload },
    setLoading(state, { payload }) { state.loading = payload },
    refreshStats() {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketingDashboardData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMarketingDashboardData.fulfilled, (state, { payload }) => {
        state.loading = false
        state.kpiStats = payload.kpiStats
        state.monthlyRevenue = payload.monthlyRevenue
        state.weeklyData = payload.weeklyData
        state.activities = payload.activities
        state.opportunities = payload.opportunities
        state.funnelData = payload.funnelData
      })
      .addCase(fetchMarketingDashboardData.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload || 'Unable to load marketing dashboard'
      })
      .addCase(createCampaignAsync.fulfilled, (state, action) => {
        state.opportunities.unshift(action.payload)
      })
      .addCase(updateCampaignAsync.fulfilled, (state, action) => {
        const idx = state.opportunities.findIndex(c => c.id === action.payload.id)
        if (idx !== -1) {
          state.opportunities[idx] = action.payload
        }
      })
      .addCase(deleteCampaignAsync.fulfilled, (state, action) => {
        state.opportunities = state.opportunities.filter(c => c.id !== action.payload)
      })
      .addCase(updateCampaignStatus.fulfilled, (state, action) => {
        const idx = state.opportunities.findIndex(c => c.id === action.payload.id)
        if (idx !== -1) {
          state.opportunities[idx] = action.payload
        }
      })
  },
})

export const { setChartPeriod, setLoading, refreshStats } = marketingDashboardSlice.actions
export default marketingDashboardSlice.reducer
