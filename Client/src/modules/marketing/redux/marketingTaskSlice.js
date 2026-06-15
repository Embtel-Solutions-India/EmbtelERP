import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { marketingTaskService } from '../../../services/marketingTaskService'

// Normalize an API MarketingTask into the shape the marketing task UI/widgets
// expect (lowercase, derived status, campaign name as `lead`). Keeps the
// existing grouped layout and dashboard widget working unchanged.
function mapTask(t) {
  const now = Date.now()
  const due = t.dueDate ? new Date(t.dueDate).getTime() : null
  let status
  if (t.status === 'COMPLETED' || t.status === 'CANCELLED') status = 'done'
  else if (due != null && due < now) status = 'overdue'
  else if (t.status === 'IN_PROGRESS') status = 'in_progress'
  else status = 'todo'
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    priority: (t.priority || 'medium').toLowerCase(),
    status,
    rawStatus: t.status,
    dueDate: t.dueDate,
    lead: t.campaign?.name ?? null,
    campaignId: t.campaignId ?? null,
    category: t.campaign ? 'campaign' : null,
    assignee: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`.trim() : 'Unassigned',
    assigneeId: t.assignedToId ?? null,
    createdById: t.createdById ?? null,
  }
}

const errMsg = (e) => e?.response?.data?.message || e?.message || 'Request failed'

export const fetchMarketingTasks = createAsyncThunk(
  'marketingTasks/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await marketingTaskService.getAll()
      return (res.data || []).map(mapTask)
    } catch (e) { return rejectWithValue(errMsg(e)) }
  },
)

export const createMarketingTask = createAsyncThunk(
  'marketingTasks/create',
  async (data, { rejectWithValue }) => {
    try { return mapTask((await marketingTaskService.create(data)).data) }
    catch (e) { return rejectWithValue(errMsg(e)) }
  },
)

export const updateMarketingTask = createAsyncThunk(
  'marketingTasks/update',
  async ({ id, ...data }, { rejectWithValue }) => {
    try { return mapTask((await marketingTaskService.update(id, data)).data) }
    catch (e) { return rejectWithValue(errMsg(e)) }
  },
)

// Flip completion using the backend enum status.
export const toggleMarketingTask = createAsyncThunk(
  'marketingTasks/toggle',
  async (task, { rejectWithValue }) => {
    const next = task.status === 'done' ? 'TODO' : 'COMPLETED'
    try { return mapTask((await marketingTaskService.update(task.id, { status: next })).data) }
    catch (e) { return rejectWithValue(errMsg(e)) }
  },
)

export const deleteMarketingTask = createAsyncThunk(
  'marketingTasks/delete',
  async (id, { rejectWithValue }) => {
    try { await marketingTaskService.delete(id); return id }
    catch (e) { return rejectWithValue(errMsg(e)) }
  },
)

const upsert = (state, task) => {
  const idx = state.list.findIndex((t) => t.id === task.id)
  if (idx !== -1) state.list[idx] = task
  else state.list.unshift(task)
}

const marketingTaskSlice = createSlice({
  name: 'marketingTasks',
  initialState: {
    list: [],
    loading: false,
    error: null,
    filter: 'all',
  },
  reducers: {
    setFilter(state, { payload }) { state.filter = payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketingTasks.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchMarketingTasks.fulfilled, (state, { payload }) => { state.loading = false; state.list = payload })
      .addCase(fetchMarketingTasks.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createMarketingTask.fulfilled, (state, { payload }) => { upsert(state, payload) })
      .addCase(updateMarketingTask.fulfilled, (state, { payload }) => { upsert(state, payload) })
      .addCase(toggleMarketingTask.fulfilled, (state, { payload }) => { upsert(state, payload) })
      .addCase(deleteMarketingTask.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((t) => t.id !== payload)
      })
  },
})

export const { setFilter } = marketingTaskSlice.actions
export default marketingTaskSlice.reducer
