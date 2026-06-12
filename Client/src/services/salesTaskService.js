import api from './api'

export const salesTaskService = {
  getAll: (params)   => api.get('/sales/tasks', { params }),
  create: (data)     => api.post('/sales/tasks', data),
  update: (id, data) => api.patch(`/sales/tasks/${id}`, data),
  delete: (id)       => api.delete(`/sales/tasks/${id}`),
}
