import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')

  // إذا لم يوجد توكن → اذهب لصفحة Login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}