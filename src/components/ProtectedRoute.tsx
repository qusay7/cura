import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasPermission, getRole } from '../utils/permissions'

interface Props {
  children: ReactNode
  /** مصفوفة = يكفي إنه يملك أي واحدة منهم (OR)، مش كلهم */
  permission?: string | string[]
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

  if (permission) {
    const required = Array.isArray(permission) ? permission : [permission]
    if (!required.some(p => hasPermission(p))) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}