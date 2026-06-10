import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { hasPermission } from '../utils/permissions'
import { ECGAnimation } from '../components/ECGAnimation'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'
const WARNING = '#C4A77D'

const globalCss = `
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes soft-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
.users-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.user-row { animation: slide-in 0.3s ease both; }
.user-row:nth-child(1){ animation-delay:0.02s }
.user-row:nth-child(2){ animation-delay:0.04s }
.user-row:nth-child(3){ animation-delay:0.06s }
.user-row:nth-child(4){ animation-delay:0.08s }
.users-shell * { box-sizing: border-box; }
.users-shell ::-webkit-scrollbar { width: 5px; height: 5px; }
.users-shell ::-webkit-scrollbar-track { background: #E8EDEE; border-radius: 4px; }
.users-shell ::-webkit-scrollbar-thumb { background: #8BAFB1; border-radius: 4px; }
@media(max-width: 768px) {
  .users-table-container { overflow-x: auto; }
  .users-header { flex-direction: column !important; align-items: stretch !important; }
}
`

const T = {
  ar: {
    title: 'المستخدمون',
    addUser: 'إضافة مستخدم',
    search: 'ابحث بالاسم أو البريد...',
    name: 'الاسم',
    email: 'البريد',
    role: 'الدور',
    status: 'الحالة',
    actions: 'إجراءات',
    active: 'نشط',
    inactive: 'غير نشط',
    toggle: 'تفعيل/تعطيل',
    noUsers: 'لا يوجد مستخدمون',
    loadingMsg: 'جاري تحميل المستخدمين',
    loadingSub: 'يرجى الانتظار...',
    total: 'إجمالي المستخدمين',
    roles: {
      ClinicAdmin: 'مدير عيادة',
      Doctor: 'طبيب',
      Receptionist: 'موظف استقبال',
      ClinicStaff: 'موظف الشركة',
      SuperAdmin: 'مدير النظام',
    }
  },
  en: {
    title: 'Users',
    addUser: 'Add User',
    search: 'Search by name or email...',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    toggle: 'Toggle',
    noUsers: 'No users found',
    loadingMsg: 'Loading Users',
    loadingSub: 'Please wait...',
    total: 'Total Users',
    roles: {
      ClinicAdmin: 'Clinic Admin',
      Doctor: 'Doctor',
      Receptionist: 'Receptionist',
      ClinicStaff: 'Clinic Staff',
      SuperAdmin: 'Super Admin',
    }
  },
}

interface UserItem {
  id: string
  fullName: string
  email: string
  username?: string
  role: string
  isActive: boolean
  clinicId?: string
  clinicName?: string
  createdAt: string
}

const LoadingScreen = ({ msg, sub }: { msg: string; sub: string }) => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 9999,
  }}>
    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 400, width: '100%' }}>
      <div style={{ background: PRIMARY_SOFT, borderRadius: 20, padding: '20px 24px', marginBottom: '1.5rem', border: `1px solid ${BORDER}` }}>
        <ECGAnimation height={100} showLetters speed={0.7} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_DARK, marginBottom: 8 }}>{msg}</h3>
      <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24 }}>{sub}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: PRIMARY,
            animation: `pulse-soft 1.5s ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  </div>
)

export default function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [toggling, setToggling] = useState<string | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const clinicId = user.clinicId

  useEffect(() => {
    const styleId = 'cura-users-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss
      document.head.appendChild(style)
    }
    const handleLang = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLang)
    return () => window.removeEventListener('cura-lang-change', handleLang)
  }, [])

  const fetchUsers = async () => {
    const startTime = Date.now()
    try {
      // ClinicAdmin يجلب مستخدمي عيادته
      const url = clinicId ? `/users/clinic/${clinicId}` : '/users'
      const res = await api.get(url)
      setUsers(res.data)
    } catch {
      navigate('/login')
    } finally {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 800 - elapsed)
      setTimeout(() => setLoading(false), remaining)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleToggle = async (userId: string) => {
    setToggling(userId)
    try {
      await api.patch(`/users/${userId}/toggle`)
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      ))
    } catch {
      alert(isAr ? 'حدث خطأ' : 'An error occurred')
    } finally {
      setToggling(null)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'

  const filteredUsers = users.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole ? u.role === filterRole : true
    const matchStatus = filterStatus === 'active' ? u.isActive :
      filterStatus === 'inactive' ? !u.isActive : true
    return matchSearch && matchRole && matchStatus
  })

  const getRoleLabel = (role: string) =>
    t.roles[role as keyof typeof t.roles] || role

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ClinicAdmin':   return { bg: `${PRIMARY}15`,  color: PRIMARY }
      case 'Doctor':        return { bg: '#4A767915',      color: '#4A7679' }
      case 'Receptionist':  return { bg: `${WARNING}15`,  color: WARNING }
      case 'ClinicStaff':   return { bg: '#8BAFB115',      color: '#8BAFB1' }
      default:              return { bg: '#f0f0f0',         color: '#666' }
    }
  }

  if (loading) return <LoadingScreen msg={t.loadingMsg} sub={t.loadingSub} />

  return (
    <div className="users-shell" dir={isAr ? 'rtl' : 'ltr'} style={{
      background: '#F8FAFA', minHeight: '100vh', padding: 24,
      fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div className="users-header" style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24,
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
              borderRadius: 100, padding: '4px 16px', fontSize: 11,
              fontWeight: 600, color: PRIMARY, marginBottom: 12,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
              {isAr ? 'إدارة الفريق' : 'Team Management'}
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display','Georgia',serif",
              fontSize: 32, fontWeight: 500, color: TEXT_DARK, margin: 0,
            }}>
              {t.title}
            </h2>
            <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8 }}>
              👥 {filteredUsers.length} {t.total}
            </p>
          </div>

          {hasPermission('users.create') && (
            <button
              onClick={() => navigate('/users/add')}
              style={{
                background: PRIMARY, color: '#FFFFFF', border: 'none',
                borderRadius: 12, padding: '10px 20px', fontSize: 13,
                fontWeight: 500, cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 8, transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(91,140,143,0.2)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#4A7679'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = PRIMARY
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              {t.addUser}
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 2, position: 'relative', minWidth: 200 }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.search}
              style={{
                width: '100%', background: CARD_BG,
                border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: '10px 16px 10px 40px', fontSize: 13,
                fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
                color: TEXT_DARK, outline: 'none',
              }}
            />
            <span style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              left: 14, fontSize: 14, color: TEXT_MUTED,
            }}>🔍</span>
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            style={{
              flex: 1, minWidth: 140, background: CARD_BG,
              border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: '10px 14px', fontSize: 13, color: TEXT_DARK,
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">{isAr ? 'كل الأدوار' : 'All Roles'}</option>
            {Object.entries(t.roles).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              flex: 1, minWidth: 140, background: CARD_BG,
              border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: '10px 14px', fontSize: 13, color: TEXT_DARK,
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">{isAr ? 'كل الحالات' : 'All Status'}</option>
            <option value="active">{t.active}</option>
            <option value="inactive">{t.inactive}</option>
          </select>
        </div>

        {/* Table */}
        <div className="users-table-container" style={{
          background: CARD_BG, border: `1px solid ${BORDER}`,
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, background: PRIMARY_SOFT }}>
                  {[t.name, t.email, t.role, t.status, t.actions].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px',
                      textAlign: isAr ? 'right' : 'left',
                      fontSize: 12, fontWeight: 600, color: TEXT_MUTED,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <span style={{ fontSize: 48, opacity: 0.5 }}>👥</span>
                      <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 12 }}>{t.noUsers}</p>
                    </td>
                  </tr>
                ) : filteredUsers.map(u => {
                  const roleStyle = getRoleColor(u.role)
                  return (
                    <tr
                      key={u.id}
                      className="user-row"
                      style={{ borderBottom: `1px solid ${BORDER}`, transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = PRIMARY_SOFT}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${PRIMARY} 0%, #8BAFB1 100%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 600, color: '#FFFFFF', flexShrink: 0,
                          }}>
                            {u.fullName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>
                              {u.fullName}
                            </p>
                            {u.username && (
                              <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>
                                @{u.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                        {u.email}
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 100,
                          fontSize: 11, fontWeight: 500,
                          background: roleStyle.bg, color: roleStyle.color,
                        }}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                          background: u.isActive ? `${SUCCESS}15` : `${WARNING}15`,
                          color: u.isActive ? SUCCESS : WARNING,
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: u.isActive ? SUCCESS : WARNING,
                          }} />
                          {u.isActive ? t.active : t.inactive}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {hasPermission('users.toggle') && (
                            <button
                              onClick={() => handleToggle(u.id)}
                              disabled={toggling === u.id}
                              style={{
                                background: u.isActive ? `${WARNING}15` : `${SUCCESS}15`,
                                border: 'none', borderRadius: 8,
                                padding: '6px 12px', fontSize: 12,
                                color: u.isActive ? WARNING : SUCCESS,
                                cursor: toggling === u.id ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: toggling === u.id ? 0.6 : 1,
                              }}
                            >
                              {toggling === u.id ? '...' : u.isActive
                                ? (isAr ? '🔴 تعطيل' : '🔴 Disable')
                                : (isAr ? '🟢 تفعيل' : '🟢 Enable')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {filteredUsers.length > 0 && (
          <div style={{
            display: 'flex', gap: 16, marginTop: 20,
            padding: '12px 16px', background: PRIMARY_SOFT,
            borderRadius: 16, border: `1px solid ${BORDER}`, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>👥</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>{t.total}:</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>{filteredUsers.length}</span>
            </div>
            <div style={{ width: 1, background: BORDER }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🟢</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>{t.active}:</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: SUCCESS }}>
                {filteredUsers.filter(u => u.isActive).length}
              </span>
            </div>
            <div style={{ width: 1, background: BORDER }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🔴</span>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>{t.inactive}:</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: WARNING }}>
                {filteredUsers.filter(u => !u.isActive).length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}