import api from './api'

export const perspectiveService = {
    getPerspectives: () => api.get('/perspectives'),
    getCurrent: () => api.get('/perspectives/current'),
    switchTo: (targetType, targetId) => api.post('/perspectives/switch', { targetType, targetId }),
    reset: () => api.post('/perspectives/reset'),
    getOrganizationTree: () => api.get('/hierarchy/organization-tree'),
    getBusinessTree: (businessId) => api.get(`/hierarchy/business/${businessId}/tree`),
    getAncestors: (employeeId) => api.get(`/hierarchy/ancestors/${employeeId}`),
    getNodeDescendants: (employeeId) => api.get(`/hierarchy/node-descendants/${employeeId}`),
    getHierarchyTree: () => api.get('/hierarchy/tree'),
    getImmigrationTree: () => api.get('/immigration/tree'),
}
