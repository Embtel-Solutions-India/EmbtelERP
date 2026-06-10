import api from './api'

export const leadService = {
  getAll:       (params)       => api.get('/sales/leads', { params }),
  create:       (data)         => api.post('/sales/leads', data),
  update:       (id, data)     => api.patch(`/sales/leads/${id}`, data),
  updateStatus: (id, status)   => api.patch(`/sales/leads/${id}`, { status }),
  delete:       (id)           => api.delete(`/sales/leads/${id}`),
}
