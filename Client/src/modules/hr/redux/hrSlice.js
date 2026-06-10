import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../../services/api'

const isWithinDays = (dateStr, days) => {
  if (!dateStr) return false
  return new Date(dateStr) >= new Date(Date.now() - days * 86400000)
}

const groupByKey = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = item[key] ?? 'Unassigned'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

export const fetchHRData = createAsyncThunk(
  'hr/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/employees')
      const employees = res.data || []

      const active = employees.filter(e => e.isActive !== false)
      const recentHires = employees.filter(e => isWithinDays(e.createdAt, 30))
      const byDesignation = groupByKey(employees, 'designation')
      const byLevel = groupByKey(employees, 'level')

      const LEVEL_LABELS = ['Intern', 'Executive', 'Manager', 'Head', 'Owner', 'Admin']

      return {
        totalHeadcount: employees.length,
        activeCount: active.length,
        inactiveCount: employees.length - active.length,
        recentHiresCount: recentHires.length,
        recentHires: recentHires.slice(0, 10),
        headcountByDesignation: Object.entries(byDesignation)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
        headcountByLevel: [0, 1, 2, 3, 4, 5].map(lvl => ({
          level: LEVEL_LABELS[lvl],
          count: byLevel[lvl] ?? byLevel[String(lvl)] ?? 0,
        })),
        employees,
      }
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const hrSlice = createSlice({
  name: 'hr',
  initialState: {
    totalHeadcount: 0,
    activeCount: 0,
    inactiveCount: 0,
    recentHiresCount: 0,
    recentHires: [],
    headcountByDesignation: [],
    headcountByLevel: [],
    employees: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchHRData.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchHRData.fulfilled, (state, { payload }) => {
        state.loading = false
        Object.assign(state, payload)
      })
      .addCase(fetchHRData.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload || 'Failed to load HR data'
      })
  },
})

export default hrSlice.reducer
