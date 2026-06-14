import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { orgExplorerService } from '../services/orgExplorerService'

// api.js interceptor already unwraps to the JSON body, so `.data` here is the
// `{ data: ... }` envelope → take `.data` to get the payload.
export const fetchOrgTree = createAsyncThunk(
  'orgExplorer/fetchTree',
  async (_, { rejectWithValue }) => {
    try { return (await orgExplorerService.getTree()).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

export const fetchOrgEmployee = createAsyncThunk(
  'orgExplorer/fetchEmployee',
  async (id, { rejectWithValue }) => {
    try { return (await orgExplorerService.getEmployee(id)).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

export const fetchOrgEmployeeTasks = createAsyncThunk(
  'orgExplorer/fetchEmployeeTasks',
  async ({ id, period }, { rejectWithValue }) => {
    try { return (await orgExplorerService.getEmployeeTasks(id, period)).data }
    catch (err) { return rejectWithValue(err.message) }
  },
)

const orgExplorerSlice = createSlice({
  name: 'orgExplorer',
  initialState: {
    tree: { businesses: [] },
    loadingTree: false,
    employee: null,
    loadingEmployee: false,
    tasks: { period: 'daily', total: 0, tasks: [] },
    loadingTasks: false,
    error: null,
  },
  reducers: {
    clearOrgEmployee(state) {
      state.employee = null
      state.tasks = { period: 'daily', total: 0, tasks: [] }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrgTree.pending,   (state) => { state.loadingTree = true; state.error = null })
      .addCase(fetchOrgTree.fulfilled, (state, { payload }) => {
        state.loadingTree = false
        state.tree = payload || { businesses: [] }
      })
      .addCase(fetchOrgTree.rejected,  (state, { payload }) => { state.loadingTree = false; state.error = payload })

      .addCase(fetchOrgEmployee.pending,   (state) => { state.loadingEmployee = true })
      .addCase(fetchOrgEmployee.fulfilled, (state, { payload }) => { state.loadingEmployee = false; state.employee = payload })
      .addCase(fetchOrgEmployee.rejected,  (state, { payload }) => { state.loadingEmployee = false; state.error = payload })

      .addCase(fetchOrgEmployeeTasks.pending,   (state) => { state.loadingTasks = true })
      .addCase(fetchOrgEmployeeTasks.fulfilled, (state, { payload }) => {
        state.loadingTasks = false
        state.tasks = payload || { period: 'daily', total: 0, tasks: [] }
      })
      .addCase(fetchOrgEmployeeTasks.rejected,  (state, { payload }) => { state.loadingTasks = false; state.error = payload })
  },
})

export const { clearOrgEmployee } = orgExplorerSlice.actions
export default orgExplorerSlice.reducer
