import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../../services/authService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadUser() {
  try {
    const raw = localStorage.getItem('crm_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistAuth(user, token) {
  localStorage.setItem('crm_token', token)
  localStorage.setItem('crm_user', JSON.stringify(user))
}

function clearAuth() {
  localStorage.removeItem('crm_token')
  localStorage.removeItem('crm_user')
}

// ─── Async thunk ─────────────────────────────────────────────────────────────

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // api interceptor already unwraps response.data, so this is
      // { employee, accessToken, refreshToken }
      return await authService.login(email, password)
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed')
    }
  },
)

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  user:            loadUser(),
  isAuthenticated: !!localStorage.getItem('crm_token'),
  token:           localStorage.getItem('crm_token') || null,
  loading:         false,
  error:           null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // kept for backwards-compatibility with any existing callers
    loginSuccess(state, { payload }) {
      state.user            = payload
      state.isAuthenticated = true
    },
    updateProfile(state, { payload }) {
      state.user = { ...state.user, ...payload }
      if (state.user) {
        localStorage.setItem('crm_user', JSON.stringify(state.user))
      }
    },
    logout(state) {
      state.user            = null
      state.token           = null
      state.isAuthenticated = false
      state.error           = null
      clearAuth()
    },
    setLoading(state, { payload }) { state.loading = payload },
    setUser(state, { payload })    { state.user    = payload },
    clearError(state)              { state.error   = null   },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true
        state.error   = null
      })
      .addCase(loginAsync.fulfilled, (state, { payload }) => {
        const { employee, accessToken } = payload
        state.user            = employee
        state.token           = accessToken
        state.isAuthenticated = true
        state.loading         = false
        state.error           = null
        persistAuth(employee, accessToken)
      })
      .addCase(loginAsync.rejected, (state, { payload }) => {
        state.loading = false
        state.error   = payload || 'Login failed'
      })
  },
})

export const {
  loginSuccess,
  updateProfile,
  logout,
  setLoading,
  setUser,
  clearError,
} = authSlice.actions

export default authSlice.reducer
