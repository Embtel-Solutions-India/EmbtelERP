import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { immigrationService } from '../../../services/immigrationService'

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchImmigrationKpis = createAsyncThunk(
  'immigration/fetchKpis',
  async (_, { rejectWithValue }) => {
    try { return (await immigrationService.getKpis()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationVerticals = createAsyncThunk(
  'immigration/fetchVerticals',
  async (_, { rejectWithValue }) => {
    try { return (await immigrationService.getVerticals()).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationVerticalDetail = createAsyncThunk(
  'immigration/fetchVerticalDetail',
  async (id, { rejectWithValue }) => {
    try { return (await immigrationService.getVerticalDetail(id)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationLeads = createAsyncThunk(
  'immigration/fetchLeads',
  async (params, { rejectWithValue }) => {
    try { return (await immigrationService.getLeads(params)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationRevenue = createAsyncThunk(
  'immigration/fetchRevenue',
  async (params, { rejectWithValue }) => {
    try { return (await immigrationService.getRevenue(params)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationCases = createAsyncThunk(
  'immigration/fetchCases',
  async (params, { rejectWithValue }) => {
    try { return (await immigrationService.getCases(params)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationTeam = createAsyncThunk(
  'immigration/fetchTeam',
  async (params, { rejectWithValue }) => {
    try { return (await immigrationService.getTeam(params)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationEmployeeDetail = createAsyncThunk(
  'immigration/fetchEmployeeDetail',
  async (id, { rejectWithValue }) => {
    try { return (await immigrationService.getEmployeeDetail(id)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationApprovals = createAsyncThunk(
  'immigration/fetchApprovals',
  async (params, { rejectWithValue }) => {
    try { return (await immigrationService.getApprovals(params)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationEscalations = createAsyncThunk(
  'immigration/fetchEscalations',
  async (params, { rejectWithValue }) => {
    try { return (await immigrationService.getEscalations(params)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const submitImmigrationApproval = createAsyncThunk(
  'immigration/submitApproval',
  async ({ id, decision, reason }, { rejectWithValue }) => {
    try { return (await immigrationService.processApproval(id, { decision, reason })).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

export const fetchImmigrationReports = createAsyncThunk(
  'immigration/fetchReports',
  async (params, { rejectWithValue }) => {
    try { return (await immigrationService.getReports(params)).data }
    catch (err) { return rejectWithValue(err.message) }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  kpis:           null,
  verticals:      [],
  verticalDetail: null,
  leads:          { funnel: [], items: [], total: 0, page: 1, totalPages: 0 },
  revenue:        { byPeriod: [], byVertical: [], total: 0, deals: 0 },
  cases:          { kanban: { columns: [] }, total: 0, page: 1, totalPages: 0 },
  team:           { items: [], total: 0, page: 1, totalPages: 0 },
  employeeDetail: null,
  approvals:      { items: [], total: 0, page: 1, totalPages: 0 },
  escalations:    { items: [], total: 0, page: 1, totalPages: 0 },
  reports:        null,

  loadingKpis:           false,
  loadingVerticals:      false,
  loadingVerticalDetail: false,
  loadingLeads:          false,
  loadingRevenue:        false,
  loadingCases:          false,
  loadingTeam:           false,
  loadingEmployeeDetail: false,
  loadingApprovals:      false,
  loadingEscalations:    false,
  loadingReports:        false,

  error: null,
}

function pending(loadingKey) {
  return (state) => { state[loadingKey] = true; state.error = null }
}
function rejected(loadingKey) {
  return (state, { payload }) => { state[loadingKey] = false; state.error = payload }
}

const immigrationSlice = createSlice({
  name: 'immigration',
  initialState,
  reducers: {
    clearVerticalDetail(state) { state.verticalDetail = null },
    clearEmployeeDetail(state) { state.employeeDetail = null },
  },
  extraReducers: (builder) => {
    builder
      // kpis
      .addCase(fetchImmigrationKpis.pending,    pending('loadingKpis'))
      .addCase(fetchImmigrationKpis.rejected,   rejected('loadingKpis'))
      .addCase(fetchImmigrationKpis.fulfilled,  (state, { payload }) => {
        state.loadingKpis = false; state.kpis = payload
      })
      // verticals
      .addCase(fetchImmigrationVerticals.pending,    pending('loadingVerticals'))
      .addCase(fetchImmigrationVerticals.rejected,   rejected('loadingVerticals'))
      .addCase(fetchImmigrationVerticals.fulfilled,  (state, { payload }) => {
        state.loadingVerticals = false; state.verticals = payload
      })
      // verticalDetail
      .addCase(fetchImmigrationVerticalDetail.pending,    pending('loadingVerticalDetail'))
      .addCase(fetchImmigrationVerticalDetail.rejected,   rejected('loadingVerticalDetail'))
      .addCase(fetchImmigrationVerticalDetail.fulfilled,  (state, { payload }) => {
        state.loadingVerticalDetail = false; state.verticalDetail = payload
      })
      // leads
      .addCase(fetchImmigrationLeads.pending,    pending('loadingLeads'))
      .addCase(fetchImmigrationLeads.rejected,   rejected('loadingLeads'))
      .addCase(fetchImmigrationLeads.fulfilled,  (state, { payload }) => {
        state.loadingLeads = false; state.leads = payload
      })
      // revenue
      .addCase(fetchImmigrationRevenue.pending,    pending('loadingRevenue'))
      .addCase(fetchImmigrationRevenue.rejected,   rejected('loadingRevenue'))
      .addCase(fetchImmigrationRevenue.fulfilled,  (state, { payload }) => {
        state.loadingRevenue = false; state.revenue = payload
      })
      // cases
      .addCase(fetchImmigrationCases.pending,    pending('loadingCases'))
      .addCase(fetchImmigrationCases.rejected,   rejected('loadingCases'))
      .addCase(fetchImmigrationCases.fulfilled,  (state, { payload }) => {
        state.loadingCases = false; state.cases = payload
      })
      // team
      .addCase(fetchImmigrationTeam.pending,    pending('loadingTeam'))
      .addCase(fetchImmigrationTeam.rejected,   rejected('loadingTeam'))
      .addCase(fetchImmigrationTeam.fulfilled,  (state, { payload }) => {
        state.loadingTeam = false; state.team = payload
      })
      // employee detail
      .addCase(fetchImmigrationEmployeeDetail.pending,   pending('loadingEmployeeDetail'))
      .addCase(fetchImmigrationEmployeeDetail.rejected,  rejected('loadingEmployeeDetail'))
      .addCase(fetchImmigrationEmployeeDetail.fulfilled, (state, { payload }) => {
        state.loadingEmployeeDetail = false; state.employeeDetail = payload
      })
      // approvals
      .addCase(fetchImmigrationApprovals.pending,    pending('loadingApprovals'))
      .addCase(fetchImmigrationApprovals.rejected,   rejected('loadingApprovals'))
      .addCase(fetchImmigrationApprovals.fulfilled,  (state, { payload }) => {
        state.loadingApprovals = false; state.approvals = payload
      })
      // escalations
      .addCase(fetchImmigrationEscalations.pending,    pending('loadingEscalations'))
      .addCase(fetchImmigrationEscalations.rejected,   rejected('loadingEscalations'))
      .addCase(fetchImmigrationEscalations.fulfilled,  (state, { payload }) => {
        state.loadingEscalations = false; state.escalations = payload
      })
      // reports
      .addCase(fetchImmigrationReports.pending,    pending('loadingReports'))
      .addCase(fetchImmigrationReports.rejected,   rejected('loadingReports'))
      .addCase(fetchImmigrationReports.fulfilled,  (state, { payload }) => {
        state.loadingReports = false; state.reports = payload
      })
      // approval submit
      .addCase(submitImmigrationApproval.fulfilled, (state, { meta }) => {
        const id = meta.arg.id
        state.approvals.items = state.approvals.items.filter(a => a.id !== id)
        state.approvals.total = Math.max(0, state.approvals.total - 1)
      })
  },
})

export const { clearVerticalDetail, clearEmployeeDetail } = immigrationSlice.actions
export default immigrationSlice.reducer
