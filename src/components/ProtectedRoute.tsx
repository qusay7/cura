import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasPermission } from '../utils/permissions'

interface Props {
  children: ReactNode
  permission?: string
}

export default function ProtectedRoute({ children, permission }: Props) {
  const token = localStorage.getItem('_auth_tokens')  // ✅ الـ key الصحيح!

  console.log('🔐 ProtectedRoute check:', token ? '✅ Has token' : '❌ No token')

  if (!token) {
    console.log('❌ No token, redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (permission && !hasPermission(permission)) {
    console.log('❌ Permission denied:', permission)
    return <Navigate to="/dashboard" replace />
  }

  console.log('✅ ProtectedRoute passed')
  return <>{children}</>
}