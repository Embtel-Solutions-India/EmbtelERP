import api from './api'

export const perspectiveService = {
    getPerspectives: () => api.get('/perspectives'),
    getCurrent: () => api.get('/perspectives/current'),
    switchTo: (targetType, targetId) => api.post('/perspectives/switch', { targetType, targetId }),
    reset: () => api.post('/perspectives/reset'),
}