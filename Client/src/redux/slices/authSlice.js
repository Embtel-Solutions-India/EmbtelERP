import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: {
    id: 1,
    name: 'Ujjwal Anand',
    email: 'ujjwal@crmpro.com',
    role: 'Sales Executive',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ujjwal',
    phone: '+1 (555) 234-5678',
    department: 'Sales',
    team: 'Enterprise Sales',
    joinDate: '2022-03-15',
    target: 500000,
  },
  isAuthenticated: true,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, { payload }) { state.user = payload; state.isAuthenticated = true },
    updateProfile(state, { payload }) { state.user = { ...state.user, ...payload } },
    logout(state) { state.user = null; state.isAuthenticated = false },
    setLoading(state, { payload }) { state.loading = payload },
  },
})

export const { loginSuccess, updateProfile, logout, setLoading } = authSlice.actions
export default authSlice.reducer
