import { api } from './client'

export const clientsApi = {
  list: () => api.get('/api/admin/clients').then((r) => r.data),
  get: (id) => api.get(`/api/admin/clients/${id}`).then((r) => r.data),
  create: (client) => api.post('/api/admin/clients', client).then((r) => r.data),
  update: (id, client) => api.put(`/api/admin/clients/${id}`, client).then((r) => r.data),
  portalAccess: (id) => api.post(`/api/admin/clients/${id}/portal-access`).then((r) => r.data),
}
