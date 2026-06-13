import api from './api'

export const marketingTaskService = {
  getAll: (params)   => api.get('/marketing/tasks', { params }),
  create: (data)     => api.post('/marketing/tasks', data),
  update: (id, data) => api.patch(`/marketing/tasks/${id}`, data),
  delete: (id)       => api.delete(`/marketing/tasks/${id}`),
  // Team members the current user may assign a task to (empty for execs/interns).
  getAssignableUsers: () => api.get('/marketing/assignable-users'),
}
