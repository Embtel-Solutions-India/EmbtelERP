import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { leadService } from '../../services/leadService'

export const fetchLeads = createAsyncThunk(
  'leads/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await leadService.getAll(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const addLead = createAsyncThunk(
  'leads/add',
  async (data, { rejectWithValue }) => {
    try {
      const res = await leadService.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const addLeadAsync = addLead

export const updateLeadStatusAsync = createAsyncThunk(
  'leads/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const s = String(status).toLowerCase();
      let backendStatus = 'NEW';
      if (s === 'new') backendStatus = 'NEW';
      else if (s === 'contacted') backendStatus = 'CONTACTED';
      else if (s === 'qualified' || s === 'proposal' || s === 'negotiation') backendStatus = 'QUALIFIED';
      else if (s === 'won' || s === 'converted') backendStatus = 'CONVERTED';
      else if (s === 'lost') backendStatus = 'LOST';

      const res = await leadService.updateStatus(id, backendStatus)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateLead = createAsyncThunk(
  'leads/update',
  async (lead, { rejectWithValue }) => {
    try {
      const res = await leadService.update(lead.id, lead)
      return { ...lead, ...res.data }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const deleteLeadAsync = createAsyncThunk(
  'leads/delete',
  async (id, { rejectWithValue }) => {
    try {
      await leadService.delete(id)
      return id
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)


const leadSlice = createSlice({
  name: 'leads',
  initialState: {
    list: [],
    filteredList: [],
    selectedLead: null,
    filters: { status: '', priority: '', search: '' },
    loading: false,
    error: null,
    stats: {
      total: 0,
      newToday: 0,
      qualified: 0,
      hot: 0,
    },
  },
  reducers: {
    selectLead(state, { payload }) { state.selectedLead = payload },
    setFilter(state, { payload }) {
      state.filters = { ...state.filters, ...payload }
      state.filteredList = state.list.filter(l => {
        const { status, priority, search } = state.filters
        if (status && l.status !== status) return false
        if (priority && l.priority !== priority) return false
        if (search && !l.name.toLowerCase().includes(search.toLowerCase()) &&
            !l.company.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
    },
    setLoading(state, { payload }) { state.loading = payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false
        const leads = action.payload || []
        state.list = leads
        state.filteredList = leads
        state.stats = {
          total: leads.length,
          newToday: leads.filter(l => l.status === 'NEW' || l.status === 'new').length,
          qualified: leads.filter(l => l.status === 'QUALIFIED' || l.status === 'qualified').length,
          hot: leads.filter(l => l.priority === 'hot' || l.priority === 'high').length,
        }
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(addLeadAsync.fulfilled, (state, action) => {
        state.list.unshift(action.payload)
        state.filteredList.unshift(action.payload)
        state.stats.total += 1
      })
      .addCase(updateLeadStatusAsync.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.list.findIndex(l => l.id === updated.id)
        if (idx !== -1) {
          state.list[idx] = { ...state.list[idx], ...updated }
          const fIdx = state.filteredList.findIndex(l => l.id === updated.id)
          if (fIdx !== -1) state.filteredList[fIdx] = { ...state.filteredList[fIdx], ...updated }
        }
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.list.findIndex(l => l.id === updated.id)
        if (idx !== -1) {
          state.list[idx] = { ...state.list[idx], ...updated }
          const fIdx = state.filteredList.findIndex(l => l.id === updated.id)
          if (fIdx !== -1) state.filteredList[fIdx] = { ...state.filteredList[fIdx], ...updated }
        }
      })
      .addCase(deleteLeadAsync.fulfilled, (state, action) => {
        state.list = state.list.filter(l => l.id !== action.payload)
        state.filteredList = state.filteredList.filter(l => l.id !== action.payload)
        state.stats.total -= 1
      })
  }
})

export const { selectLead, setFilter, setLoading } = leadSlice.actions
export default leadSlice.reducer
