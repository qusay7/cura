import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'
import { getCurrencySymbol } from '../utils/i18n'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface ActiveEntry {
  id: string
  queueNumber: number
  status: 'waiting' | 'called' | 'completed' | 'cancelled'
  notes?: string | null
  createdAt: string
  price?: number | null
  amountPaid?: number | null
  isPaid: boolean
  patientId: string
  patientName: string
  patientPhone?: string | null
  doctorId?: string | null
  doctorName?: string | null
}

interface Department { id: string; name: string; type: number; isActive: boolean }

const T = {
  ar: {
    title: 'لوحة الطوارئ', subtitle: 'الحالات النشطة — الأحدث أولاً، لكل الأطباء المناوبين',
    noDeptTitle: '⚠️ لا يوجد قسم طوارئ', noDeptBody: 'يجب إنشاء قسم من نوع "طوارئ" أولاً من صفحة الأقسام.',
    goToDepartments: 'الذهاب لصفحة الأقسام',
    checkInNew: '+ تسجيل دخول جديد',
    noPatients: 'لا يوجد مرضى في الطوارئ حالياً',
    loading: 'جارٍ التحميل...',
    waiting: '⏳ انتظار', called: '📢 مُستدعى',
    noDoctor: 'بدون طبيب محدد',
    since: 'منذ',
  },
  en: {
    title: 'Emergency Dashboard', subtitle: 'Active cases — newest first, visible to all on-duty doctors',
    noDeptTitle: '⚠️ No Emergency Department', noDeptBody: 'Create a department of type "Emergency" first from the Departments page.',
    goToDepartments: 'Go to Departments',
    checkInNew: '+ New Check-In',
    noPatients: 'No patients currently in the ER',
    loading: 'Loading...',
    waiting: '⏳ Waiting', called: '📢 Called',
    noDoctor: 'No doctor assigned yet',
    since: 'since',
  },
}

const timeAgo = (iso: string, isAr: boolean): string => {
  const diffMs = Date.now() - new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return isAr ? 'الآن' : 'just now'
  if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return isAr ? `منذ ${hours} س` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  return isAr ? `منذ ${days} يوم` : `${days}d ago`
}

export default function EmergencyDashboard() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const navigate = useNavigate()
  const t = T[lang]
  const isAr = lang === 'ar'

  const [department, setDepartment] = useState<Department | null>(null)
  const [entries, setEntries] = useState<ActiveEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const depts = await api.get('/departments').then(res => res.data).catch(() => [])
      const dept = (depts as Department[]).find(d => d.type === 1 && d.isActive) || null
      setDepartment(dept)
      if (dept) {
        const res = await api.get(`/queue/active?departmentId=${dept.id}`)
        setEntries(res.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: TEXT_MUTED }}>{t.loading}</div>
  )

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 600, color: '#EF4444', marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
              {isAr ? 'طوارئ' : 'Emergency'}
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>🚨 {t.title}</h2>
            <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6 }}>{t.subtitle}</p>
          </div>
          {department && (
            <button onClick={() => navigate('/emergency/check-in')}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t.checkInNew}
            </button>
          )}
        </div>

        {!department ? (
          <div style={{ background: '#FFF8E1', border: '1px solid #FCD34D', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#B8892A', margin: '0 0 6px' }}>{t.noDeptTitle}</p>
            <p style={{ fontSize: 13, color: TEXT_MUTED, margin: '0 0 14px' }}>{t.noDeptBody}</p>
            <button onClick={() => navigate('/departments')}
              style={{ background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t.goToDepartments}
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 40, textAlign: 'center', color: TEXT_MUTED }}>
            {t.noPatients}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map(e => (
              <div key={e.id} onClick={() => navigate(`/emergency/${e.id}`)}
                style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, transition: 'all 0.15s ease' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: TEXT_DARK }}>{e.patientName}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 100,
                      background: e.status === 'waiting' ? '#FFF8E1' : '#EBF4FF',
                      color: e.status === 'waiting' ? '#F59E0B' : '#3B82F6',
                    }}>
                      {e.status === 'waiting' ? t.waiting : t.called}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span>👨‍⚕️ {e.doctorName || t.noDoctor}</span>
                    <span>🕒 {t.since} {timeAgo(e.createdAt, isAr)}</span>
                    {e.price != null && <span style={{ fontFamily: "'Inter',sans-serif" }}>💰 {e.price} {getCurrencySymbol(lang)}</span>}
                  </div>
                  {e.notes && <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginTop: 4, fontStyle: 'italic' }}>{e.notes}</div>}
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: PRIMARY, fontFamily: "'Inter',sans-serif" }}>#{e.queueNumber}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
