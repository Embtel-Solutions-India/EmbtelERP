import api from './api'

export const leadService = {
  getAll:         (params)     => api.get('/sales/leads', { params }),
  create:         (data)       => api.post('/sales/leads', data),
  update:         (id, data)   => api.patch(`/sales/leads/${id}`, data),
  updateStatus:   (id, status) => api.patch(`/sales/leads/${id}`, { status }),
  delete:         (id)         => api.delete(`/sales/leads/${id}`),
  convert:        (id)         => api.post(`/sales/leads/${id}/convert`),
  transfer:       (id)         => api.post(`/sales/leads/${id}/transfer`),
  getLeaderboard: ()           => api.get('/sales/leaderboard'),
  getTeamStats:   ()           => api.get('/sales/team-stats'),
}
