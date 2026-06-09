import api from './api'

// All methods return promises — backed by dummy data in Redux slices for now.
// Replace with real api.get/post calls when backend is ready.

export const leadService = {
  getAll:    (params)    => api.get('/marketing/leads', { params }),
  create:    (data)      => api.post('/marketing/leads', data),
  update:    (id, data)  => api.patch(`/marketing/leads/${id}`, data),
  updateStatus: (id, status) => api.patch(`/marketing/leads/${id}`, { status }),
  delete:    (id)        => api.delete(`/marketing/leads/${id}`),
  import:    (file)      => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/marketing/leads/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}
