import api from './api'

export const documentService = {
  getAll: (params)   => api.get('/documents', { params }),
  create: (data)     => api.post('/documents', data),
  update: (id, data) => api.patch(`/documents/${id}`, data),
  delete: (id)       => api.delete(`/documents/${id}`),
}
