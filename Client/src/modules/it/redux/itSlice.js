import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { itService } from '../../../services/itService'

const EMPTY_COLUMNS = [
  { key: 'BACKLOG', tasks: [] },
  { key: 'TODO', tasks: [] },
  { key: 'IN_PROGRESS', tasks: [] },
  { key: 'REVIEW', tasks: [] },
  { key: 'DONE', tasks: [] },
]

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchItOverview = createAsyncThunk(
  'it/fetchOverview',
  async (_, { rejectWithValue }) => {
    try { return (await itService.getOverview()).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

export const fetchItSprint = createAsyncThunk(
  'it/fetchSprint',
  async (projectId, { rejectWithValue }) => {
    try { return (await itService.getSprint(projectId || undefined)).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

export const fetchItProjects = createAsyncThunk(
  'it/fetchProjects',
  async (_, { rejectWithValue }) => {
    try { return (await itService.getProjects()).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

export const fetchItTeamLoad = createAsyncThunk(
  'it/fetchTeamLoad',
  async (_, { rejectWithValue }) => {
    try { return (await itService.getTeamLoad()).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

export const fetchItMyTasks = createAsyncThunk(
  'it/fetchMyTasks',
  async (filter, { rejectWithValue }) => {
    try { return (await itService.getMyTasks(filter)).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

export const fetchItEod = createAsyncThunk(
  'it/fetchEod',
  async (_, { rejectWithValue }) => {
    try { return (await itService.getEod()).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

export const addItTask = createAsyncThunk(
  'it/addTask',
  async (body, { rejectWithValue, dispatch }) => {
    try {
      const task = (await itService.addTask(body)).data
      // Refresh both board and overview so KPIs/columns stay in sync.
      dispatch(fetchItSprint())
      dispatch(fetchItOverview())
      return task
    } catch (err) { return rejectWithValue(err.message) }
  },
)

export const moveItTask = createAsyncThunk(
  'it/moveTask',
  async ({ id, ...body }, { rejectWithValue, dispatch, getState }) => {
    try {
      const task = (await itService.moveTask(id, body)).data
      dispatch(fetchItSprint(getState().it.activeProjectId))
      dispatch(fetchItOverview())
      return task
    } catch (err) { return rejectWithValue(err.message) }
  },
)

export const assignItTask = createAsyncThunk(
  'it/assignTask',
  async ({ id, assigneeId }, { rejectWithValue, dispatch, getState }) => {
    try {
      const task = (await itService.assignTask(id, assigneeId)).data
      dispatch(fetchItSprint(getState().it.activeProjectId))
      dispatch(fetchItTeamLoad())
      return task
    } catch (err) { return rejectWithValue(err.message) }
  },
)

export const addItSelfTask = createAsyncThunk(
  'it/addSelfTask',
  async (body, { rejectWithValue, dispatch }) => {
    try {
      const task = (await itService.addSelfTask(body)).data
      dispatch(fetchItMyTasks('all'))
      return task
    } catch (err) { return rejectWithValue(err.message) }
  },
)

export const updateItSelfTask = createAsyncThunk(
  'it/updateSelfTask',
  async ({ id, ...body }, { rejectWithValue, dispatch }) => {
    try {
      const task = (await itService.updateSelfTask(id, body)).data
      dispatch(fetchItMyTasks('all'))
      return task
    } catch (err) { return rejectWithValue(err.message) }
  },
)

export const deleteItSelfTask = createAsyncThunk(
  'it/deleteSelfTask',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await itService.deleteSelfTask(id)
      dispatch(fetchItMyTasks('all'))
      return id
    } catch (err) { return rejectWithValue(err.message) }
  },
)

export const submitItEod = createAsyncThunk(
  'it/submitEod',
  async (body, { rejectWithValue, dispatch }) => {
    try {
      const report = (await itService.submitEod(body)).data
      dispatch(fetchItEod())
      return report
    } catch (err) { return rejectWithValue(err.message) }
  },
)

const itSlice = createSlice({
  name: 'it',
  initialState: {
    overview: null,
    sprint: { sprint: null, columns: EMPTY_COLUMNS },
    eod: [],
    projects: [],
    activeProjectId: null,
    teamLoad: [],
    myTasks: [],
    loadingOverview: false,
    loadingSprint: false,
    loadingEod: false,
    loadingProjects: false,
    loadingTeamLoad: false,
    loadingMyTasks: false,
    submitting: false,
    error: null,
  },
  reducers: {
    setActiveProject: (s, a) => { s.activeProjectId = a.payload || null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItOverview.pending, (s) => { s.loadingOverview = true; s.error = null })
      .addCase(fetchItOverview.fulfilled, (s, a) => { s.loadingOverview = false; s.overview = a.payload })
      .addCase(fetchItOverview.rejected, (s, a) => { s.loadingOverview = false; s.error = a.payload })

      .addCase(fetchItSprint.pending, (s) => { s.loadingSprint = true; s.error = null })
      .addCase(fetchItSprint.fulfilled, (s, a) => {
        s.loadingSprint = false
        s.sprint = a.payload?.columns ? a.payload : { sprint: null, columns: EMPTY_COLUMNS }
      })
      .addCase(fetchItSprint.rejected, (s, a) => { s.loadingSprint = false; s.error = a.payload })

      .addCase(fetchItEod.pending, (s) => { s.loadingEod = true })
      .addCase(fetchItEod.fulfilled, (s, a) => { s.loadingEod = false; s.eod = a.payload || [] })
      .addCase(fetchItEod.rejected, (s, a) => { s.loadingEod = false; s.error = a.payload })

      .addCase(submitItEod.pending, (s) => { s.submitting = true })
      .addCase(submitItEod.fulfilled, (s) => { s.submitting = false })
      .addCase(submitItEod.rejected, (s, a) => { s.submitting = false; s.error = a.payload })

      .addCase(fetchItProjects.pending, (s) => { s.loadingProjects = true })
      .addCase(fetchItProjects.fulfilled, (s, a) => { s.loadingProjects = false; s.projects = a.payload || [] })
      .addCase(fetchItProjects.rejected, (s, a) => { s.loadingProjects = false; s.error = a.payload })

      .addCase(fetchItTeamLoad.pending, (s) => { s.loadingTeamLoad = true })
      .addCase(fetchItTeamLoad.fulfilled, (s, a) => { s.loadingTeamLoad = false; s.teamLoad = a.payload || [] })
      .addCase(fetchItTeamLoad.rejected, (s, a) => { s.loadingTeamLoad = false; s.error = a.payload })

      .addCase(fetchItMyTasks.pending, (s) => { s.loadingMyTasks = true })
      .addCase(fetchItMyTasks.fulfilled, (s, a) => { s.loadingMyTasks = false; s.myTasks = a.payload || [] })
      .addCase(fetchItMyTasks.rejected, (s, a) => { s.loadingMyTasks = false; s.error = a.payload })
  },
})

export const { setActiveProject } = itSlice.actions
export default itSlice.reducer
