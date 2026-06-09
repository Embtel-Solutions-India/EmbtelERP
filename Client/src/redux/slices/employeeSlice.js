import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { employeeService } from '../../services/employeeService'

export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await employeeService.getAll(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const createEmployeeAsync = createAsyncThunk(
  'employees/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await employeeService.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateEmployeeAsync = createAsyncThunk(
  'employees/update',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await employeeService.update(id, data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const deactivateEmployeeAsync = createAsyncThunk(
  'employees/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      await employeeService.deactivate(id)
      return id
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    setLoading(state, { payload }) { state.loading = payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createEmployeeAsync.fulfilled, (state, action) => {
        state.list.push(action.payload)
      })
      .addCase(updateEmployeeAsync.fulfilled, (state, action) => {
        const idx = state.list.findIndex(e => e.id === action.payload.id)
        if (idx !== -1) {
          state.list[idx] = action.payload
        }
      })
      .addCase(deactivateEmployeeAsync.fulfilled, (state, action) => {
        const idx = state.list.findIndex(e => e.id === action.payload)
        if (idx !== -1) {
          state.list[idx].isActive = false
        }
      })
  }
})

export const { setLoading } = employeeSlice.actions
export default employeeSlice.reducer
