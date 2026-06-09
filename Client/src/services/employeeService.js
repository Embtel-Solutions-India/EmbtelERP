import api from './api'

export const employeeService = {
  getAll:     (params)   => api.get('/employees', { params }),
  getById:    (id)       => api.get(`/employees/${id}`),
  create:     (data)     => api.post('/employees', data),
  update:     (id, data) => api.patch(`/employees/${id}`, data),
  deactivate: (id)       => api.delete(`/employees/${id}`),
}
