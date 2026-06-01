import api from './api'

// All methods return promises — backed by dummy data in Redux slices for now.
// Replace with real api.get/post calls when backend is ready.

export const leadService = {
  getAll:    (params)    => api.get('/leads', { params }),
  getById:   (id)        => api.get(`/leads/${id}`),
  create:    (data)      => api.post('/leads', data),
  update:    (id, data)  => api.put(`/leads/${id}`, data),
  delete:    (id)        => api.delete(`/leads/${id}`),
  updateStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }),
  import:    (file)      => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/leads/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}
