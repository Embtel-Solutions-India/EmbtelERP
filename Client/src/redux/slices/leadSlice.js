import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { leadService } from '../../services/leadService'

// New lead lifecycle workflow (Section 5).
const PIPELINE_STAGES = [
  'NEW', 'CONTACTED', 'CONSULTATION_SCHEDULED', 'DOCUMENTS_REQUESTED',
  'QUALIFIED', 'CONVERTED', 'TRANSFERRED', 'LOST',
]

const norm = (v) => String(v ?? '').toUpperCase()
const money = (l) => Number(l.paymentAmount ?? l.estimatedValue ?? l.value ?? 0)
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

// Derive sales KPI summary + pipeline from the sales lead list so dashboards
// reflect real sales data and stay live after every mutation.
function computeSummary(list) {
  const by = (s) => list.filter((l) => norm(l.status) === s).length
  const total = list.length
  const converted = by('CONVERTED')
  const totalValue = list.reduce((sum, l) => sum + Number(l.estimatedValue ?? l.value ?? 0), 0)
  const now = new Date()
  const monthlyRevenue = list
    .filter((l) => norm(l.status) === 'CONVERTED' && l.convertedAt && sameMonth(new Date(l.convertedAt), now))
    .reduce((s, l) => s + money(l), 0)

  return {
    total,
    new: by('NEW'),
    contacted: by('CONTACTED'),
    consultationScheduled: by('CONSULTATION_SCHEDULED'),
    documentsRequested: by('DOCUMENTS_REQUESTED'),
    qualified: by('QUALIFIED'),
    converted,
    won: converted, // alias consumed by legacy KPI widgets
    transferred: by('TRANSFERRED'),
    lost: by('LOST'),
    hot: list.filter((l) => ['hot', 'high'].includes(String(l.priority).toLowerCase())).length,
    totalValue,
    monthlyRevenue: Math.round(monthlyRevenue),
    conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    paymentPending: list.filter((l) => ['INITIATED', 'IN_PROGRESS', 'PARTIALLY_DONE'].includes(norm(l.paymentStatus))).length,
    paymentDone: list.filter((l) => norm(l.paymentStatus) === 'DONE').length,
  }
}

function computePipeline(list) {
  return PIPELINE_STAGES.map((stage) => {
    const stageLeads = list.filter((l) => norm(l.status) === stage)
    return {
      stage,
      count: stageLeads.length,
      value: Math.round(stageLeads.reduce((s, l) => s + Number(l.estimatedValue ?? l.value ?? 0), 0)),
    }
  })
}

function applyFilters(list, filters) {
  const { status, priority, paymentStatus, search } = filters
  const q = search?.toLowerCase()
  return list.filter((l) => {
    if (status && l.status !== status) return false
    if (priority && l.priority !== priority) return false
    if (paymentStatus && l.paymentStatus !== paymentStatus) return false
    if (q && ![l.name, l.company, l.email, l.phone, l.leadCode]
      .some((f) => f?.toLowerCase().includes(q))) return false
    return true
  })
}

function recompute(state) {
  state.filteredList = applyFilters(state.list, state.filters)
  state.summary = computeSummary(state.list)
  state.pipeline = computePipeline(state.list)
  state.stats = {
    total: state.summary.total,
    newToday: state.summary.new,
    qualified: state.summary.qualified,
    hot: state.summary.hot,
  }
}

export const fetchLeads = createAsyncThunk('leads/fetchAll', async (params, { rejectWithValue }) => {
  try { return (await leadService.getAll(params)).data } catch (err) { return rejectWithValue(err.message) }
})

export const addLead = createAsyncThunk('leads/add', async (data, { rejectWithValue }) => {
  try { return (await leadService.create(data)).data } catch (err) { return rejectWithValue(err.message) }
})
export const addLeadAsync = addLead

export const updateLeadStatusAsync = createAsyncThunk('leads/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const s = String(status).toUpperCase()
    const valid = PIPELINE_STAGES.includes(s) ? s : 'NEW'
    return (await leadService.updateStatus(id, valid)).data
  } catch (err) { return rejectWithValue(err.message) }
})

export const updateLead = createAsyncThunk('leads/update', async (lead, { rejectWithValue }) => {
  try { return { ...lead, ...(await leadService.update(lead.id, lead)).data } } catch (err) { return rejectWithValue(err.message) }
})

export const convertLead = createAsyncThunk('leads/convert', async (id, { rejectWithValue }) => {
  try { return (await leadService.convert(id)).data } catch (err) { return rejectWithValue(err.message) }
})

export const transferLead = createAsyncThunk('leads/transfer', async (id, { rejectWithValue }) => {
  try { return (await leadService.transfer(id)).data } catch (err) { return rejectWithValue(err.message) }
})

export const deleteLeadAsync = createAsyncThunk('leads/delete', async (id, { rejectWithValue }) => {
  try { await leadService.delete(id); return id } catch (err) { return rejectWithValue(err.message) }
})

function upsert(state, updated) {
  const idx = state.list.findIndex((l) => l.id === updated.id)
  if (idx !== -1) state.list[idx] = { ...state.list[idx], ...updated }
  recompute(state)
}

const leadSlice = createSlice({
  name: 'leads',
  initialState: {
    list: [],
    filteredList: [],
    selectedLead: null,
    filters: { status: '', priority: '', paymentStatus: '', search: '' },
    loading: false,
    error: null,
    stats: { total: 0, newToday: 0, qualified: 0, hot: 0 },
    summary: computeSummary([]),
    pipeline: computePipeline([]),
  },
  reducers: {
    selectLead(state, { payload }) { state.selectedLead = payload },
    setFilter(state, { payload }) {
      state.filters = { ...state.filters, ...payload }
      state.filteredList = applyFilters(state.list, state.filters)
    },
    setLoading(state, { payload }) { state.loading = payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
        recompute(state)
      })
      .addCase(fetchLeads.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(addLeadAsync.fulfilled, (state, action) => { state.list.unshift(action.payload); recompute(state) })
      .addCase(updateLeadStatusAsync.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(updateLead.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(convertLead.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(transferLead.fulfilled, (state, action) => upsert(state, action.payload))
      .addCase(deleteLeadAsync.fulfilled, (state, action) => {
        state.list = state.list.filter((l) => l.id !== action.payload)
        recompute(state)
      })
  },
})

export const { selectLead, setFilter, setLoading } = leadSlice.actions
export default leadSlice.reducer
