import api from './api'

export const meetingService = {
  getAll:    (params)   => api.get('/meetings', { params }),
  getById:   (id)       => api.get(`/meetings/${id}`),
  create:    (data)     => api.post('/meetings', data),
  update:    (id, data) => api.put(`/meetings/${id}`, data),
  cancel:    (id)       => api.patch(`/meetings/${id}/cancel`),
  reschedule:(id, data) => api.patch(`/meetings/${id}/reschedule`, data),
}
