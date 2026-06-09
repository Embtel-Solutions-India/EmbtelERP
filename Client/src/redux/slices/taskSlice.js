import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/tasks')
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const toggleTaskAsync = createAsyncThunk(
  'tasks/toggle',
  async (task, { rejectWithValue }) => {
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed'
      const res = await api.patch(`/tasks/${task.id}`, { status: newStatus })
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const toggleTask = createAsyncThunk(
  'tasks/toggleById',
  async (id, { getState, rejectWithValue }) => {
    try {
      const state = getState()
      const task = state.tasks.list.find(t => t.id === id)
      if (!task) throw new Error("Task not found")
      const newStatus = task.status === 'completed' ? 'todo' : 'completed'
      const res = await api.patch(`/tasks/${id}`, { status: newStatus })
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const addTask = createAsyncThunk(
  'tasks/add',
  async (taskData, { rejectWithValue }) => {
    try {
      const res = await api.post('/tasks', taskData)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ id, ...taskData }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/tasks/${id}`, taskData)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    list: [],
    loading: false,
    filter: 'all',
    error: null
  },
  reducers: {
    setFilter(state, { payload }) { state.filter = payload },
    setLoading(state, { payload }) { state.loading = payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(toggleTaskAsync.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.list.findIndex(t => t.id === updated.id)
        if (idx !== -1) {
          state.list[idx] = updated
        }
      })
      .addCase(toggleTask.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.list.findIndex(t => t.id === updated.id)
        if (idx !== -1) {
          state.list[idx] = updated
        }
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.list.push(action.payload)
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.list = state.list.filter(t => t.id !== action.payload)
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.list.findIndex(t => t.id === action.payload.id)
        if (idx !== -1) {
          state.list[idx] = action.payload
        }
      })
  }
})

export const { setFilter, setLoading } = taskSlice.actions
export default taskSlice.reducer
