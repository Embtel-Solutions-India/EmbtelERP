import api from './api'

export const perspectiveService = {
    getAvailable: () => api.get('/perspectives/available'),
    switchTo: (targetUserId) => api.post('/perspectives/switch', { targetUserId }),
    reset: () => api.post('/perspectives/reset'),
    getCurrent: () => api.get('/perspectives/current'),
}