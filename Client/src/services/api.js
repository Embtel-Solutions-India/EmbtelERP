import axios from 'axios'

// Base API instance — swap BASE_URL for real backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  // Generous timeout: the DB is a remote pooled connection, so a request can
  // chain several round-trips. 10s was too tight and caused spurious failures.
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // An expired/invalid token leaves a stale `crm_token` in localStorage, which
    // makes the app boot as "authenticated" yet 401 on every request. Clear the
    // session and bounce to login instead of leaving a broken dashboard.
    if (error.response?.status === 401) {
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    const message = error.response?.data?.message || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default api
