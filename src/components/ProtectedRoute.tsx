import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasPermission } from '../utils/permissions'

interface Props {
  children: ReactNode
  permission?: string
}

export default function ProtectedRoute({ children, permission }: Props) {
  const token = localStorage.getItem('token')

  if (!token) return <Navigate to="/login" replace />

  if (permission && !hasPermission(permission))
    return <Navigate to="/dashboard" replace />

  return <>{children}</>
}