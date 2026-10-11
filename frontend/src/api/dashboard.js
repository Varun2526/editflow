import { api } from './client'

export const dashboardApi = {
  summary: () => api.get('/api/admin/dashboard/summary').then((r) => r.data),
  tasks: () => api.get('/api/admin/dashboard/tasks').then((r) => r.data),
}
