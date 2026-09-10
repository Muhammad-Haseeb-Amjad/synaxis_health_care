import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-primary" /></div>
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

