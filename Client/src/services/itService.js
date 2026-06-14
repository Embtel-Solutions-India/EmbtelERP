import api from './api'

export const itService = {
  getOverview: ()        => api.get('/it/overview'),
  getSprint:   ()        => api.get('/it/sprint'),
  addTask:     (body)    => api.post('/it/sprint/tasks', body),
  moveTask:    (id, body) => api.patch(`/it/sprint/tasks/${id}`, body),
  getEod:      ()        => api.get('/it/eod'),
  submitEod:   (body)    => api.post('/it/eod', body),
}
