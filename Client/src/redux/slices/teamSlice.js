import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { employeeService } from '../../services/employeeService'

// Map a live Employee record into the shape the team components expect.
function mapEmployeeToMember(e) {
  return {
    id: e.id,
    full_name: e.fullName || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim(),
    employee_id: e.employeeCode || e.id,
    email: e.email || '',
    phone: e.phone || '—',
    department: 'Sales',
    designation: e.designation || 'Sales',
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

const initialMarketingTeam = [
  {
    id: 5,
    full_name: 'Riya Kapoor',
    employee_id: 'EMP-M001',
    email: 'riya@crmpro.com',
    phone: '+91 98765 00011',
    department: 'Marketing',
    designation: 'Marketing Executive',
    reporting_manager: 'Ananya Roy',
    joining_date: '2025-02-20',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
  },
  {
    id: 6,
    full_name: 'Arjun Mehta',
    employee_id: 'EMP-M002',
    email: 'arjun@crmpro.com',
    phone: '+91 98765 00012',
    department: 'Marketing',
    designation: 'Marketing Executive',
    reporting_manager: 'Ananya Roy',
    joining_date: '2025-05-12',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
  },
  {
    id: 7,
    full_name: 'Karan Malhotra',
    employee_id: 'EMP-M003',
    email: 'karan@crmpro.com',
    phone: '+91 98765 00013',
    department: 'Marketing',
    designation: 'Marketing Intern',
    reporting_manager: 'Riya Kapoor',
    joining_date: '2026-01-10',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
  },
  {
    id: 8,
    full_name: 'Sneha Jain',
    employee_id: 'EMP-M004',
    email: 'sneha@crmpro.com',
    phone: '+91 98765 00014',
    department: 'Marketing',
    designation: 'Marketing Intern',
    reporting_manager: 'Arjun Mehta',
    joining_date: '2026-04-15',
    status: 'On Leave',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9'
  }
]

const teamSlice = createSlice({
  name: 'team',
  initialState: {
    sales: [],
    marketing: initialMarketingTeam,
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
