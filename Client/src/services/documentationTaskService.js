import api from './api'

export const documentationTaskService = {
  getAll: (params)   => api.get('/documentation/tasks', { params }),
  create: (data)     => api.post('/documentation/tasks', data),
  update: (id, data) => api.patch(`/documentation/tasks/${id}`, data),
  delete: (id)       => api.delete(`/documentation/tasks/${id}`),
  // Direct reports the current user may assign a task to (empty for execs/interns).
  getAssignableUsers: () => api.get('/documentation/assignable-users'),
}
