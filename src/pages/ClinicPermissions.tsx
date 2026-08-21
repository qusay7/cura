import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

/* =========================================================
   Language
========================================================= */

const getStoredLang = (): 'ar' | 'en' => {
  return (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'
}

/* =========================================================
   Colors
========================================================= */

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'

/* =========================================================
   Translations
========================================================= */

const T = {
  ar: {
    title: 'إدارة الصلاحيات',
    subtitle: 'خصّص صلاحيات كل دور في عيادتك',
    customPermissions: 'تخصيص الصلاحيات',

    rolesLabel: 'الأدوار',

    permissionLabel: 'صلاحية',
    permissionLabelPlural: 'صلاحيات',

    save: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ ✅',
    reset: 'إعادة للافتراضي',

    loading: 'جاري التحميل...',
    noPermissions: 'لا توجد صلاحيات',
    noRoles: 'لا توجد أدوار',

    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء الكل',

    confirmReset: 'إعادة الصلاحيات للافتراضية؟',

    saveError: 'حدث خطأ أثناء حفظ الصلاحيات',
    resetError: 'حدث خطأ أثناء إعادة الصلاحيات',

    roles: {
      Doctor: 'طبيب',
      Receptionist: 'موظف استقبال',
      ClinicAdmin: 'مدير عيادة',
      Admin: 'مدير',
      SuperAdmin: 'مدير النظام',
      Accountant: 'محاسب',
      Nurse: 'ممرض',
      Assistant: 'مساعد',
      Manager: 'مدير',
    },

    modules: {
  patients: 'المرضى',
  appointments: 'المواعيد',
  doctors: 'الأطباء',
  schedules: 'جدوال الدوام',
  users: 'المستخدمون',
  settings: 'الإعدادات',
  reports: 'التقارير',
  departments: 'الأقسام',
  insurance: 'التأمين',
  payments: 'المدفوعات',
  settlements: 'التسويات',
  queue: 'قائمة الانتظار',
  visits: 'الزيارات',
  staff: 'الموظفون',
  treatments: 'العلاجات',
  visitnotes: 'ملاحظات الزيارة',
  treatmenttemplates: 'قوالب الزيارات',
  daily: 'الجدول اليومي',
},

    permissions: {
      'patients.view': 'عرض المرضى',
      'patients.create': 'إضافة مريض',
      'patients.edit': 'تعديل مريض',
      'patients.delete': 'حذف مريض',

      'appointments.view': 'عرض المواعيد',
      'appointments.create': 'إضافة موعد',
      'appointments.edit': 'تعديل موعد',
      'appointments.delete': 'حذف موعد',

      'doctors.view': 'عرض الأطباء',
      'doctors.create': 'إضافة طبيب',
      'doctors.edit': 'تعديل طبيب',
      'doctors.delete': 'حذف طبيب',

      // ===== صلاحيات جدول العيادة =====
'schedules.clinic.view': 'عرض دوام العيادة',
'schedules.clinic.add': 'إضافة دوام عيادة',
'schedules.clinic.edit': 'تعديل دوام عيادة',
'schedules.clinic.delete': 'حذف دوام عيادة',

// ===== صلاحيات جدول الأطباء =====
'schedules.doctor.view': 'عرض دوام الأطباء',
'schedules.doctor.add': 'إضافة دوام طبيب',
'schedules.doctor.edit': 'تعديل دوام طبيب',
'schedules.doctor.delete': 'حذف دوام طبيب',
'schedules.doctor.editown': 'تعديل جدولي الخاص',

// ===== صلاحيات الإجازات =====
'schedules.absence.view': 'عرض الإجازات',
'schedules.absence.add': 'إضافة إجازة',
'schedules.absence.edit': 'تعديل إجازة',
'schedules.absence.delete': 'حذف إجازة',

      'users.view': 'عرض المستخدمين',
      'users.create': 'إضافة مستخدم',
      'users.edit': 'تعديل مستخدم',
      'users.delete': 'حذف مستخدم',
      'users.toggle': 'تفعيل/تعطيل مستخدم',

      'settings.view': 'عرض الإعدادات',
      'settings.edit': 'تعديل الإعدادات',
      

      'reports.view': 'عرض التقارير',
      'reports.create': 'إنشاء تقرير',
      'reports.export': 'تصدير التقارير',

      'departments.view': 'عرض الأقسام',
      'departments.manage': 'إدارة الأقسام',

      'insurance.view': 'عرض التأمين',
      'insurance.manage': 'إدارة التأمين',

      'payments.view': 'عرض المدفوعات',
      'payments.create': 'إضافة دفعة',
      'payments.edit': 'تعديل دفعة',

      'settlements.view': 'عرض التسويات',
      'settlements.manage': 'إدارة التسويات',

      'queue.view': 'عرض قائمة الانتظار',
      'queue.manage': 'إدارة قائمة الانتظار',

      'visits.view': 'عرض الزيارات',
      'visits.create': 'إضافة زيارة',
      'visits.edit': 'تعديل زيارة',

      'staff.view': 'عرض الموظفين',
      'staff.create': 'إضافة موظف',
      'staff.edit': 'تعديل موظف',
      'staff.delete': 'حذف موظف',

      'treatments.view': 'عرض العلاجات',
      'treatments.create': 'إضافة علاج',
      'treatments.edit': 'تعديل علاج',
      'treatments.delete': 'حذف علاج',

      'visitnotes.view': 'عرض ملاحظات الزيارة',
      'visitnotes.create': 'إضافة ملاحظة',
      'visitnotes.edit': 'تعديل ملاحظة',
      'visitnotes.delete': 'حذف ملاحظة',

      'treatmenttemplates.manage': 'إدارة قوالب الزيارات',
      'treatmenttemplates.create': 'إضافة قالب زيارة',
      'treatmenttemplates.edit': 'تعديل قالب زيارة',
      'treatmenttemplates.delete': 'حذف قالب زيارة',

      'daily.view': 'عرض جدول اليومي',  
    },
  },

  en: {
    title: 'Permissions Management',
    subtitle: 'Customize permissions for each role in your clinic',
    customPermissions: 'Custom Permissions',

    rolesLabel: 'ROLES',

    permissionLabel: 'permission',
    permissionLabelPlural: 'permissions',

    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved ✅',
    reset: 'Reset to Default',

    loading: 'Loading...',
    noPermissions: 'No permissions',
    noRoles: 'No roles available',

    selectAll: 'Select All',
    deselectAll: 'Deselect All',

    confirmReset: 'Reset permissions to default?',

    saveError: 'Error saving permissions',
    resetError: 'Error resetting permissions',

    roles: {
      Doctor: 'Doctor',
      Receptionist: 'Receptionist',
      ClinicAdmin: 'Clinic Admin',
      Admin: 'Administrator',
      SuperAdmin: 'Super Admin',
      Accountant: 'Accountant',
      Nurse: 'Nurse',
      Assistant: 'Assistant',
      Manager: 'Manager',
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
      insurance: 'Insurance',
      payments: 'Payments',
      settlements: 'Settlements',
      queue: 'Queue',
      visits: 'Visits',
      staff: 'Staff',
      treatments: 'Treatments',
      treatmenttemplates: 'Treatment Templates',
      visitnotes: 'Visit Notes',
      daily: 'Daily Schedule',
    },

    permissions: {
      'patients.view': 'View Patients',
      'patients.create': 'Add Patient',
      'patients.edit': 'Edit Patient',
      'patients.delete': 'Delete Patient',

      'appointments.view': 'View Appointments',
      'appointments.create': 'Add Appointment',
      'appointments.edit': 'Edit Appointment',
      'appointments.delete': 'Delete Appointment',

      'doctors.view': 'View Doctors',
      'doctors.create': 'Add Doctor',
      'doctors.edit': 'Edit Doctor',
      'doctors.delete': 'Delete Doctor',

      // ===== Clinic Schedule Permissions =====
'schedules.clinic.view': 'View Clinic Schedule',
'schedules.clinic.add': 'Add Clinic Schedule',
'schedules.clinic.edit': 'Edit Clinic Schedule',
'schedules.clinic.delete': 'Delete Clinic Schedule',

// ===== Doctor Schedule Permissions =====
'schedules.doctor.view': 'View Doctor Schedule',
'schedules.doctor.add': 'Add Doctor Schedule',
'schedules.doctor.edit': 'Edit Doctor Schedule',
'schedules.doctor.delete': 'Delete Doctor Schedule',
'schedules.doctor.editown': 'Edit My Own Schedule',

// ===== Absence Permissions =====
'schedules.absence.view': 'View Absences',
'schedules.absence.add': 'Add Absence',
'schedules.absence.edit': 'Edit Absence',
'schedules.absence.delete': 'Delete Absence',

      'users.view': 'View Users',
      'users.create': 'Add User',
      'users.edit': 'Edit User',
      'users.delete': 'Delete User',
      'users.toggle': 'Enable/Disable User',

      'settings.view': 'View Settings',
      'settings.edit': 'Edit Settings',

      'reports.view': 'View Reports',
      'reports.create': 'Create Report',
      'reports.export': 'Export Reports',

      'departments.view': 'View Departments',
      'departments.manage': 'Manage Departments',

      'insurance.view': 'View Insurance',
      'insurance.manage': 'Manage Insurance',

      'payments.view': 'View Payments',
      'payments.create': 'Add Payment',
      'payments.edit': 'Edit Payment',

      'settlements.view': 'View Settlements',
      'settlements.manage': 'Manage Settlements',

      'queue.view': 'View Queue',
      'queue.manage': 'Manage Queue',

      'visits.view': 'View Visits',
      'visits.create': 'Add Visit',
      'visits.edit': 'Edit Visit',

      'staff.view': 'View Staff',
      'staff.create': 'Add Staff',
      'staff.edit': 'Edit Staff',
      'staff.delete': 'Delete Staff',

      'treatments.view': 'View Treatments',
      'treatments.create': 'Add Treatment',
      'treatments.edit': 'Edit Treatment',
      'treatments.delete': 'Delete Treatment',

      'visitnotes.view': 'View Visit Notes',
      'visitnotes.create': 'Add Visit Note',
      'visitnotes.edit': 'Edit Visit Note',
      'visitnotes.delete': 'Delete Visit Note',

      'treatmenttemplates.manage': 'Manage Treatment Templates',
      'treatmenttemplates.create': 'Create Treatment Template',
      'treatmenttemplates.edit': 'Edit Treatment Template',
      'treatmenttemplates.delete': 'Delete Treatment Template',
      'daily.view': 'View Daily Schedule',
    },
  },
}

/* =========================================================
   Interfaces
========================================================= */

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

/* =========================================================
   Component
========================================================= */

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

  /* =========================================================
     Translation Helpers
  ========================================================= */

  const getRoleName = (roleName: string) => {
    return (
      t.roles[roleName as keyof typeof t.roles] ||
      roleName
    )
  }

  const getModuleName = (module: string) => {
    return (
      t.modules[module as keyof typeof t.modules] ||
      module
    )
  }

  const getPermissionName = (
    permissionName: string,
    fallback?: string
  ) => {
    return (
      t.permissions[
        permissionName as keyof typeof t.permissions
      ] ||
      fallback ||
      permissionName
    )
  }

  const getPermissionsLabel = (count: number) => {
    return count === 1
      ? t.permissionLabel
      : t.permissionLabelPlural
  }

  /* =========================================================
     Language Change Listener
  ========================================================= */

  useEffect(() => {
    const handleLang = (e: Event) => {
      const newLang = (e as CustomEvent).detail

      if (newLang === 'ar' || newLang === 'en') {
        setLang(newLang)
      }
    }

    window.addEventListener(
      'cura-lang-change',
      handleLang
    )

    return () => {
      window.removeEventListener(
        'cura-lang-change',
        handleLang
      )
    }
  }, [])

  /* =========================================================
     Fetch Data
  ========================================================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          rolesRes,
          permsRes,
        ] = await Promise.all([
          api.get('/roles/clinic-permissions'),
          api.get('/roles/all-permissions'),
        ])

        /*
         * حماية إضافية من مشكلة:
         * permissions: string
         *
         * نحولها دائمًا إلى string[]
         */

        const normalizedRoles: RolePermissions[] =
          Array.isArray(rolesRes.data)
            ? rolesRes.data.map((role: any) => ({
                roleId: String(role.roleId),
                roleName: String(role.roleName),

                permissions: Array.isArray(
                  role.permissions
                )
                  ? role.permissions.map((p: any) =>
                      String(p)
                    )
                  : role.permissions
                    ? [String(role.permissions)]
                    : [],
              }))
            : []

        const normalizedPermissions: Permission[] =
          Array.isArray(permsRes.data)
            ? permsRes.data.map((permission: any) => ({
                id: String(permission.id),
                name: String(permission.name),
                module: String(
                  permission.module || ''
                ),
                displayName: String(
                  permission.displayName ||
                    permission.name
                ),
              }))
            : []

        setRoles(normalizedRoles)

        setAllPermissions(
          normalizedPermissions
        )

        if (normalizedRoles.length > 0) {
          const first = normalizedRoles[0]

          setSelectedRole(first.roleId)

          setLocalPerms([
            ...first.permissions,
          ])
        }
      } catch (error) {
        console.error(
          'Error loading permissions:',
          error
        )

        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  /* =========================================================
     Select Role
  ========================================================= */

  const handleRoleSelect = (
    roleId: string
  ) => {
    setSelectedRole(roleId)

    const role = roles.find(
      r => r.roleId === roleId
    )

    setLocalPerms(
      role
        ? [...role.permissions]
        : []
    )

    setSaveStatus('')
  }

  /* =========================================================
     Toggle Permission
  ========================================================= */

  const togglePermission = (
    permName: string
  ) => {
    setLocalPerms(prev =>
      prev.includes(permName)
        ? prev.filter(
            p => p !== permName
          )
        : [
            ...prev,
            permName,
          ]
    )

    setSaveStatus('')
  }

  /* =========================================================
     Save
  ========================================================= */

  const handleSave = async () => {
    if (!selectedRole) {
      return
    }

    setSaving(true)

    try {
      await api.put(
        `/roles/clinic-permissions/${selectedRole}`,
        localPerms
      )

      setRoles(prev =>
        prev.map(role =>
          role.roleId === selectedRole
            ? {
                ...role,
                permissions: [
                  ...localPerms,
                ],
              }
            : role
        )
      )

      setSaveStatus('saved')

      setTimeout(() => {
        setSaveStatus('')
      }, 3000)
    } catch (error) {
      console.error(
        'Error saving permissions:',
        error
      )

      alert(t.saveError)
    } finally {
      setSaving(false)
    }
  }

  /* =========================================================
     Reset
  ========================================================= */

  const handleReset = async () => {
    if (!selectedRole) {
      return
    }

    if (!confirm(t.confirmReset)) {
      return
    }

    try {
      const res = await api.get(
        `/roles/default-permissions/${selectedRole}`
      )

      const permissions: string[] =
        Array.isArray(res.data)
          ? res.data.map((p: any) =>
              String(p)
            )
          : []

      setLocalPerms(permissions)

      setSaveStatus('')
    } catch (error) {
      console.error(
        'Error resetting permissions:',
        error
      )

      alert(t.resetError)
    }
  }

  /* =========================================================
     Group Permissions
  ========================================================= */

  const groupedPerms =
    allPermissions.reduce(
      (
        acc,
        perm
      ) => {
        if (!acc[perm.module]) {
          acc[perm.module] = []
        }

        acc[perm.module].push(
          perm
        )

        return acc
      },
      {} as Record<
        string,
        Permission[]
      >
    )

  /* =========================================================
     Selected Role
  ========================================================= */

  const selectedRoleData =
    roles.find(
      role =>
        role.roleId ===
        selectedRole
    )

  /* =========================================================
     Loading
  ========================================================= */

  if (loading) {
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          fontFamily: isAr
            ? "'Cairo', sans-serif"
            : "'Inter', sans-serif",
        }}
      >
        <p
          style={{
            color: TEXT_MUTED,
          }}
        >
          {t.loading}
        </p>
      </div>
    )
  }

  /* =========================================================
     Main UI
  ========================================================= */

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: '#F8FAFA',
        minHeight: '100vh',
        padding: 24,

        fontFamily: isAr
          ? "'Cairo', sans-serif"
          : "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >

        {/* =====================================================
            Header
        ===================================================== */}

        <div
          style={{
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,

              background:
                PRIMARY_SOFT,

              border:
                `1px solid ${BORDER}`,

              borderRadius: 100,

              padding:
                '4px 16px',

              fontSize: 11,

              fontWeight: 600,

              color: PRIMARY,

              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background:
                  PRIMARY,
              }}
            />

            {t.customPermissions}
          </div>

          <h2
            style={{
              fontFamily:
                "'DM Serif Display', 'Georgia', serif",

              fontSize: 28,

              fontWeight: 500,

              color:
                TEXT_DARK,

              margin: 0,
            }}
          >
            {t.title}
          </h2>

          <p
            style={{
              fontSize: 13,

              color:
                TEXT_MUTED,

              marginTop: 6,
            }}
          >
            {t.subtitle}
          </p>
        </div>

        {/* =====================================================
            Main Grid
        ===================================================== */}

        <div
          style={{
            display: 'grid',

            gridTemplateColumns:
              '260px 1fr',

            gap: 20,
          }}
        >

          {/* ===================================================
              Roles Sidebar
          =================================================== */}

          <div
            style={{
              background:
                CARD_BG,

              border:
                `1px solid ${BORDER}`,

              borderRadius: 16,

              padding: 16,

              height:
                'fit-content',
            }}
          >
            <p
              style={{
                fontSize: 12,

                fontWeight: 600,

                color:
                  TEXT_MUTED,

                marginBottom: 12,

                letterSpacing:
                  '0.5px',
              }}
            >
              {t.rolesLabel}
            </p>

            {roles.length === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color:
                    TEXT_MUTED,
                  textAlign:
                    'center',
                  margin:
                    '20px 0',
                }}
              >
                {t.noRoles}
              </p>
            ) : (
              roles.map(role => {
                const permissionCount =
                  selectedRole ===
                  role.roleId
                    ? localPerms.length
                    : role.permissions.length

                return (
                  <div
                    key={
                      role.roleId
                    }
                    style={{
                      marginBottom: 8,
                    }}
                  >

                    {/* Role Button */}

                    <button
                      type="button"
                      onClick={() =>
                        handleRoleSelect(
                          role.roleId
                        )
                      }
                      style={{
                        width:
                          '100%',

                        padding:
                          '10px 14px',

                        border:
                          selectedRole ===
                          role.roleId
                            ? `2px solid ${PRIMARY}`
                            : `1px solid ${BORDER}`,

                        background:
                          selectedRole ===
                          role.roleId
                            ? PRIMARY_SOFT
                            : 'transparent',

                        borderRadius:
                          12,

                        cursor:
                          'pointer',

                        transition:
                          'all 0.2s ease',

                        display:
                          'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'space-between',

                        textAlign:
                          isAr
                            ? 'right'
                            : 'left',
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            14,

                          fontWeight:
                            selectedRole ===
                            role.roleId
                              ? 600
                              : 400,

                          color:
                            selectedRole ===
                            role.roleId
                              ? PRIMARY
                              : TEXT_DARK,
                        }}
                      >
                        {getRoleName(
                          role.roleName
                        )}
                      </span>

                      <span
                        style={{
                          fontSize:
                            11,

                          background:
                            `${PRIMARY}15`,

                          color:
                            PRIMARY,

                          padding:
                            '2px 8px',

                          borderRadius:
                            100,

                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        {
                          permissionCount
                        }{' '}
                        {
                          getPermissionsLabel(
                            permissionCount
                          )
                        }
                      </span>
                    </button>

                    {/* =================================================
                        Selected Role Permissions
                    ================================================= */}

                    {selectedRole ===
                      role.roleId && (
                      <div
                        style={{
                          marginTop: 6,

                          padding:
                            '10px 12px',

                          background:
                            '#F8FAFA',

                          border:
                            `1px solid ${BORDER}`,

                          borderRadius:
                            10,

                          display:
                            'flex',

                          flexDirection:
                            'column',

                          gap: 4,

                          maxHeight:
                            200,

                          overflowY:
                            'auto',
                        }}
                      >
                        {localPerms.length ===
                        0 ? (
                          <p
                            style={{
                              fontSize:
                                11,

                              color:
                                TEXT_MUTED,

                              margin: 0,

                              textAlign:
                                'center',
                            }}
                          >
                            {
                              t.noPermissions
                            }
                          </p>
                        ) : (
                          localPerms.map(
                            permName => (
                              <div
                                key={
                                  permName
                                }
                                style={{
                                  display:
                                    'flex',

                                  alignItems:
                                    'center',

                                  gap: 6,

                                  fontSize:
                                    11,

                                  color:
                                    PRIMARY,

                                  textAlign:
                                    isAr
                                      ? 'right'
                                      : 'left',
                                }}
                              >
                                <span
                                  style={{
                                    width:
                                      6,

                                    height:
                                      6,

                                    borderRadius:
                                      '50%',

                                    background:
                                      PRIMARY,

                                    flexShrink:
                                      0,
                                  }}
                                />

                                {getPermissionName(
                                  permName
                                )}
                              </div>
                            )
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* ===================================================
              Permissions Area
          =================================================== */}

          <div>

            {/* Toolbar */}

            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                marginBottom:
                  16,

                flexWrap:
                  'wrap',

                gap: 10,
              }}
            >
              <p
                style={{
                  fontSize:
                    14,

                  fontWeight:
                    600,

                  color:
                    TEXT_DARK,

                  margin: 0,
                }}
              >
                {selectedRoleData
                  ? getRoleName(
                      selectedRoleData.roleName
                    )
                  : ''}

                {selectedRoleData && (
                  <span
                    style={{
                      fontSize:
                        12,

                      color:
                        TEXT_MUTED,

                      fontWeight:
                        400,

                      marginInlineStart:
                        8,
                    }}
                  >
                    —{' '}
                    {
                      localPerms.length
                    }{' '}
                    {
                      getPermissionsLabel(
                        localPerms.length
                      )
                    }
                  </span>
                )}
              </p>

              <div
                style={{
                  display:
                    'flex',

                  gap: 8,
                }}
              >

                {/* Reset */}

                <button
                  type="button"
                  onClick={
                    handleReset
                  }
                  disabled={
                    !selectedRole
                  }
                  style={{
                    padding:
                      '8px 16px',

                    background:
                      'transparent',

                    border:
                      `1px solid ${BORDER}`,

                    borderRadius:
                      10,

                    fontSize:
                      12,

                    color:
                      TEXT_MUTED,

                    cursor:
                      selectedRole
                        ? 'pointer'
                        : 'not-allowed',

                    opacity:
                      selectedRole
                        ? 1
                        : 0.5,

                    transition:
                      'all 0.2s ease',
                  }}
                >
                  🔄 {t.reset}
                </button>

                {/* Save */}

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving ||
                    !selectedRole
                  }
                  style={{
                    padding:
                      '8px 20px',

                    background:
                      saveStatus ===
                      'saved'
                        ? SUCCESS
                        : PRIMARY,

                    border:
                      'none',

                    borderRadius:
                      10,

                    fontSize:
                      12,

                    fontWeight:
                      600,

                    color:
                      '#FFFFFF',

                    cursor:
                      saving ||
                      !selectedRole
                        ? 'not-allowed'
                        : 'pointer',

                    opacity:
                      saving ||
                      !selectedRole
                        ? 0.7
                        : 1,

                    transition:
                      'all 0.3s ease',
                  }}
                >
                  {saving
                    ? t.saving
                    : saveStatus ===
                        'saved'
                      ? t.saved
                      : t.save}
                </button>
              </div>
            </div>

            {/* =================================================
                No Permissions
            ================================================= */}

            {Object.keys(
              groupedPerms
            ).length === 0 ? (
              <div
                style={{
                  background:
                    CARD_BG,

                  border:
                    `1px solid ${BORDER}`,

                  borderRadius:
                    16,

                  padding:
                    40,

                  textAlign:
                    'center',

                  color:
                    TEXT_MUTED,
                }}
              >
                {t.noPermissions}
              </div>
            ) : (

              /* =================================================
                 Permissions by Module
              ================================================= */

              <div
                style={{
                  display:
                    'flex',

                  flexDirection:
                    'column',

                  gap: 16,
                }}
              >
                {Object.entries(
                  groupedPerms
                ).map(
                  ([
                    module,
                    perms,
                  ]) => {
                    const allSelected =
                      perms.every(
                        permission =>
                          localPerms.includes(
                            permission.name
                          )
                      )

                    return (
                      <div
                        key={
                          module
                        }
                        style={{
                          background:
                            CARD_BG,

                          border:
                            `1px solid ${BORDER}`,

                          borderRadius:
                            16,

                          overflow:
                            'hidden',
                        }}
                      >

                        {/* Module Header */}

                        <div
                          style={{
                            padding:
                              '12px 16px',

                            background:
                              PRIMARY_SOFT,

                            borderBottom:
                              `1px solid ${BORDER}`,

                            display:
                              'flex',

                            alignItems:
                              'center',

                            justifyContent:
                              'space-between',

                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                13,

                              fontWeight:
                                600,

                              color:
                                TEXT_DARK,
                            }}
                          >
                            {getModuleName(
                              module
                            )}
                          </span>

                          {/* Select / Deselect All */}

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                allSelected
                              ) {
                                setLocalPerms(
                                  prev =>
                                    prev.filter(
                                      permissionName =>
                                        !perms.some(
                                          permission =>
                                            permission.name ===
                                            permissionName
                                        )
                                    )
                                )
                              } else {
                                setLocalPerms(
                                  prev => [
                                    ...prev,

                                    ...perms
                                      .map(
                                        permission =>
                                          permission.name
                                      )
                                      .filter(
                                        permissionName =>
                                          !prev.includes(
                                            permissionName
                                          )
                                      ),
                                  ]
                                )
                              }

                              setSaveStatus(
                                ''
                              )
                            }}
                            style={{
                              background:
                                'transparent',

                              border:
                                `1px solid ${BORDER}`,

                              borderRadius:
                                8,

                              padding:
                                '3px 10px',

                              fontSize:
                                11,

                              color:
                                TEXT_MUTED,

                              cursor:
                                'pointer',

                              transition:
                                'all 0.2s ease',

                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            {allSelected
                              ? t.deselectAll
                              : t.selectAll}
                          </button>
                        </div>

                        {/* Permissions */}

                        <div
                          style={{
                            display:
                              'grid',

                            gridTemplateColumns:
                              'repeat(auto-fill, minmax(200px, 1fr))',

                            gap: 4,

                            padding: 8,
                          }}
                        >
                          {perms.map(
                            permission => {
                              const isGranted =
                                localPerms.includes(
                                  permission.name
                                )

                              return (
                                <button
                                  key={
                                    permission.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    togglePermission(
                                      permission.name
                                    )
                                  }
                                  style={{
                                    padding:
                                      '10px 14px',

                                    border:
                                      isGranted
                                        ? `2px solid ${PRIMARY}`
                                        : `1px solid ${BORDER}`,

                                    background:
                                      isGranted
                                        ? PRIMARY_SOFT
                                        : 'transparent',

                                    borderRadius:
                                      10,

                                    cursor:
                                      'pointer',

                                    transition:
                                      'all 0.2s ease',

                                    display:
                                      'flex',

                                    alignItems:
                                      'center',

                                    gap: 8,

                                    textAlign:
                                      isAr
                                        ? 'right'
                                        : 'left',
                                  }}
                                >

                                  {/* Checkbox */}

                                  <div
                                    style={{
                                      width:
                                        18,

                                      height:
                                        18,

                                      borderRadius:
                                        5,

                                      flexShrink:
                                        0,

                                      border:
                                        isGranted
                                          ? `2px solid ${PRIMARY}`
                                          : `2px solid ${BORDER}`,

                                      background:
                                        isGranted
                                          ? PRIMARY
                                          : 'transparent',

                                      display:
                                        'flex',

                                      alignItems:
                                        'center',

                                      justifyContent:
                                        'center',

                                      transition:
                                        'all 0.2s ease',
                                    }}
                                  >
                                    {isGranted && (
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 12 12"
                                      >
                                        <polyline
                                          points="2,6 5,9 10,3"
                                          fill="none"
                                          stroke="#FFFFFF"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    )}
                                  </div>

                                  {/* Permission Name */}

                                  <span
                                    style={{
                                      fontSize:
                                        12,

                                      fontWeight:
                                        isGranted
                                          ? 500
                                          : 400,

                                      color:
                                        isGranted
                                          ? PRIMARY
                                          : TEXT_MUTED,

                                      flex: 1,
                                    }}
                                  >
                                    {getPermissionName(
                                      permission.name,
                                      permission.displayName
                                    )}
                                  </span>
                                </button>
                              )
                            }
                          )}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}