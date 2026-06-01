import api from './api'

export const dashboardService = {
  getKPIs:         ()       => api.get('/dashboard/kpis'),
  getRevenue:      (period) => api.get('/dashboard/revenue', { params: { period } }),
  getFunnel:       ()       => api.get('/dashboard/funnel'),
  getActivities:   ()       => api.get('/dashboard/activities'),
  getOpportunities:()       => api.get('/dashboard/opportunities'),
}
