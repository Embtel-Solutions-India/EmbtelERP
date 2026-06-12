import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { salesTaskService } from '../../services/salesTaskService'

const DONE = ['COMPLETED', 'CANCELLED']
const isDone = (t) => DONE.includes(String(t.status).toUpperCase())

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d }
const inToday = (val) => {
  if (!val) return false
  const d = new Date(val)
  return d >= startOfToday() && d <= endOfToday()
}

// KPI counters derived from the task list so dashboards stay live after mutations.
function computeSummary(list) {
  const pending = list.filter((t) => !isDone(t))
  return {
    total: list.length,
    pending: pending.length,
    completed: list.filter((t) => String(t.status).toUpperCase() === 'COMPLETED').length,
    todayFollowUps: list.filter((t) => inToday(t.nextFollowUpDate) || (!isDone(t) && inToday(t.dueDate))).length,
    overdue: pending.filter((t) => t.dueDate && new Date(t.dueDate) < startOfToday()).length,
    consultationsScheduled: list.filter((t) => String(t.taskType).toUpperCase() === 'CONSULTATION_MEETING').length,
  }
}

export const fetchSalesTasks = createAsyncThunk('salesTasks/fetchAll', async (params, { rejectWithValue }) => {
  try { return (await salesTaskService.getAll(params)).data } catch (err) { return rejectWithValue(err.message) }
})

export const addSalesTask = createAsyncThunk('salesTasks/add', async (data, { rejectWithValue }) => {
  try { return (await salesTaskService.create(data)).data } catch (err) { return rejectWithValue(err.message) }
})

export const updateSalesTask = createAsyncThunk('salesTasks/update', async ({ id, ...data }, { rejectWithValue }) => {
  try { return (await salesTaskService.update(id, data)).data } catch (err) { return rejectWithValue(err.message) }
})

export const deleteSalesTask = createAsyncThunk('salesTasks/delete', async (id, { rejectWithValue }) => {
  try { await salesTaskService.delete(id); return id } catch (err) { return rejectWithValue(err.message) }
})

const recompute = (state) => { state.summary = computeSummary(state.list) }

const salesTaskSlice = createSlice({
  name: 'salesTasks',
  initialState: {
    list: [],
    loading: false,
    error: null,
    summary: computeSummary([]),
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesTasks.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchSalesTasks.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
        recompute(state)
      })
      .addCase(fetchSalesTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(addSalesTask.fulfilled, (state, action) => { state.list.unshift(action.payload); recompute(state) })
      .addCase(updateSalesTask.fulfilled, (state, action) => {
        const idx = state.list.findIndex((t) => t.id === action.payload.id)
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload }
        recompute(state)
      })
      .addCase(deleteSalesTask.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t.id !== action.payload)
        recompute(state)
      })
  },
})

export default salesTaskSlice.reducer
