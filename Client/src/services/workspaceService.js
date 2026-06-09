import api from './api'

export const workspaceService = {
  getLeads: () => api.get('/workspace/leads'),
  getFollowUps: () => api.get('/workspace/followups'),
  getTeamLeaderboard: () => api.get('/workspace/team-leaderboard'),
  getApprovals: () => api.get('/workspace/approvals'),
  getKPIs: () => api.get('/workspace/kpis'),
  getPipeline: () => api.get('/workspace/pipeline'),
  getActivities: () => api.get('/workspace/activities'),
  getTeamStats: () => api.get('/workspace/team-stats'),
}
