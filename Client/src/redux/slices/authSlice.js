import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: localStorage.getItem('crm_token') || null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, { payload }) { state.user = payload; state.isAuthenticated = true },
    updateProfile(state, { payload }) { state.user = { ...state.user, ...payload } },
    logout(state) { state.user = null; state.isAuthenticated = false },
    setLoading(state, { payload }) { state.loading = payload },
    setUser(state, { payload }) { state.user = payload },
  },
})

export const { loginSuccess, updateProfile, logout, setLoading } = authSlice.actions
export default authSlice.reducer
