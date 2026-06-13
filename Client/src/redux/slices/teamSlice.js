import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { employeeService } from '../../services/employeeService'

// Map a live Employee record into the shape the team components expect.
function mapEmployeeToMember(e, department = 'Sales') {
  return {
    id: e.id,
    full_name: e.fullName || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
    employee_id: e.employeeCode || e.id,
    email: e.email || '',
    phone: e.phone || '—',
    department,
    designation: e.designation || department,
    reporting_manager: e.manager ? `${e.manager.firstName ?? ''} ${e.manager.lastName ?? ''}`.trim() : '—',
    joining_date: e.joiningDate || e.createdAt || null,
    status: e.isActive === false ? 'Inactive' : 'Active',
    avatar: e.avatar || undefined,
  }
}

// Load Sales department members from the live employees API (no demo data).
export const fetchSalesTeam = createAsyncThunk(
  'team/fetchSales',
  async (_, { rejectWithValue }) => {
    try {
      const res = await employeeService.getAll()
      const list = res.data || []
      return list
        .filter((e) => {
          const dept = typeof e.department === 'object' ? e.department?.name : e.department
          return `${e.designation || ''} ${dept || ''}`.toLowerCase().includes('sales')
        })
        .map(mapEmployeeToMember)
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

// Load Marketing department members from the live employees API (no demo data).
export const fetchMarketingTeam = createAsyncThunk(
  'team/fetchMarketing',
  async (_, { rejectWithValue }) => {
    try {
      const res = await employeeService.getAll()
      const list = res.data || []
      return list
        .filter((e) => {
          const dept = typeof e.department === 'object' ? e.department?.name : e.department
          return (dept || '').toLowerCase() === 'marketing'
        })
        .map((e) => mapEmployeeToMember(e, 'Marketing'))
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const teamSlice = createSlice({
  name: 'team',
  initialState: {
    sales: [],
    marketing: [],
    loading: false
  },
  reducers: {
    addTeamMember(state, { payload: { department, member } }) {
      const targetList = department.toLowerCase() === 'sales' ? 'sales' : 'marketing'
      state[targetList].unshift(member)
    },
    updateTeamMember(state, { payload: { department, member } }) {
      const targetList = department.toLowerCase() === 'sales' ? 'sales' : 'marketing'
      const idx = state[targetList].findIndex(m => m.id === member.id)
      if (idx !== -1) {
        state[targetList][idx] = { ...state[targetList][idx], ...member }
      }
    },
    deleteTeamMember(state, { payload: { department, id } }) {
      const targetList = department.toLowerCase() === 'sales' ? 'sales' : 'marketing'
      state[targetList] = state[targetList].filter(m => m.id !== id)
    },
    bulkDelete(state, { payload: { department, ids } }) {
      const targetList = department.toLowerCase() === 'sales' ? 'sales' : 'marketing'
      state[targetList] = state[targetList].filter(m => !ids.includes(m.id))
    },
    bulkUpdateStatus(state, { payload: { department, ids, status } }) {
      const targetList = department.toLowerCase() === 'sales' ? 'sales' : 'marketing'
      state[targetList].forEach(m => {
        if (ids.includes(m.id)) {
          m.status = status
        }
      })
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesTeam.pending, (state) => { state.loading = true })
      .addCase(fetchSalesTeam.fulfilled, (state, action) => {
        state.loading = false
        state.sales = action.payload
      })
      .addCase(fetchSalesTeam.rejected, (state) => { state.loading = false })
      .addCase(fetchMarketingTeam.pending, (state) => { state.loading = true })
      .addCase(fetchMarketingTeam.fulfilled, (state, action) => {
        state.loading = false
        state.marketing = action.payload
      })
      .addCase(fetchMarketingTeam.rejected, (state) => { state.loading = false })
  }
})

export const {
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  bulkDelete,
  bulkUpdateStatus
} = teamSlice.actions

export const bulkDeleteMembers = bulkDelete
export const bulkUpdateMemberStatus = bulkUpdateStatus

export default teamSlice.reducer
