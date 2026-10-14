import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import { PRIMARY, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

interface ClinicWorkload {
  clinicId: string
  clinicName: string
  isActive: boolean
  renewalCount: number
  currentPlanName: string | null
  currentBillingCycle: string | null
  subscriptionActive: boolean
  subscriptionEndDate: string | null
  usersCount: number
  patientsCount: number
  appointmentsCount: number
  emergencyVisitsCount: number
  activityCount: number
}

type SortKey = 'clinicName' | 'renewalCount' | 'usersCount' | 'patientsCount' | 'activityCount'

const T = {
  ar: {
    title: '📊 حجم عمل العيادات', subtitle: 'عدد تجديدات الاشتراك، المستخدمين، المرضى، والحركات لكل عيادة — لمقارنة حجم العمل',
    from: 'من', to: 'إلى', allTime: 'كل الوقت', resetFilter: 'إعادة تعيين',
    clinic: 'العيادة', plan: 'الخطة الحالية', renewals: 'مرات التجديد', users: 'المستخدمون', patients: 'المرضى',
    appointments: 'مواعيد', emergency: 'طوارئ', activity: 'إجمالي الحركات', status: 'الحالة',
    active: 'نشطة', inactive: 'موقوفة', noSubscription: 'بدون اشتراك', monthly: 'شهري', yearly: 'سنوي',
    loading: 'جارٍ التحميل...', noData: 'لا توجد عيادات',
    totalClinics: 'عدد العيادات', totalUsers: 'إجمالي المستخدمين', totalPatients: 'إجمالي المرضى', totalActivity: 'إجمالي الحركات',
  },
  en: {
    title: '📊 Clinic Workload', subtitle: 'Subscription renewals, users, patients and activity per clinic — to compare workload size',
    from: 'From', to: 'To', allTime: 'All time', resetFilter: 'Reset',
    clinic: 'Clinic', plan: 'Current Plan', renewals: 'Renewals', users: 'Users', patients: 'Patients',
    appointments: 'Appointments', emergency: 'ER', activity: 'Total Activity', status: 'Status',
    active: 'Active', inactive: 'Inactive', noSubscription: 'No subscription', monthly: 'Monthly', yearly: 'Yearly',
    loading: 'Loading...', noData: 'No clinics',
    totalClinics: 'Clinics', totalUsers: 'Total Users', totalPatients: 'Total Patients', totalActivity: 'Total Activity',
  },
}

export default function WorkloadReport() {
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const t = T[lang]
  const isAr = lang === 'ar'

  const [dtFrom, setDtFrom] = useState('')
  const [dtTo, setDtTo] = useState('')
  const [rows, setRows] = useState<ClinicWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('activityCount')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      // ✅ نطبّع المدى دايماً (نفس درس سجل الحركة اليومية) — لو "من" صار أحدث
      // من "إلى" بالغلط، ما نرسل مدى معكوس يرجع نتيجة فاضية بصمت
      const [effFrom, effTo] = dtFrom && dtTo && dtFrom > dtTo ? [dtTo, dtFrom] : [dtFrom, dtTo]
      const params = new URLSearchParams()
      if (effFrom) params.set('from', effFrom)
      if (effTo) params.set('to', effTo)
      const res = await api.get(`/clinics/workload-report?${params}`)
      setRows(res.data)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [dtFrom, dtTo])

  useEffect(() => { fetchReport() }, [fetchReport])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(d => !d)
    else { setSortKey(key); setSortDesc(true) }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortDesc ? -cmp : cmp
  })

  const totals = rows.reduce((acc, r) => ({
    users: acc.users + r.usersCount,
    patients: acc.patients + r.patientsCount,
    activity: acc.activity + r.activityCount,
  }), { users: 0, patients: 0, activity: 0 })

  const inputStyle: React.CSSProperties = { padding: '8px 11px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12.5, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }

  const Th = ({ label, sortableKey }: { label: string; sortableKey?: SortKey }) => (
    <th
      onClick={sortableKey ? () => toggleSort(sortableKey) : undefined}
      style={{ textAlign: isAr ? 'right' : 'left', padding: '10px 14px', fontWeight: 600, fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${BORDER}`, cursor: sortableKey ? 'pointer' : 'default', userSelect: 'none' }}>
      {label}{sortableKey && sortKey === sortableKey ? (sortDesc ? ' ▼' : ' ▲') : ''}
    </th>
  )

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif", background: '#F8FAFA', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 500, color: TEXT_DARK, margin: 0 }}>{t.title}</h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, marginBottom: 20 }}>{t.subtitle}</p>

        {/* Filters — من/إلى يحدّدان نافذة حساب "الحركات" فقط؛ التجديدات والمستخدمون والمرضى دايماً إجمالي */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>{t.from}</label>
            <input type="date" value={dtFrom} onChange={e => setDtFrom(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED }}>{t.to}</label>
            <input type="date" value={dtTo} onChange={e => setDtTo(e.target.value)} style={inputStyle} />
          </div>
          {(dtFrom || dtTo) && (
            <button onClick={() => { setDtFrom(''); setDtTo('') }}
              style={{ padding: '8px 12px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: TEXT_MUTED }}>
              ✕ {t.resetFilter} ({t.allTime})
            </button>
          )}
        </div>

        {/* Summary */}
        {!loading && rows.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              [t.totalClinics, rows.length, TEXT_DARK],
              [t.totalUsers, totals.users, PRIMARY],
              [t.totalPatients, totals.patients, '#22C55E'],
              [t.totalActivity, totals.activity, '#B8892A'],
            ].map(([label, value, color], i) => (
              <div key={i} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>{label as string}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: color as string, fontFamily: "'Inter',sans-serif" }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.loading}</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED }}>{t.noData}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFA' }}>
                    <Th label={t.clinic} sortableKey="clinicName" />
                    <Th label={t.status} />
                    <Th label={t.plan} />
                    <Th label={t.renewals} sortableKey="renewalCount" />
                    <Th label={t.users} sortableKey="usersCount" />
                    <Th label={t.patients} sortableKey="patientsCount" />
                    <Th label={t.appointments} />
                    <Th label={t.emergency} />
                    <Th label={t.activity} sortableKey="activityCount" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(r => (
                    <tr key={r.clinicId}>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontWeight: 600, color: TEXT_DARK }}>{r.clinicName}</td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: r.isActive ? '#E8F5E9' : '#F3F4F6', color: r.isActive ? '#22C55E' : '#6B7280' }}>
                          {r.isActive ? t.active : t.inactive}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED }}>
                        {r.currentPlanName ? `${r.currentPlanName} (${r.currentBillingCycle === 'yearly' ? t.yearly : t.monthly})` : t.noSubscription}
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif" }}>{r.renewalCount}</td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif" }}>{r.usersCount}</td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif" }}>{r.patientsCount}</td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif", color: TEXT_MUTED }}>{r.appointmentsCount}</td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif", color: TEXT_MUTED }}>{r.emergencyVisitsCount}</td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter',sans-serif", fontWeight: 700, color: PRIMARY }}>{r.activityCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
