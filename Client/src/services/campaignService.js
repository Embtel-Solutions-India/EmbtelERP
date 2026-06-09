import api from './api'

export const campaignService = {
  getAll:       (params)   => api.get('/marketing/campaigns', { params }),
  create:       (data)     => api.post('/marketing/campaigns', data),
  update:       (id, data) => api.patch(`/marketing/campaigns/${id}`, data),
  delete:       (id)       => api.delete(`/marketing/campaigns/${id}`),
}
