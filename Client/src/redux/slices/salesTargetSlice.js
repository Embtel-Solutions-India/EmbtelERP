import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { salesTargetService } from '../../services/salesTargetService'

export const fetchSalesTargets = createAsyncThunk('salesTargets/fetchAll', async (params, { rejectWithValue }) => {
  try { return (await salesTargetService.getAll(params)).data } catch (e) { return rejectWithValue(e.message) }
})

export const fetchTargetSummary = createAsyncThunk('salesTargets/summary', async (_, { rejectWithValue }) => {
  try { return (await salesTargetService.getSummary()).data } catch (e) { return rejectWithValue(e.message) }
})

export const fetchAssignableUsers = createAsyncThunk('salesTargets/assignable', async (_, { rejectWithValue }) => {
  try { return (await salesTargetService.getAssignable()).data } catch (e) { return rejectWithValue(e.message) }
})

export const fetchTargetHistory = createAsyncThunk('salesTargets/history', async (id, { rejectWithValue }) => {
  try { return (await salesTargetService.getHistory(id)).data } catch (e) { return rejectWithValue(e.message) }
})

export const createTarget = createAsyncThunk('salesTargets/create', async (data, { rejectWithValue }) => {
  try { return (await salesTargetService.create(data)).data } catch (e) { return rejectWithValue(e.message) }
})

export const updateTarget = createAsyncThunk('salesTargets/update', async ({ id, ...data }, { rejectWithValue }) => {
  try { return (await salesTargetService.update(id, data)).data } catch (e) { return rejectWithValue(e.message) }
})

export const reassignTarget = createAsyncThunk('salesTargets/reassign', async ({ id, assignedToId }, { rejectWithValue }) => {
  try { return (await salesTargetService.reassign(id, assignedToId)).data } catch (e) { return rejectWithValue(e.message) }
})

export const cancelTarget = createAsyncThunk('salesTargets/cancel', async (id, { rejectWithValue }) => {
  try { return (await salesTargetService.cancel(id)).data } catch (e) { return rejectWithValue(e.message) }
})

const upsert = (state, t) => {
  const i = state.list.findIndex((x) => x.id === t.id)
  if (i !== -1) state.list[i] = t
  else state.list.unshift(t)
}

const salesTargetSlice = createSlice({
  name: 'salesTargets',
  initialState: {
    list: [],
    summary: null,
    assignable: [],
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearHistory(state) { state.history = [] },
  },
  extraReducers: (b) => {
    b.addCase(fetchSalesTargets.pending, (s) => { s.loading = true; s.error = null })
     .addCase(fetchSalesTargets.fulfilled, (s, a) => { s.loading = false; s.list = a.payload || [] })
     .addCase(fetchSalesTargets.rejected, (s, a) => { s.loading = false; s.error = a.payload })
     .addCase(fetchTargetSummary.fulfilled, (s, a) => { s.summary = a.payload })
     .addCase(fetchAssignableUsers.fulfilled, (s, a) => { s.assignable = a.payload || [] })
     .addCase(fetchTargetHistory.fulfilled, (s, a) => { s.history = a.payload || [] })
     .addCase(createTarget.fulfilled, (s, a) => { upsert(s, a.payload) })
     .addCase(updateTarget.fulfilled, (s, a) => { upsert(s, a.payload) })
     .addCase(reassignTarget.fulfilled, (s, a) => { upsert(s, a.payload) })
     .addCase(cancelTarget.fulfilled, (s, a) => { upsert(s, a.payload) })
  },
})

export const { clearHistory } = salesTargetSlice.actions
export default salesTargetSlice.reducer
