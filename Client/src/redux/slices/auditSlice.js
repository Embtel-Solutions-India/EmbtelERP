import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { auditService } from '../../services/auditService'

const defaultFilters = {
  search: '',
  action: '',
  entityType: '',
  department: '',
  dateFrom: '',
  dateTo: '',
  sort: 'createdAt',
  order: 'desc',
  page: 1,
  pageSize: 25,
}

export const fetchAuditLogs = createAsyncThunk(
  'audit/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // Strip empty values so they aren't sent as query params.
      const clean = Object.fromEntries(
        Object.entries(params || {}).filter(([, v]) => v !== '' && v != null)
      )
      const res = await auditService.getAuditLogs(clean)
      return res // { data, total, page, pageSize }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const auditSlice = createSlice({
  name: 'audit',
  initialState: {
    logs: [],
    total: 0,
    page: 1,
    pageSize: 25,
    filters: { ...defaultFilters },
    loading: false,
    error: null,
  },
  reducers: {
    setAuditFilter(state, { payload }) {
      // Any filter change (except explicit page) resets to page 1.
      const resetsPage = !('page' in payload)
      state.filters = { ...state.filters, ...payload, ...(resetsPage ? { page: 1 } : {}) }
    },
    resetAuditFilters(state) {
      state.filters = { ...defaultFilters }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false
        state.logs = action.payload?.data || []
        state.total = action.payload?.total || 0
        state.page = action.payload?.page || 1
        state.pageSize = action.payload?.pageSize || 25
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setAuditFilter, resetAuditFilters } = auditSlice.actions
export default auditSlice.reducer
