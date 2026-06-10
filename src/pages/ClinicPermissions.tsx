import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'

const T = {
  ar: {
    title: 'إدارة الصلاحيات',
    subtitle: 'خصّص صلاحيات كل دور في عيادتك',
    save: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ ✅',
    reset: 'إعادة للافتراضي',
    roles: {
      Doctor: 'طبيب',
      Receptionist: 'موظف استقبال',
      ClinicAdmin: 'مدير عيادة',
    },
    modules: {
      patients: 'المرضى',
      appointments: 'المواعيد',
      doctors: 'الأطباء',
      schedules: 'الجداول',
      users: 'المستخدمون',
      settings: 'الإعدادات',
      reports: 'التقارير',
      departments: 'الأقسام',
    },
    permissions: {
      'patients.view':       'عرض المرضى',
      'patients.create':     'إضافة مريض',
      'patients.edit':       'تعديل مريض',
      'patients.delete':     'حذف مريض',
      'appointments.view':   'عرض المواعيد',
      'appointments.create': 'إضافة موعد',
      'appointments.edit':   'تعديل موعد',
      'appointments.delete': 'حذف موعد',
      'doctors.view':        'عرض الأطباء',
      'doctors.create':      'إضافة طبيب',
      'doctors.edit':        'تعديل طبيب',
      'doctors.delete':      'حذف طبيب',
      'schedules.view':      'عرض الجداول',
      'schedules.manage':    'إدارة الجداول',
      'users.view':          'عرض المستخدمين',
      'users.create':        'إضافة مستخدم',
      'users.toggle':        'تفعيل/تعطيل مستخدم',
      'settings.view':       'عرض الإعدادات',
      'reports.view':        'عرض التقارير',
      'departments.manage':  'إدارة الأقسام',
    },
  },
  en: {
    title: 'Permissions Management',
    subtitle: 'Customize permissions for each role in your clinic',
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved ✅',
    reset: 'Reset to Default',
    roles: {
      Doctor: 'Doctor',
      Receptionist: 'Receptionist',
      ClinicAdmin: 'Clinic Admin',
    },
    modules: {
      patients: 'Patients',
      appointments: 'Appointments',
      doctors: 'Doctors',
      schedules: 'Schedules',
      users: 'Users',
      settings: 'Settings',
      reports: 'Reports',
      departments: 'Departments',
    },
    permissions: {
      'patients.view':       'View Patients',
      'patients.create':     'Add Patient',
      'patients.edit':       'Edit Patient',
      'patients.delete':     'Delete Patient',
      'appointments.view':   'View Appointments',
      'appointments.create': 'Add Appointment',
      'appointments.edit':   'Edit Appointment',
      'appointments.delete': 'Delete Appointment',
      'doctors.view':        'View Doctors',
      'doctors.create':      'Add Doctor',
      'doctors.edit':        'Edit Doctor',
      'doctors.delete':      'Delete Doctor',
      'schedules.view':      'View Schedules',
      'schedules.manage':    'Manage Schedules',
      'users.view':          'View Users',
      'users.create':        'Add User',
      'users.toggle':        'Enable/Disable User',
      'settings.view':       'View Settings',
      'reports.view':        'View Reports',
      'departments.manage':  'Manage Departments',
    },
  },
}

interface RolePermissions {
  roleId: string
  roleName: string
  permissions: string[]
}

interface Permission {
  id: string
  name: string
  module: string
  displayName: string
}

export default function ClinicPermissions() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [roles, setRoles] = useState<RolePermissions[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [localPerms, setLocalPerms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'' | 'saved'>('')
  const [loading, setLoading] = useState(true)

  const t = T[lang]
  const isAr = lang === 'ar'

  useEffect(() => {
    const handleLang = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLang)
    return () => window.removeEventListener('cura-lang-change', handleLang)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          api.get('/roles/clinic-permissions'),
          api.get('/roles/all-permissions'),
        ])
        setRoles(rolesRes.data)
        setAllPermissions(permsRes.data)
        if (rolesRes.data.length > 0) {
          const first = rolesRes.data[0]
          setSelectedRole(first.roleId)
          setLocalPerms(first.permissions)
        }
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    const role = roles.find(r => r.roleId === roleId)
    setLocalPerms(role?.permissions || [])
    setSaveStatus('')
  }

  const togglePermission = (permName: string) => {
    setLocalPerms(prev =>
      prev.includes(permName)
        ? prev.filter(p => p !== permName)
        : [...prev, permName]
    )
    setSaveStatus('')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/roles/clinic-permissions/${selectedRole}`, localPerms)
      setRoles(prev => prev.map(r =>
        r.roleId === selectedRole ? { ...r, permissions: localPerms } : r
      ))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch {
      alert(isAr ? 'حدث خطأ أثناء الحفظ' : 'Error saving permissions')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm(isAr ? 'إعادة الصلاحيات للافتراضية؟' : 'Reset to default permissions?')) return
    try {
      const res = await api.get(`/roles/default-permissions/${selectedRole}`)
      setLocalPerms(res.data)
      setSaveStatus('')
    } catch {
      alert(isAr ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const groupedPerms = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = []
    acc[perm.module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const selectedRoleData = roles.find(r => r.roleId === selectedRole)

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', minHeight: '50vh',
      }}>
        <p style={{ color: TEXT_MUTED }}>
          {isAr ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </div>
    )
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{
      background: '#F8FAFA', minHeight: '100vh', padding: 24,
      fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
            borderRadius: 100, padding: '4px 16px', fontSize: 11,
            fontWeight: 600, color: PRIMARY, marginBottom: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY }} />
            {isAr ? 'تخصيص الصلاحيات' : 'Custom Permissions'}
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display','Georgia',serif",
            fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0,
          }}>
            {t.title}
          </h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6 }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

          {/* ── Roles Sidebar ── */}
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: 16, height: 'fit-content',
          }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: TEXT_MUTED,
              marginBottom: 12, letterSpacing: '0.5px',
            }}>
              {isAr ? 'الأدوار' : 'ROLES'}
            </p>

            {roles.map(role => (
              <div key={role.roleId} style={{ marginBottom: 8 }}>

                {/* زر الدور */}
                <button
                  onClick={() => handleRoleSelect(role.roleId)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 12,
                    border: selectedRole === role.roleId
                      ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                    background: selectedRole === role.roleId
                      ? PRIMARY_SOFT : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <span style={{
                    fontSize: 14,
                    fontWeight: selectedRole === role.roleId ? 600 : 400,
                    color: selectedRole === role.roleId ? PRIMARY : TEXT_DARK,
                  }}>
                    {t.roles[role.roleName as keyof typeof t.roles] || role.roleName}
                  </span>

                  {/* ✅ الرقم يعكس localPerms للدور المحدد */}
                  <span style={{
                    fontSize: 11, background: `${PRIMARY}15`,
                    color: PRIMARY, padding: '2px 8px', borderRadius: 100,
                  }}>
                    {selectedRole === role.roleId
                      ? localPerms.length
                      : role.permissions.length
                    } {isAr ? 'صلاحية' : 'perms'}
                  </span>
                </button>

                {/* ✅ قائمة الصلاحيات تحت الدور المحدد */}
                {selectedRole === role.roleId && (
                  <div style={{
                    marginTop: 6,
                    padding: '10px 12px',
                    background: '#F8FAFA',
                    borderRadius: 10,
                    border: `1px solid ${BORDER}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}>
                    {localPerms.length === 0 ? (
                      <p style={{
                        fontSize: 11, color: TEXT_MUTED,
                        margin: 0, textAlign: 'center',
                      }}>
                        {isAr ? 'لا توجد صلاحيات' : 'No permissions'}
                      </p>
                    ) : (
                      localPerms.map(permName => (
                        <div
                          key={permName}
                          style={{
                            display: 'flex', alignItems: 'center',
                            gap: 6, fontSize: 11, color: PRIMARY,
                          }}
                        >
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: PRIMARY, flexShrink: 0,
                          }} />
                          {t.permissions[permName as keyof typeof t.permissions] || permName}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Permissions Grid ── */}
          <div>

            {/* Toolbar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 16,
              flexWrap: 'wrap', gap: 10,
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>
                {selectedRoleData
                  ? (t.roles[selectedRoleData.roleName as keyof typeof t.roles] || selectedRoleData.roleName)
                  : ''}
                <span style={{
                  fontSize: 12, color: TEXT_MUTED,
                  fontWeight: 400, marginInlineStart: 8,
                }}>
                  — {localPerms.length} {isAr ? 'صلاحية' : 'permissions'}
                </span>
              </p>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '8px 16px', background: 'transparent',
                    border: `1px solid ${BORDER}`, borderRadius: 10,
                    fontSize: 12, color: TEXT_MUTED, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = PRIMARY}
                  onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                >
                  🔄 {t.reset}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    background: saveStatus === 'saved' ? SUCCESS : PRIMARY,
                    border: 'none', borderRadius: 10,
                    fontSize: 12, fontWeight: 600, color: '#FFFFFF',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {saving ? t.saving : saveStatus === 'saved' ? t.saved : t.save}
                </button>
              </div>
            </div>

            {/* Permissions by Module */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(groupedPerms).map(([module, perms]) => (
                <div key={module} style={{
                  background: CARD_BG, border: `1px solid ${BORDER}`,
                  borderRadius: 16, overflow: 'hidden',
                }}>

                  {/* Module Header */}
                  <div style={{
                    padding: '12px 16px',
                    background: PRIMARY_SOFT,
                    borderBottom: `1px solid ${BORDER}`,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_DARK }}>
                      {t.modules[module as keyof typeof t.modules] || module}
                    </span>

                    {/* Select All / Deselect All */}
                    <button
                      onClick={() => {
                        const allSelected = perms.every(p => localPerms.includes(p.name))
                        if (allSelected) {
                          setLocalPerms(prev =>
                            prev.filter(p => !perms.map(pe => pe.name).includes(p)))
                        } else {
                          setLocalPerms(prev => [
                            ...prev,
                            ...perms.map(p => p.name).filter(p => !prev.includes(p))
                          ])
                        }
                        setSaveStatus('')
                      }}
                      style={{
                        background: 'transparent', border: `1px solid ${BORDER}`,
                        borderRadius: 8, padding: '3px 10px',
                        fontSize: 11, color: TEXT_MUTED, cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = PRIMARY
                        e.currentTarget.style.color = PRIMARY
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = BORDER
                        e.currentTarget.style.color = TEXT_MUTED
                      }}
                    >
                      {perms.every(p => localPerms.includes(p.name))
                        ? (isAr ? 'إلغاء الكل' : 'Deselect All')
                        : (isAr ? 'تحديد الكل' : 'Select All')}
                    </button>
                  </div>

                  {/* Permission Checkboxes */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 4, padding: 8,
                  }}>
                    {perms.map(perm => {
                      const isGranted = localPerms.includes(perm.name)
                      return (
                        <button
                          key={perm.id}
                          onClick={() => togglePermission(perm.name)}
                          style={{
                            padding: '10px 14px', borderRadius: 10,
                            border: isGranted
                              ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                            background: isGranted ? PRIMARY_SOFT : 'transparent',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            display: 'flex', alignItems: 'center', gap: 8,
                            textAlign: isAr ? 'right' : 'left',
                          }}
                          onMouseEnter={e => {
                            if (!isGranted)
                              e.currentTarget.style.borderColor = PRIMARY
                          }}
                          onMouseLeave={e => {
                            if (!isGranted)
                              e.currentTarget.style.borderColor = BORDER
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            border: isGranted
                              ? `2px solid ${PRIMARY}` : `2px solid ${BORDER}`,
                            background: isGranted ? PRIMARY : 'transparent',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}>
                            {isGranted && (
                              <svg width="10" height="10" viewBox="0 0 12 12">
                                <polyline
                                  points="2,6 5,9 10,3"
                                  fill="none" stroke="#FFFFFF"
                                  strokeWidth="2" strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>

                          <span style={{
                            fontSize: 12,
                            fontWeight: isGranted ? 500 : 400,
                            color: isGranted ? PRIMARY : TEXT_MUTED,
                          }}>
                            {t.permissions[perm.name as keyof typeof t.permissions] || perm.displayName}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}