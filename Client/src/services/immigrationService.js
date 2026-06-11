import api from './api'

export const immigrationService = {
  getKpis:           ()         => api.get('/immigration/kpis'),
  getVerticals:      ()         => api.get('/immigration/verticals'),
  getVerticalDetail: (id)       => api.get(`/immigration/verticals/${id}`),
  getLeads:          (params)   => api.get('/immigration/leads',       { params }),
  getRevenue:        (params)   => api.get('/immigration/revenue',     { params }),
  getCases:          (params)   => api.get('/immigration/cases',       { params }),
  getTeam:           (params)   => api.get('/immigration/team',        { params }),
  getEmployeeDetail: (id)       => api.get(`/immigration/team/${id}`),
  getApprovals:      (params)   => api.get('/immigration/approvals',   { params }),
  processApproval:   (id, body) => api.patch(`/immigration/approvals/${id}`, body),
  getEscalations:    (params)   => api.get('/immigration/escalations', { params }),
  getReports:        (params)   => api.get('/immigration/reports',     { params }),
}
