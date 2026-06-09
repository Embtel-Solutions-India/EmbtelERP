import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { workspaceService } from '../../services/workspaceService'

export const fetchWorkspaceLeads = createAsyncThunk(
  'workspace/fetchLeads',
  async (_, { rejectWithValue }) => {
    try { return (await workspaceService.getLeads()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchWorkspaceFollowUps = createAsyncThunk(
  'workspace/fetchFollowUps',
  async (_, { rejectWithValue }) => {
    try { return (await workspaceService.getFollowUps()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchTeamLeaderboard = createAsyncThunk(
  'workspace/fetchTeamLeaderboard',
  async (_, { rejectWithValue }) => {
    try { return (await workspaceService.getTeamLeaderboard()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchWorkspaceApprovals = createAsyncThunk(
  'workspace/fetchApprovals',
  async (_, { rejectWithValue }) => {
    try { return (await workspaceService.getApprovals()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchWorkspaceKPIs = createAsyncThunk(
  'workspace/fetchKPIs',
  async (_, { rejectWithValue }) => {
    try { return (await workspaceService.getKPIs()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchWorkspacePipeline = createAsyncThunk(
  'workspace/fetchPipeline',
  async (_, { rejectWithValue }) => {
    try { return (await workspaceService.getPipeline()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchWorkspaceActivities = createAsyncThunk(
  'workspace/fetchActivities',
  async (_, { rejectWithValue }) => {
    try { return (await workspaceService.getActivities()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchTeamStats = createAsyncThunk(
  'workspace/fetchTeamStats',
  async (_, { rejectWithValue }) => {
    try { return (await workspaceService.getTeamStats()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    leads: null,
    followUps: null,
    teamLeaderboard: [],
    approvals: null,
    kpis: null,
    pipeline: null,
    activities: [],
    teamStats: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearWorkspace(state) {
      state.leads = null
      state.followUps = null
      state.teamLeaderboard = []
      state.approvals = null
      state.kpis = null
      state.pipeline = null
      state.activities = []
      state.teamStats = []
    },
  },
  extraReducers: (builder) => {
    const handle = (thunk, key) => {
      builder
        .addCase(thunk.pending, (state) => { state.loading = true })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false
          state[key] = action.payload
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false
          state.error = action.payload
        })
    }
    handle(fetchWorkspaceLeads, 'leads')
    handle(fetchWorkspaceFollowUps, 'followUps')
    handle(fetchTeamLeaderboard, 'teamLeaderboard')
    handle(fetchWorkspaceApprovals, 'approvals')
    handle(fetchWorkspaceKPIs, 'kpis')
    handle(fetchWorkspacePipeline, 'pipeline')
    handle(fetchWorkspaceActivities, 'activities')
    handle(fetchTeamStats, 'teamStats')
  },
})

export const { clearWorkspace } = workspaceSlice.actions
export default workspaceSlice.reducer
