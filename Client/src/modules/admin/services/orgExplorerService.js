import api from '../../../services/api'

// Super-Admin-only Organization Explorer endpoints (backend rejects other roles).
export const orgExplorerService = {
  getTree:          ()           => api.get('/hierarchy/super-admin/organization-tree'),
  getEmployee:      (id)         => api.get(`/hierarchy/super-admin/employee/${id}`),
  getEmployeeTasks: (id, period) => api.get(`/hierarchy/super-admin/employee/${id}/tasks`, { params: { period } }),
}
