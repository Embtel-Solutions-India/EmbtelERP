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
  async (_, { rejectWithValue }) => {
    try { return (await itService.getSprint()).data }
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
  async ({ id, ...body }, { rejectWithValue, dispatch }) => {
    try {
      const task = (await itService.moveTask(id, body)).data
      dispatch(fetchItSprint())
      dispatch(fetchItOverview())
      return task
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
    loadingOverview: false,
    loadingSprint: false,
    loadingEod: false,
    submitting: false,
    error: null,
  },
  reducers: {},
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
  },
})

export default itSlice.reducer
