import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasPermission, getRole } from '../utils/permissions'

interface Props {
  children: ReactNode
  permission?: string
  role?: string
}

export default function ProtectedRoute({ children, permission, role }: Props) {
  const token = localStorage.getItem('_auth_tokens')  // ✅ الـ key الصحيح!

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (role && getRole() !== role) {
    return <Navigate to="/dashboard" replace />
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}