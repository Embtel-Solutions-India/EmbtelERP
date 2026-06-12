import api from './api'

export const salesTargetService = {
  getAll:     (params)         => api.get('/sales/targets', { params }),
  getSummary: ()               => api.get('/sales/targets/summary'),
  getAssignable: ()            => api.get('/sales/targets/assignable'),
  get:        (id)             => api.get(`/sales/targets/${id}`),
  getHistory: (id)             => api.get(`/sales/targets/${id}/history`),
  create:     (data)           => api.post('/sales/targets', data),
  update:     (id, data)       => api.patch(`/sales/targets/${id}`, data),
  reassign:   (id, assignedToId) => api.post(`/sales/targets/${id}/reassign`, { assignedToId }),
  cancel:     (id)             => api.post(`/sales/targets/${id}/cancel`),
}
