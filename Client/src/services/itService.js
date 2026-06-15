import api from './api'

export const itService = {
  getOverview: ()        => api.get('/it/overview'),
  getSprint:   (projectId) => api.get('/it/sprint', { params: projectId ? { projectId } : undefined }),
  addTask:     (body)    => api.post('/it/sprint/tasks', body),
  moveTask:    (id, body) => api.patch(`/it/sprint/tasks/${id}`, body),
  assignTask:  (id, assigneeId) => api.post(`/it/sprint/tasks/${id}/assign`, { assigneeId }),
  getEod:      ()        => api.get('/it/eod'),
  submitEod:   (body)    => api.post('/it/eod', body),
  // Multi-project + workload + personal tasks
  getProjects: ()        => api.get('/it/projects'),
  getTeamLoad: ()        => api.get('/it/team-load'),
  getMyTasks:  (filter)  => api.get('/it/my-tasks', { params: filter ? { filter } : undefined }),
  addSelfTask:    (body)    => api.post('/it/my-tasks', body),
  updateSelfTask: (id, body) => api.patch(`/it/my-tasks/${id}`, body),
  deleteSelfTask: (id)    => api.delete(`/it/my-tasks/${id}`),
}
