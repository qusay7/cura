// التحقق من صلاحية معينة
export const hasPermission = (permission: string): boolean => {
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // SuperAdmin يملك كل الصلاحيات
  if (user.role === 'SuperAdmin') return true

  const permissions: string[] = JSON.parse(
    localStorage.getItem('permissions') || '[]'
  )
  return permissions.includes(permission)
}

// جلب كل الصلاحيات
export const getPermissions = (): string[] => {
  return JSON.parse(localStorage.getItem('permissions') || '[]')
}

// جلب الدور
export const getRole = (): string => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.role || ''
}