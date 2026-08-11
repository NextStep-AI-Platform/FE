import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthReady } = useApp()
  const location = useLocation()

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ns-page">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" aria-label="Loading session" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}
