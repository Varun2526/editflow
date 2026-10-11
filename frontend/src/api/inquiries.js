import { api } from './client'

export const inquiriesApi = {
  submit: (inquiry) => api.post('/api/public/inquiries', inquiry).then((r) => r.data),
  list: (status) => api.get('/api/admin/inquiries', { params: { status: status || undefined } }).then((r) => r.data),
  get: (id) => api.get(`/api/admin/inquiries/${id}`).then((r) => r.data),
  accept: (id, details) => api.post(`/api/admin/inquiries/${id}/accept`, details).then((r) => r.data),
  reject: (id) => api.post(`/api/admin/inquiries/${id}/reject`).then((r) => r.data),
}
