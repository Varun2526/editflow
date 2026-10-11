import { api } from './client'

export const projectsApi = {
  list: (status) => api.get('/api/admin/projects', { params: { status: status || undefined } }).then((r) => r.data),
  get: (id) => api.get(`/api/admin/projects/${id}`).then((r) => r.data),
  create: (clientId, project) => api.post(`/api/admin/clients/${clientId}/projects`, project).then((r) => r.data),
  update: (id, project) => api.put(`/api/admin/projects/${id}`, project).then((r) => r.data),
  changeStatus: (id, status) => api.patch(`/api/admin/projects/${id}/status`, { status }).then((r) => r.data),
}
