import { api } from './client'

/**
 * Client portal endpoints. They never take a client id: the backend resolves the client from
 * the JWT and returns 403 for anything the caller doesn't own.
 */
export const portalApi = {
  dashboard: () => api.get('/api/client/me/dashboard').then((r) => r.data),
  profile: () => api.get('/api/client/me/profile').then((r) => r.data),
  projects: () => api.get('/api/client/me/projects').then((r) => r.data),
  project: (id) => api.get(`/api/client/me/projects/${id}`).then((r) => r.data),
  projectVideos: (id) => api.get(`/api/client/me/projects/${id}/videos`).then((r) => r.data),
  projectPayments: (id) => api.get(`/api/client/me/projects/${id}/payments`).then((r) => r.data),
  video: (id) => api.get(`/api/client/me/videos/${id}`).then((r) => r.data),
  /** The client's sign-off on a video in review (REVIEW → COMPLETED). Returns the updated video. */
  approveVideo: (videoId) => api.post(`/api/client/me/videos/${videoId}/approve`).then((r) => r.data),
  requestRevision: (videoId, revision) =>
    api.post(`/api/client/me/videos/${videoId}/revisions`, revision).then((r) => r.data),
}
