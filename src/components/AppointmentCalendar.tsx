import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { formatTimeString } from '../utils/i18n'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const T = {
  ar: {
    chooseDay: 'اختر اليوم', today: 'اليوم', loading: 'جارٍ التحميل...',
    fetchFailed: 'تعذّر جلب المواعيد', minutesPerSlot: 'دقيقة/موعد', slotsAvailable: 'موعد متاح',
    firstVisit: 'أول زيارة', followUp: 'متابعة', currency: 'د.أ',
    unavailableTitle: 'غير متاح — اجتماع أو استراحة',
    legendAvailable: 'متاح', legendBooked: 'محجوز', legendAbsent: 'إجازة', legendSelected: 'مختار',
    days: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  },
  en: {
    chooseDay: 'Choose a day', today: 'Today', loading: 'Loading...',
    fetchFailed: 'Failed to load appointments', minutesPerSlot: 'min/slot', slotsAvailable: 'slots available',
    firstVisit: 'First visit', followUp: 'Follow-up', currency: 'JD',
    unavailableTitle: 'Not available — meeting or break',
    legendAvailable: 'Available', legendBooked: 'Booked', legendAbsent: 'Off', legendSelected: 'Selected',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
}

interface Slot {
  time: string
  dateTime: string
  isBooked: boolean
  isAbsent?: boolean   
  isAvailable: boolean
}

interface SlotsData {
  available: boolean
  reason?: string
  date: string
  doctorName: string
  workStart: string
  workEnd: string
  slotDuration: number
  firstVisitPrice: number | null
  followUpPrice: number | null
  totalSlots: number
  availableSlots: number
  slots: Slot[]
}

interface Props {
  doctorId: string
  onSelectSlot: (dateTime: string, price?: number) => void
  isFirstVisit?: boolean
  // ✅ موعد مُختار مسبقاً (مثلاً من الضغط على فترة متاحة بتقويم الطبيب) —
  // يفتح التقويم على اليوم الصحيح ويُبرز نفس الفترة تلقائياً، بدل ما يضطر
  // المستخدم يعيد البحث عنها يدوياً من جديد
  initialDateTime?: string
  // ✅ يحدَّد صراحة من الصفحة الأم عادةً — بدون تمريره كان يفرض العربية/RTL
  // دائماً بغض النظر عن لغة الصفحة، وإذا ما مُرِّر يرجع لتخزين المتصفح
  lang?: 'ar' | 'en'
}

// ✅ نفس منطق التنظيف بـ handleSlotSelect بالأسفل — يوحّد صيغ التاريخ/الوقت
// (مع/بدون ثوانٍ، T أو مسافة، مع/بدون منطقة زمنية) عشان تقدر تُقارَن
const normalizeDateTime = (dt: string) =>
  dt.replace('T', ' ').replace(/Z$/, '').replace(/\+\d{2}:\d{2}$/, '').slice(0, 16)

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'

export default function AppointmentCalendar({ doctorId, onSelectSlot, isFirstVisit = true, initialDateTime, lang }: Props) {
  const resolvedLang = lang ?? getStoredLang()
  const isAr = resolvedLang === 'ar'
  const t = T[resolvedLang]
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (!initialDateTime) return new Date()
    const d = new Date(initialDateTime.replace(' ', 'T'))
    return isNaN(d.getTime()) ? new Date() : d
  })
  const [slotsData, setSlotsData] = useState<SlotsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const appliedInitialSelectionRef = useRef(false)

  const fetchSlots = async (date: Date) => {
  setLoading(true)
  setSlotsData(null)
  try {
    // ✅ استخدم التاريخ المحلي بدون تحويل UTC
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    
    const res = await api.get(`/schedules/available-slots?doctorId=${doctorId}&date=${dateStr}`)
    setSlotsData(res.data)
  } catch {
    setSlotsData(null)
  } finally {
    setLoading(false)
  }
}


  useEffect(() => {
    if (doctorId) fetchSlots(selectedDate)
  }, [doctorId, selectedDate])

  // ✅ يُبرز الفترة اللي وصلت مسبقاً (initialDateTime) بمجرد ما تجيب بيانات
  // نفس اليوم — مرة وحدة بس، عشان ما يلغي اختيار المستخدم لفترة ثانية بعدها
  useEffect(() => {
    if (!slotsData || !initialDateTime || appliedInitialSelectionRef.current) return
    appliedInitialSelectionRef.current = true
    const target = normalizeDateTime(initialDateTime)
    const match = slotsData.slots.find(s => normalizeDateTime(s.dateTime) === target)
    if (match) setSelectedSlot(match.dateTime)
  }, [slotsData, initialDateTime])

  const getWeekDays = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      days.push(d)
    }
    return days
  }

 const handleSlotSelect = (slot: Slot) => {
  if (!slot.isAvailable) return
  setSelectedSlot(slot.dateTime)

  const cleanDateTime = normalizeDateTime(slot.dateTime)

  const price = isFirstVisit
    ? slotsData?.firstVisitPrice ?? undefined
    : slotsData?.followUpPrice ?? undefined

  onSelectSlot(cleanDateTime, price)

}

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}>

      {/* ── اختيار اليوم ── */}
      <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 10, letterSpacing: '0.5px' }}>
        {t.chooseDay}
      </p>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {getWeekDays().map((day, i) => {
          const isSelected = day.toDateString() === selectedDate.toDateString()
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <button
              key={i}
              type="button"
              onClick={() => { setSelectedDate(day); setSelectedSlot(null) }}
              style={{
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 14px', borderRadius: 14,
                border: `2px solid ${isSelected ? PRIMARY : BORDER}`,
                background: isSelected ? PRIMARY : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : TEXT_DARK,
                cursor: 'pointer', transition: 'all 0.2s',
                minWidth: 60,
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.8 }}>{t.days[day.getDay()]}</span>
              <span style={{ fontSize: 18, fontWeight: 700, margin: '2px 0' }}>{day.getDate()}</span>
              {isToday && (
                <span style={{ fontSize: 9, color: isSelected ? 'rgba(255,255,255,0.8)' : PRIMARY }}>
                  {t.today}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── المواعيد ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `3px solid ${PRIMARY_SOFT}`, borderTopColor: PRIMARY,
            animation: 'spin 0.8s linear infinite', margin: '0 auto 10px',
          }} />
          <p style={{ fontSize: 13 }}>{t.loading}</p>
        </div>
      ) : slotsData === null ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED }}>
          <p style={{ fontSize: 13 }}>{t.fetchFailed}</p>
        </div>
      ) : !slotsData.available ? (
        <div style={{
          textAlign: 'center', padding: '32px 0',
          background: '#F8FAFA', borderRadius: 14,
          border: `1px dashed ${BORDER}`,
        }}>
          <span style={{ fontSize: 32 }}>🏖️</span>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 8 }}>{slotsData.reason}</p>
        </div>
      ) : (
        <>
          {/* معلومات الدوام */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12, padding: '10px 14px',
            background: PRIMARY_SOFT, borderRadius: 12,
          }}>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>
              🕐 {slotsData.workStart} - {slotsData.workEnd}
              <span style={{ marginRight: 8 }}>({slotsData.slotDuration} {t.minutesPerSlot})</span>
            </span>
            <span style={{ fontSize: 12, color: '#4A7679', fontWeight: 600 }}>
              {slotsData.availableSlots} {t.slotsAvailable}
            </span>
          </div>

          {/* الأسعار */}
          {(slotsData.firstVisitPrice || slotsData.followUpPrice) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {slotsData.firstVisitPrice && (
                <span style={{
                  fontSize: 11, background: '#EBF4FF', color: '#3B7DD8',
                  padding: '4px 12px', borderRadius: 100, fontWeight: 600,
                }}>
                  {t.firstVisit}: {slotsData.firstVisitPrice} {t.currency}
                </span>
              )}
              {slotsData.followUpPrice && (
                <span style={{
                  fontSize: 11, background: '#E8F5E9', color: '#388E3C',
                  padding: '4px 12px', borderRadius: 100, fontWeight: 600,
                }}>
                  {t.followUp}: {slotsData.followUpPrice} {t.currency}
                </span>
              )}
            </div>
          )}

          {/* شبكة المواعيد */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8, marginBottom: 12,
          }}>
{slotsData.slots.map((slot, i) => {
  const isSelected = selectedSlot === slot.dateTime
  const isBooked = slot.isBooked
  const isAbsent = slot.isAbsent  // ✅
  const isPast = !slot.isAvailable && !slot.isBooked && !slot.isAbsent
  const isAvail = slot.isAvailable && !isBooked && !isAbsent

  let bg, color, border, cursor
  if (isSelected) {
    bg = PRIMARY; color = '#FFF'; border = PRIMARY; cursor = 'pointer'
  } else if (isAbsent) {  // ✅ جديد — لون مختلف للإجازة
    bg = '#FEF3C7'; color = '#92400E'; border = '#FCD34D'; cursor = 'not-allowed'
  } else if (isBooked) {
    bg = '#FEE2E2'; color = '#DC2626'; border = '#FCA5A5'; cursor = 'not-allowed'
  } else if (isPast) {
    bg = '#F3F4F6'; color = '#9CA3AF'; border = '#E5E7EB'; cursor = 'not-allowed'
  } else if (isAvail) {
    bg = '#DCFCE7'; color = '#16A34A'; border = '#86EFAC'; cursor = 'pointer'
  } else {
    bg = '#F3F4F6'; color = '#9CA3AF'; border = '#E5E7EB'; cursor = 'not-allowed'
  }

  return (
    <button key={i} type="button" onClick={() => handleSlotSelect(slot)}
      disabled={!isAvail && !isSelected}
      title={isAbsent ? t.unavailableTitle : ''}
      style={{ padding:'8px 4px', borderRadius:10, border:`1px solid ${border}`, background:bg, color, fontSize:12, fontWeight:600, cursor, transition:'all 0.15s', fontFamily:"'Inter', monospace", position:'relative' }}>
      {formatTimeString(slot.time)}
      {isBooked && <span style={{ position:'absolute', top:-4, right:-4, width:8, height:8, borderRadius:'50%', background:'#DC2626', border:'1px solid #FFF' }} />}
      {isAbsent && <span style={{ position:'absolute', top:-4, right:-4, fontSize:9 }}>🚫</span>}
    </button>
  )
})}
          </div>

          {/* مفتاح الألوان */}
         <div style={{ display:'flex', gap:16, fontSize:11, color:TEXT_MUTED, flexWrap:'wrap' }}>
  {[
    { color:'#E8F5E9', border:'#A5D6A7', label:t.legendAvailable },
    { color:'#FFF5F5', border:'#FECACA', label:t.legendBooked },
    { color:'#FEF3C7', border:'#FCD34D', label:t.legendAbsent },
    { color:PRIMARY, border:PRIMARY, label:t.legendSelected },
  ].map(item => (
    <span key={item.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ width:12, height:12, borderRadius:4, background:item.color, border:`1px solid ${item.border}`, display:'inline-block' }} />
      {item.label}
    </span>
  ))}
</div>
        </>
      )}
    </div>
  )
}