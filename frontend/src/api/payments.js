import { api } from './client'

export const paymentsApi = {
  overview: () => api.get('/api/admin/payments').then((r) => r.data),
  listForProject: (projectId) => api.get(`/api/admin/projects/${projectId}/payments`).then((r) => r.data),
  record: (projectId, payment) => api.post(`/api/admin/projects/${projectId}/payments`, payment).then((r) => r.data),
  remove: (id) => api.delete(`/api/admin/payments/${id}`),
}
