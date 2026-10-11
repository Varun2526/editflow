import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { RequireAuthenticated, RequireRole } from './RequireRole'
import { AdminLayout } from '../layouts/AdminLayout'
import { PortalLayout } from '../layouts/PortalLayout'
import Login from '../pages/public/Login'
import ChangePassword from '../pages/public/ChangePassword'
import NotFound from '../pages/public/NotFound'
import AdminOverview from '../pages/admin/Overview'

// Public site: loaded on demand, so the workspace never downloads the cinematic layer.
const PublicLayout = lazy(() => import('../layouts/PublicLayout').then((m) => ({ default: m.PublicLayout })))
const Landing = lazy(() => import('../pages/public/Landing'))
const WorkWithMe = lazy(() => import('../pages/public/WorkWithMe'))
const Terms = lazy(() => import('../pages/public/Legal').then((m) => ({ default: m.Terms })))
const Privacy = lazy(() => import('../pages/public/Legal').then((m) => ({ default: m.Privacy })))
const PublicFallback = <div className="min-h-screen bg-[#09090b]" />
import AdminInquiries from '../pages/admin/Inquiries'
import AdminClients from '../pages/admin/Clients'
import AdminClientDetail from '../pages/admin/ClientDetail'
import AdminProjects from '../pages/admin/Projects'
import AdminProjectDetail from '../pages/admin/ProjectDetail'
import AdminVideos from '../pages/admin/Videos'
import AdminVideoDetail from '../pages/admin/VideoDetail'
import AdminRevisions from '../pages/admin/Revisions'
import AdminPayments from '../pages/admin/Payments'
import PortalDashboard from '../pages/portal/Dashboard'
import PortalProjects from '../pages/portal/Projects'
import PortalProjectDetail from '../pages/portal/ProjectDetail'
import PortalVideos from '../pages/portal/Videos'
import PortalVideoDetail from '../pages/portal/VideoDetail'
import PortalPayments from '../pages/portal/Payments'
import PortalProfile from '../pages/portal/Profile'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Suspense fallback={PublicFallback}><PublicLayout /></Suspense>}>
        <Route index element={<Landing />} />
        <Route path="work-with-me" element={<WorkWithMe />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
      </Route>
      <Route path="login" element={<Login />} />
      <Route element={<RequireAuthenticated />}>
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      <Route path="admin" element={<RequireRole role="ADMIN" />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="clients/:id" element={<AdminClientDetail />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/:id" element={<AdminProjectDetail />} />
          <Route path="videos" element={<AdminVideos />} />
          <Route path="videos/:id" element={<AdminVideoDetail />} />
          <Route path="revisions" element={<AdminRevisions />} />
          <Route path="payments" element={<AdminPayments />} />
        </Route>
      </Route>

      <Route path="portal" element={<RequireRole role="CLIENT" />}>
        <Route element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          <Route path="projects" element={<PortalProjects />} />
          <Route path="projects/:id" element={<PortalProjectDetail />} />
          <Route path="videos" element={<PortalVideos />} />
          <Route path="videos/:id" element={<PortalVideoDetail />} />
          <Route path="payments" element={<PortalPayments />} />
          <Route path="profile" element={<PortalProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
