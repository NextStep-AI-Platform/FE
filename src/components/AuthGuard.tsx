import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}
