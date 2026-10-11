import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ServerWakeNotice } from './components/ui/ServerWakeNotice'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
        <ServerWakeNotice />
      </ToastProvider>
    </AuthProvider>
  )
}
