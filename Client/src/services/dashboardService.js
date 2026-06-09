import api from './api'

export const dashboardService = {
  getOverview: () => api.get('/dashboard/overview'),
  getPerformance: () => api.get('/dashboard/performance'),
  getInsights: () => api.get('/dashboard/insights'),
  getTeam: () => api.get('/dashboard/team'),
  getWorkspace: () => api.get('/dashboard/workspace'),
  getSummary: () => api.get('/dashboard/summary'),
}
