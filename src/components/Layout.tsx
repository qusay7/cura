import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import api from '../api/axios'
import { hasPermission } from '../utils/permissions'

const layoutCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=Cairo:wght@400;500;600;700&display=swap');

@keyframes fade-in { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
@keyframes slide-overlay { from { opacity:0;} to { opacity:1;} }
@keyframes notification-slide { from { opacity:0; transform:translateX(20px);} to { opacity:1; transform:translateX(0);} }
@keyframes bell-ring { 0%{transform:rotate(0)} 25%{transform:rotate(15deg)} 50%{transform:rotate(-15deg)} 75%{transform:rotate(5deg)} 100%{transform:rotate(0)} }

*, *::before, *::after { box-sizing: border-box; }

.layout-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #F5F7F8;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Top Bar ── */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #FFFFFF;
  border-bottom: 1px solid rgba(91,140,143,0.12);
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  min-height: 62px;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

/* التاريخ والوقت */
.datetime-card {
  background: #E8F0F0;
  border-radius: 12px;
  padding: 6px 12px;
  min-width: 180px;
  flex-shrink: 0;
}

/* Plan Badge */
.plan-badge {
  background: #FFFFFF;
  border: 1px solid #DCE5E5;
  border-radius: 100px;
  padding: 5px 12px 5px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* User Menu */
.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 100px;
  transition: background 0.2s ease;
  flex-shrink: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: inherit;
}
.user-menu:hover { background: #E8F0F0; }

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5B8C8F 0%, #8BAFB1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
  flex-shrink: 0;
}

.user-info { text-align: right; }
.user-name { font-size: 13px; font-weight: 600; color: #2C3E3F; margin: 0; }
.user-role { font-size: 10px; color: #6B8A8C; margin: 0; }

/* Logout Button */
.logout-top-btn {
  background: none;
  border: 1px solid rgba(91,140,143,0.25);
  border-radius: 40px;
  padding: 7px 14px;
  font-size: 12px;
  color: #5B8C8F;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.logout-top-btn:hover { background: rgba(91,140,143,0.1); border-color: #5B8C8F; }

/* Hamburger */
.hamburger-btn {
  display: none;
  background: #FFFFFF;
  border: 1px solid rgba(91,140,143,0.2);
  border-radius: 12px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.hamburger-btn:hover { background: #E8F0F0; }

/* Notification */
.notification-btn {
  position: relative;
  background: #E8F0F0;
  border: none;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.notification-btn:hover { background: #DCE5E5; }
.notification-badge {
  position: absolute;
  top: -4px; right: -4px;
  background: #79674D;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 600;
  border-radius: 50%;
  width: 18px; height: 18px;
  display: flex; align-items: center; justify-content: center;
}
.notification-dropdown {
  position: absolute;
  top: 48px;
  width: 340px;
  max-width: calc(100vw - 24px);
  background: #FFFFFF;
  border: 1px solid #DCE5E5;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  z-index: 1000;
  overflow: hidden;
  animation: notification-slide 0.3s ease;
}

/* ── Sidebar ── */
.main-wrapper {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  min-height: calc(100dvh - 62px);
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 62px;
  height: calc(100dvh - 62px);
  overflow-y: auto;
  transition: all 0.3s ease;
}

.layout-shell[dir=rtl] .sidebar { border-left: 1px solid rgba(91,140,143,0.12); border-right: none; }
.layout-shell[dir=ltr] .sidebar { border-right: 1px solid rgba(91,140,143,0.12); border-left: none; }

.sidebar-overlay {
  position: fixed; top:0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.45);
  z-index: 998;
  animation: slide-overlay 0.3s ease;
}

.sidebar-mobile {
  position: fixed; top:0; left:0; bottom:0;
  width: 270px;
  background: #FFFFFF;
  z-index: 999;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  box-shadow: 2px 0 16px rgba(0,0,0,0.1);
}
.sidebar-mobile.open { transform: translateX(0); }
.layout-shell[dir=rtl] .sidebar-mobile { left:auto; right:0; transform:translateX(100%); }
.layout-shell[dir=rtl] .sidebar-mobile.open { transform:translateX(0); }

/* Nav */
.nav-btn {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 3px;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  color: #5C6F73;
}
.nav-btn:hover { background: #E8F0F0; color: #5B8C8F; }
.nav-btn.active { background: #E8F0F0; color: #5B8C8F; font-weight: 600; }
.nav-btn.active .nav-indicator { opacity: 1; }
.nav-indicator {
  width: 3px; height: 22px;
  background: #5B8C8F;
  border-radius: 100px;
  opacity: 0;
  transition: opacity 0.2s;
  margin-inline-start: auto;
  flex-shrink: 0;
}

.nav-group-btn {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 3px;
  transition: all 0.2s ease;
  font-size: 12.5px;
  font-weight: 600;
  color: #2C3E3F;
  font-family: inherit;
}
.nav-group-btn:hover { background: #F1F5F5; }
.nav-group-chevron { margin-inline-start: auto; font-size: 10px; color: #8BAFB1; transition: transform 0.2s ease; }
.nav-group-chevron.open { transform: rotate(180deg); }
.nav-group-items { padding-inline-start: 10px; }

/* Lang Toggle */
.lang-toggle { display:flex; gap:4px; background:#E8EDEE; border-radius:100px; padding:3px; }
.lang-btn { border:none; border-radius:100px; padding:5px 13px; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.2s; background:transparent; color:#8BAFB1; }
.lang-btn.active { background:#5B8C8F; color:#FFFFFF; box-shadow:0 2px 4px rgba(91,140,143,0.2); }

/* Logout */
.logout-btn {
  width:100%; border:1px solid rgba(91,140,143,0.25);
  background:rgba(91,140,143,0.05); color:#5B8C8F;
  border-radius:12px; padding:10px; font-size:13px; font-weight:500;
  cursor:pointer; transition:all 0.2s; font-family:inherit;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.logout-btn:hover { background:rgba(91,140,143,0.12); border-color:rgba(91,140,143,0.4); }

/* Main Content */
.main-content {
  flex:1;
  padding: 20px 20px 40px;
  overflow: auto;
  animation: fade-in 0.4s ease both;
  min-width: 0;
}

/* ── Responsive ── */

/* Tablet 768-1024 */
@media (max-width: 1024px) {
  .sidebar { width: 220px; }
  .datetime-card { min-width: 160px; }
  .plan-badge { display: none; }
}

/* Mobile < 768 */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .hamburger-btn { display: flex; }
  .datetime-card { display: none; }
  .user-info { display: none; }
  .plan-badge { display: none; }
  .logout-top-btn { display: none; }
  .top-bar { padding: 8px 14px; min-height: 56px; }
  .main-content { padding: 14px 12px 32px; }
}

/* Very small < 400 */
@media (max-width: 400px) {
  .top-bar { padding: 8px 10px; gap: 6px; }
  .main-content { padding: 10px 10px 28px; }
  .notification-dropdown { width: calc(100vw - 16px); }
}

@media (min-width: 769px) {
  .sidebar-mobile, .sidebar-overlay { display: none !important; }
}

/* ══════════════════════════════════════════════════════════
   ✅ الطباعة — تخفي كل شي إلا المحتوى الفعلي (بدون قائمة جانبية،
   شريط علوي، أزرار...) — تشتغل تلقائياً بكل صفحة بالنظام، بدون
   أي تعديل إضافي لأي صفحة لحالها
   ══════════════════════════════════════════════════════════ */
@media print {
  .sidebar, .sidebar-mobile, .sidebar-overlay, .top-bar,
  .logout-btn, .logout-top-btn, .notification-bell, .notification-dropdown,
  .no-print, button {
    display: none !important;
  }
  .main-content {
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }
  .layout-shell {
    display: block !important;
  }
  body, .layout-shell, .main-content {
    background: #FFFFFF !important;
  }
  * {
    box-shadow: none !important;
  }
}

/* ✅ رأس طباعة موحّد (شعار العيادة + الاسم) — يُستخدم عبر مكوّن <PrintHeader/>
   بأي صفحة، مخفي بالشاشة العادية، يظهر بس وقت الطباعة */
.print-only-header { display: none; }
@media print {
  .print-only-header {
    display: flex !important; align-items: center; justify-content: space-between;
    gap: 14px; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #DCE5E5;
  }
}
`

const PRIMARY = '#5B8C8F'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'

const LANG_KEY = 'cura-lang'
export function getStoredLang(): 'ar' | 'en' {
  return (localStorage.getItem(LANG_KEY) as 'ar' | 'en') || 'en'
}

interface Notification {
  id: number; title: string; message: string; time: string
  read: boolean; type: 'appointment' | 'alert' | 'system'
}

const T = {
  ar: { notifications: 'الإشعارات', markAllRead: 'تحديد الكل كمقروء', noNotifications: 'لا توجد إشعارات جديدة', viewAll: 'عرض الكل', plan: 'الباقة', logout: 'تسجيل الخروج', localDateTime: 'التاريخ والوقت المحلي' },
  en: { notifications: 'Notifications', markAllRead: 'Mark all as read', noNotifications: 'No new notifications', viewAll: 'View all', plan: 'Plan', logout: 'Sign Out', localDateTime: 'Local Date & Time' },
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ lang, isAr, onNavigate }: { lang: 'ar' | 'en'; isAr: boolean; onNavigate?: () => void }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [, setLang] = useState(lang)

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()
  const menuGroups = [
    {
      key: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: 'ti-layout-dashboard',
      items: [
        { path: '/dashboard', labelAr: 'الرئيسية', labelEn: 'Home', icon: 'ti-layout-dashboard', permission: null, superAdminOnly: false },
      ],
    },
    {
      key: 'clinical', labelAr: 'المرضى والمواعيد', labelEn: 'Patients & Appointments', icon: 'ti-calendar',
      items: [
        { path: '/patients', labelAr: 'المرضى', labelEn: 'Patients', icon: 'ti-users', permission: 'patients.view', superAdminOnly: false },
        { path: '/appointments', labelAr: 'المواعيد', labelEn: 'Appointments', icon: 'ti-calendar', permission: 'appointments.view', superAdminOnly: false },
        { path: '/daily', labelAr: 'جدول اليوم', labelEn: "Today's Schedule", icon: 'ti-calendar-event', permission: 'daily.view', superAdminOnly: false },
        { path: '/doctors', labelAr: 'الأطباء', labelEn: 'Doctors', icon: 'ti-stethoscope', permission: 'doctors.view', superAdminOnly: false },
        { path: '/staff', labelAr: 'فريق العمل', labelEn: 'Staff', icon: 'ti-users', permission: 'staff.view', superAdminOnly: false },
        { path: '/schedules', labelAr: 'جداول الدوام', labelEn: 'Schedules', icon: 'ti-calendar-time', permission: 'schedules.clinic.view', superAdminOnly: false },
        { path: '/doctor-calendar', labelAr: 'تقويم الطبيب', labelEn: 'Doctor Calendar', icon: 'ti-calendar-week', permission: 'appointments.view', superAdminOnly: false },
      ],
    },
    {
      key: 'clinic', labelAr: 'إدارة العيادة', labelEn: 'Clinic Management', icon: 'ti-building-hospital',
      items: [
        { path: '/departments', labelAr: 'الأقسام', labelEn: 'Departments', icon: 'ti-building-hospital', permission: 'departments.manage', superAdminOnly: false },
        { path: '/treatment-templates', labelAr: 'قوالب الزيارة', labelEn: 'Visit Templates', icon: 'ti-clipboard-list', permission: 'treatmenttemplates.manage', superAdminOnly: false },
        { path: '/insurance', labelAr: 'التأمين الصحي', labelEn: 'Health Insurance', icon: 'ti-heart-handshake', permission: 'insurance.view', superAdminOnly: false },
      ],
    },
    {
      key: 'finance', labelAr: 'المالية', labelEn: 'Finance', icon: 'ti-cash',
      items: [
        { path: '/invoices', labelAr: 'الفواتير', labelEn: 'Invoices', icon: 'ti-file-invoice', permission: 'payments.view', superAdminOnly: false },
        { path: '/payments', labelAr: 'المدفوعات', labelEn: 'Payments', icon: 'ti-cash', permission: 'payments.view', superAdminOnly: false },
        { path: '/settlements', labelAr: 'التسويات المالية', labelEn: 'Settlements', icon: 'ti-cash-banknote', permission: 'settlements.manage', superAdminOnly: false },
        { path: '/reports', labelAr: 'التقارير', labelEn: 'Reports', icon: 'ti-chart-bar', permission: 'reports.view', superAdminOnly: false },
      ],
    },
    {
      key: 'system', labelAr: 'النظام', labelEn: 'System', icon: 'ti-settings',
      items: [
        { path: '/users', labelAr: 'المستخدمون', labelEn: 'Users', icon: 'ti-users-group', permission: 'users.view', superAdminOnly: false },
        { path: '/permissions', labelAr: 'الصلاحيات', labelEn: 'Permissions', icon: 'ti-shield-lock', permission: 'settings.view', superAdminOnly: false },
        { path: '/settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: 'ti-settings', permission: 'settings.view', superAdminOnly: false },
      ],
    },
    {
      key: 'superadmin', labelAr: 'إدارة النظام', labelEn: 'Super Admin', icon: 'ti-diamond',
      items: [
        { path: '/superadmin/clinics', labelAr: 'العيادات', labelEn: 'Clinics', icon: 'ti-building-hospital', permission: null, superAdminOnly: true },
        { path: '/superadmin/plans', labelAr: 'الخطط', labelEn: 'Plans', icon: 'ti-diamond', permission: null, superAdminOnly: true },
      ],
    },
  ]

  const canSee = (item: { path: string; permission: string | null; superAdminOnly: boolean }) => {
    if (user.role === 'SuperAdmin') return item.superAdminOnly || item.path === '/dashboard'
    if (item.superAdminOnly) return false
    return item.permission === null || hasPermission(item.permission)
  }

  const visibleGroups = menuGroups
    .map(g => ({ ...g, items: g.items.filter(canSee) }))
    .filter(g => g.items.length > 0)

  // ✅ المجموعة اللي فيها الصفحة الحالية تكون مفتوحة تلقائياً
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const active = menuGroups.find(g => g.items.some(i => i.path === location.pathname))
    return active ? { [active.key]: true } : {}
  })
  const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))

  const handleNavigation = (path: string) => { navigate(path); onNavigate?.() }
 

 
  const handleLangChange = (l: 'ar' | 'en') => {
    localStorage.setItem(LANG_KEY, l); setLang(l)
    window.dispatchEvent(new CustomEvent('cura-lang-change', { detail: l }))
    window.location.reload()
  }

  return (
    <>
      {/* Logo & Clinic */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(91,140,143,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${PRIMARY} 0%, #8BAFB1 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(91,140,143,0.2)' }}>
          <img src={logo} alt="CURA" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
        {user.clinicName && <p style={{ fontSize: 15, color: TEXT_DARK, textAlign: 'center', margin: 0, fontWeight: 600, wordBreak: 'break-word' }}>{user.clinicName}</p>}
      </div>

      {/* Nav */}
         <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {visibleGroups.map(group => {
          const isOpen = !!openGroups[group.key]
          const hasActive = group.items.some(i => i.path === location.pathname)
          return (
            <div key={group.key} style={{ marginBottom: 2 }}>
              <button className="nav-group-btn" onClick={() => toggleGroup(group.key)}
                style={{ textAlign: isAr ? 'right' : 'left', color: hasActive ? PRIMARY : TEXT_DARK }}>
                <i className={`ti ${group.icon}`} style={{ fontSize: 17, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isAr ? group.labelAr : group.labelEn}</span>
                <span className={`nav-group-chevron${isOpen ? ' open' : ''}`}>▼</span>
              </button>
              {isOpen && (
                <div className="nav-group-items">
                  {group.items.map(item => (
                    <button key={item.path}
                      className={`nav-btn${location.pathname === item.path ? ' active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                      style={{ textAlign: isAr ? 'right' : 'left', justifyContent: isAr ? 'flex-end' : 'flex-start' }}>
                      <i className={`ti ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isAr ? item.labelAr : item.labelEn}</span>
                      <span className="nav-indicator" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px 16px', borderTop: '1px solid rgba(91,140,143,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Lang Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="lang-toggle">
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => handleLangChange('en')}>EN</button>
            <button className={`lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => handleLangChange('ar')} style={{ fontFamily: "'Cairo',sans-serif" }}>ع</button>
          </div>
        </div>

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: '#F8FAFA', borderRadius: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY} 0%, #8BAFB1 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#FFF', flexShrink: 0 }}>
            {(user.fullName || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_DARK, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName || '---'}</p>
            <p style={{ fontSize: 10, color: TEXT_MUTED, margin: 0 }}>{user.role || ''}</p>
          </div>
        </div>

        {/* Logout */}
        <button className="logout-btn" onClick={async () => {
          const refreshToken = localStorage.getItem('refreshToken')
          // ✅ نحتفظ برابط العيادة قبل ما نمسح localStorage
          const clinicSubdomain = localStorage.getItem('clinicSubdomain')
          try { const { default: api } = await import('../api/axios'); await api.post('/auth/logout', { refreshToken }) }
          finally {
            localStorage.clear()
            window.location.href = clinicSubdomain ? `/login/${clinicSubdomain}` : '/login'
          }
        }}>
          <i className="ti ti-logout" style={{ fontSize: 14 }} />
          {isAr ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </div>
    </>
  )
}

// ─── Notification Bell ────────────────────────────────────────────────────────
const NotificationBell = ({ notifications, onMarkAsRead, onViewAll, lang }: {
  notifications: Notification[]; onMarkAsRead: (id: number) => void; onViewAll: () => void; lang: 'ar' | 'en'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length
  const t = T[lang]; const isAr = lang === 'ar'

  useEffect(() => {
    if (unreadCount > 0) { setIsRinging(true); setTimeout(() => setIsRinging(false), 1000) }
  }, [unreadCount])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.notif-container')) setIsOpen(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const getIcon = (type: string) => ({ appointment: '📅', alert: '⚠️', system: '🔔' }[type] || '📋')

  return (
    <div className="notif-container" style={{ position: 'relative' }}>
      <button className="notification-btn" onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `${t.notifications} (${unreadCount} ${isAr ? 'غير مقروءة' : 'unread'})` : t.notifications}
        aria-expanded={isOpen} aria-haspopup="true"
        style={{ animation: isRinging ? 'bell-ring 0.5s ease-in-out' : 'none' }}>
        <span style={{ fontSize: 17 }}>🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown" style={{ [isAr ? 'left' : 'right']: 0 }}>
          <div style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#E8F0F0' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>{t.notifications}</h4>
            {unreadCount > 0 && <button onClick={() => notifications.forEach(n => !n.read && onMarkAsRead(n.id))} style={{ background: 'transparent', border: 'none', fontSize: 11, color: PRIMARY, cursor: 'pointer' }}>{t.markAllRead}</button>}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: TEXT_MUTED }}>
                <span style={{ fontSize: 28, opacity: 0.5 }}>🔕</span>
                <p style={{ fontSize: 13, marginTop: 8 }}>{t.noNotifications}</p>
              </div>
            ) : notifications.map(notif => (
              <button key={notif.id} type="button" onClick={() => onMarkAsRead(notif.id)}
                style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, borderInline: 'none', borderTop: 'none', display: 'flex', gap: 10, cursor: 'pointer', background: notif.read ? 'transparent' : '#E8F0F0', width: '100%', textAlign: isAr ? 'right' : 'left', font: 'inherit', color: 'inherit' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{getIcon(notif.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: notif.read ? 500 : 600, color: TEXT_DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.title}</span>
                    <span style={{ fontSize: 10, color: TEXT_MUTED, flexShrink: 0 }}>{notif.time}</span>
                  </div>
                  <p style={{ fontSize: 11, color: TEXT_MUTED, margin: 0 }}>{notif.message}</p>
                </div>
                {!notif.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#79674D', alignSelf: 'center', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
          {notifications.length > 0 && (
            <div style={{ padding: '9px 14px', borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
              <button onClick={onViewAll} style={{ background: 'transparent', border: 'none', fontSize: 12, color: PRIMARY, cursor: 'pointer' }}>{t.viewAll} →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [lang, setLangState] = useState<'ar' | 'en'>(getStoredLang)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [subscription, setSubscription] = useState<{ planName: string } | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState({ date: '', time: '' })
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'موعد جديد', message: 'تم إضافة موعد جديد مع د. أحمد السيد', time: 'منذ 5 دقائق', read: false, type: 'appointment' },
    { id: 2, title: 'تنبيه الحصة', message: 'اقتربت من الحد الأقصى لعدد المرضى (85%)', time: 'منذ ساعة', read: false, type: 'alert' },
    { id: 3, title: 'تحديث النظام', message: 'تم تحديث النظام إلى الإصدار الأحدث', time: 'منذ 3 ساعات', read: true, type: 'system' },
  ])

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()
  const isAr = lang === 'ar'
  const t = T[lang]

  const getLocalDateTime = () => {
    const now = new Date()
    return {
      date: now.toLocaleDateString(isAr ? 'ar-SA' : undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      time: now.toLocaleTimeString(isAr ? 'ar-SA' : undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
  }

  useEffect(() => {
    const id = 'cura-layout-css'
    if (!document.getElementById(id)) {
      const style = document.createElement('style'); style.id = id; style.textContent = layoutCss; document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    setCurrentDateTime(getLocalDateTime())
    const timer = setInterval(() => setCurrentDateTime(getLocalDateTime()), 1000)
    return () => clearInterval(timer)
  }, [lang])

  useEffect(() => {
    const handleLangChange = (e: Event) => setLangState((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  useEffect(() => {
    api.get('/dashboard').then(r => { if (r.data?.subscription) setSubscription(r.data.subscription) }).catch(() => {})
  }, [])

  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const setLang = (l: 'ar' | 'en') => {
    localStorage.setItem(LANG_KEY, l); setLangState(l)
    window.dispatchEvent(new CustomEvent('cura-lang-change', { detail: l }))
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    // ✅ نحتفظ برابط العيادة قبل ما نمسح localStorage، عشان نرجع لصفحة دخول نفس العيادة
    const clinicSubdomain = localStorage.getItem('clinicSubdomain')
    try { await api.post('/auth/logout', { refreshToken }) }
    finally {
      localStorage.clear()
      navigate(clinicSubdomain ? `/login/${clinicSubdomain}` : '/login')
    }
  }

  return (
    <div className="layout-shell" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif" }}>

      {/* ── Top Bar ── */}
      <div className="top-bar">

        {/* اليسار: التاريخ والوقت */}
        <div className="datetime-card">
          <div style={{ fontSize: 9, color: TEXT_MUTED, marginBottom: 2 }}>{t.localDateTime}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_DARK }}>{currentDateTime.date}</div>
          <div style={{ fontSize: 10, color: PRIMARY }}>{currentDateTime.time}</div>
        </div>

        {/* اليمين: كل العناصر */}
        <div className="top-bar-right">

          {/* الإشعارات */}
          <NotificationBell notifications={notifications}
            onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
            onViewAll={() => {}} lang={lang} />

          {/* الباقة */}
          {subscription && (
            <div className="plan-badge">
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E8F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📋</div>
              <div>
                <div style={{ fontSize: 9, color: TEXT_MUTED }}>{t.plan}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_DARK }}>{subscription.planName}</div>
              </div>
            </div>
          )}

          {/* المستخدم */}
          <button type="button" className="user-menu" onClick={() => navigate('/profile')}>
            <div className="user-avatar">{(user.fullName || 'U')[0].toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user.fullName || '---'}</p>
              <p className="user-role">{user.role || ''}</p>
            </div>
          </button>

          {/* تسجيل خروج */}
          <button className="logout-top-btn" onClick={handleLogout}>{t.logout}</button>

          {/* هامبرغر - موبايل فقط */}
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? (isAr ? 'إغلاق القائمة' : 'Close menu') : (isAr ? 'فتح القائمة' : 'Open menu')}
            aria-expanded={mobileMenuOpen}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2">
              {mobileMenuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main Wrapper ── */}
      <div className="main-wrapper">

        {/* Sidebar Overlay (موبايل) */}
        {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}

        {/* Sidebar Mobile */}
        <div className={`sidebar-mobile ${mobileMenuOpen ? 'open' : ''}`}>
          <Sidebar lang={lang} isAr={isAr} onNavigate={() => setMobileMenuOpen(false)} />
        </div>

        {/* Sidebar Desktop */}
        <aside className="sidebar">
          <Sidebar lang={lang} isAr={isAr} />
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}