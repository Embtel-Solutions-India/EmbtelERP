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
    loginSuccess(state, { payload }) {
      state.user = payload.employee || payload
      state.isAuthenticated = true
      state.token = payload.accessToken || null
      if (payload.accessToken) {
        localStorage.setItem('crm_token', payload.accessToken)
      }
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      state.token = null
      localStorage.removeItem('crm_token')
    },
    setLoading(state, { payload }) { state.loading = payload },
    setUser(state, { payload }) { state.user = payload },
  },
})

export const { loginSuccess, logout, setLoading, setUser } = authSlice.actions
export default authSlice.reducer
