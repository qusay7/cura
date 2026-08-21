import api from '../api/axios'

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

// جلب الصلاحيات من localStorage
export const getPermissions = (): string[] => {
  return JSON.parse(localStorage.getItem('permissions') || '[]')
}

// جلب الدور
export const getRole = (): string => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.role || ''
}

// جلب جميع الأدوار من الـ API
export const getAllRoles = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('❌ لا يوجد token')
      return []
    }

    const response = await fetch('http://localhost:5192/api/roles/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Error: ${response.status}`, await response.text())
      return []
    }

    const data = await response.json()
    console.log('✅ Roles:', data)
    return data
  } catch (err) {
    console.error('❌ Failed to fetch roles:', err)
    return []
  }
}
// جلب أدوار العيادة من الـ API
export const getClinicRoles = async () => {
  try {
    const response = await api.get('/roles/clinic')
    return response.data
  } catch (err) {
    console.error('Failed to fetch clinic roles:', err)
    return []
  }
}

// جلب أدوار الإدارة من الـ API (SuperAdmin فقط)
export const getAdminRoles = async () => {
  try {
    const response = await api.get('/roles/admin')
    return response.data
  } catch (err) {
    console.error('Failed to fetch admin roles:', err)
    return []
  }
}