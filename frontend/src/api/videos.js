import { api } from './client'

export const videosApi = {
  listAll: (status) => api.get('/api/admin/videos', { params: { status: status || undefined } }).then((r) => r.data),
  listForProject: (projectId) => api.get(`/api/admin/projects/${projectId}/videos`).then((r) => r.data),
  get: (id) => api.get(`/api/admin/videos/${id}`).then((r) => r.data),
  create: (projectId, video) => api.post(`/api/admin/projects/${projectId}/videos`, video).then((r) => r.data),
  update: (id, video) => api.put(`/api/admin/videos/${id}`, video).then((r) => r.data),
  changeStatus: (id, status) => api.patch(`/api/admin/videos/${id}/status`, { status }).then((r) => r.data),
  remove: (id) => api.delete(`/api/admin/videos/${id}`),
}
