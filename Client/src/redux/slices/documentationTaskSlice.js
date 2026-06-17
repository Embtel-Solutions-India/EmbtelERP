import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { documentationTaskService } from '../../services/documentationTaskService'

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
  }
}

export const fetchDocumentationTasks = createAsyncThunk('documentationTasks/fetchAll', async (params, { rejectWithValue }) => {
  try { return (await documentationTaskService.getAll(params)).data } catch (err) { return rejectWithValue(err.message) }
})

export const addDocumentationTask = createAsyncThunk('documentationTasks/add', async (data, { rejectWithValue }) => {
  try { return (await documentationTaskService.create(data)).data } catch (err) { return rejectWithValue(err.message) }
})

export const updateDocumentationTask = createAsyncThunk('documentationTasks/update', async ({ id, ...data }, { rejectWithValue }) => {
  try { return (await documentationTaskService.update(id, data)).data } catch (err) { return rejectWithValue(err.message) }
})

export const deleteDocumentationTask = createAsyncThunk('documentationTasks/delete', async (id, { rejectWithValue }) => {
  try { await documentationTaskService.delete(id); return id } catch (err) { return rejectWithValue(err.message) }
})

const recompute = (state) => { state.summary = computeSummary(state.list) }

const documentationTaskSlice = createSlice({
  name: 'documentationTasks',
  initialState: {
    list: [],
    loading: false,
    error: null,
    summary: computeSummary([]),
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocumentationTasks.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchDocumentationTasks.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
        recompute(state)
      })
      .addCase(fetchDocumentationTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(addDocumentationTask.fulfilled, (state, action) => { state.list.unshift(action.payload); recompute(state) })
      .addCase(updateDocumentationTask.fulfilled, (state, action) => {
        const idx = state.list.findIndex((t) => t.id === action.payload.id)
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload }
        recompute(state)
      })
      .addCase(deleteDocumentationTask.fulfilled, (state, action) => {
        state.list = state.list.filter((t) => t.id !== action.payload)
        recompute(state)
      })
  },
})

export default documentationTaskSlice.reducer
