import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { dashboardService } from '../../services/dashboardService'

export const fetchDashboardOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getOverview()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fetchDashboardPerformance = createAsyncThunk(
  'dashboard/fetchPerformance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getPerformance()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fetchDashboardInsights = createAsyncThunk(
  'dashboard/fetchInsights',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getInsights()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const fetchDashboardTeam = createAsyncThunk(
  'dashboard/fetchTeam',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getTeam()
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const initialState = {
  overview: null,
  performance: [],
  insights: [],
  teams: [],
  opportunities: [],
  activities: [],
  monthlyRevenue: 0,
  weeklyData: [],
  funnelData: [],
  kpiStats: {
    targetAchievement: 0,
    monthlyRevenue: 0,
    monthlyTarget: 0,
  },
  loading: false,
  error: null,
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard(state) {
      state.overview = null
      state.performance = []
      state.insights = []
      state.teams = []
      state.opportunities = []
      state.loading = false
      state.error = null
    },
    addOpportunity(state, action) {
      state.opportunities.push(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Overview
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.loading = false
        state.overview = action.payload
        // Populate kpiStats from overview data
        const kpis = action.payload?.businessKpis || action.payload?.teamKpis || action.payload?.employeeKpis || {}
        state.kpiStats = {
          targetAchievement: kpis.targetAchievement ?? 0,
          monthlyRevenue: kpis.monthlyRevenue ?? 0,
          monthlyTarget: kpis.monthlyTarget ?? 0,
        }
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Performance
      .addCase(fetchDashboardPerformance.fulfilled, (state, action) => {
        state.performance = action.payload || []
        // Populate monthlyRevenue and weeklyData from performance data
        const perf = action.payload || []
        if (perf.length > 0) {
          state.monthlyRevenue = perf.reduce((sum, p) => sum + (p.revenue || 0), 0)
          state.weeklyData = perf.map((p) => ({
            label: p.period,
            value: p.revenue || 0,
            target: p.target || 0,
          }))
        }
      })
      // Insights
      .addCase(fetchDashboardInsights.fulfilled, (state, action) => {
        state.insights = action.payload || []
      })
      // Team
      .addCase(fetchDashboardTeam.fulfilled, (state, action) => {
        state.teams = action.payload || []
      })
  },
})

export const { clearDashboard, addOpportunity } = dashboardSlice.actions
export default dashboardSlice.reducer