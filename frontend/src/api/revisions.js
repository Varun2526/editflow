import { api } from './client'

export const revisionsApi = {
  listAll: (status) => api.get('/api/admin/revisions', { params: { status: status || undefined } }).then((r) => r.data),
  create: (videoId, revision) => api.post(`/api/admin/videos/${videoId}/revisions`, revision).then((r) => r.data),
  resolve: (id) => api.post(`/api/admin/revisions/${id}/resolve`).then((r) => r.data),
}
