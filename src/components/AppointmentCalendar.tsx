import { useState, useEffect } from 'react'
import api from '../api/axios'

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
}



const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'

export default function AppointmentCalendar({ doctorId, onSelectSlot, isFirstVisit = true }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slotsData, setSlotsData] = useState<SlotsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

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

  const dayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

 const handleSlotSelect = (slot: Slot) => {
  if (!slot.isAvailable) return
  setSelectedSlot(slot.dateTime)
  
  // ✅ إزالة Z أو timezone إن وجد
  const cleanDateTime = slot.dateTime
    .replace('T', ' ')        // "2024-01-15T09:00" → "2024-01-15 09:00"
    .replace(/Z$/, '')        // إزالة Z
    .replace(/\+\d{2}:\d{2}$/, '') // إزالة +03:00
    .slice(0, 16)             // أخذ أول 16 حرف فقط "2024-01-15 09:00"
  
  const price = isFirstVisit
    ? slotsData?.firstVisitPrice ?? undefined
    : slotsData?.followUpPrice ?? undefined
    
  onSelectSlot(cleanDateTime, price)

}

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* ── اختيار اليوم ── */}
      <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 10, letterSpacing: '0.5px' }}>
        اختر اليوم
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
              <span style={{ fontSize: 10, opacity: 0.8 }}>{dayNames[day.getDay()]}</span>
              <span style={{ fontSize: 18, fontWeight: 700, margin: '2px 0' }}>{day.getDate()}</span>
              {isToday && (
                <span style={{ fontSize: 9, color: isSelected ? 'rgba(255,255,255,0.8)' : PRIMARY }}>
                  اليوم
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
          <p style={{ fontSize: 13 }}>جارٍ التحميل...</p>
        </div>
      ) : slotsData === null ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED }}>
          <p style={{ fontSize: 13 }}>تعذّر جلب المواعيد</p>
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
              <span style={{ marginRight: 8 }}>({slotsData.slotDuration} دقيقة/موعد)</span>
            </span>
            <span style={{ fontSize: 12, color: '#4A7679', fontWeight: 600 }}>
              {slotsData.availableSlots} موعد متاح
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
                  أول زيارة: {slotsData.firstVisitPrice} د.أ
                </span>
              )}
              {slotsData.followUpPrice && (
                <span style={{
                  fontSize: 11, background: '#E8F5E9', color: '#388E3C',
                  padding: '4px 12px', borderRadius: 100, fontWeight: 600,
                }}>
                  متابعة: {slotsData.followUpPrice} د.أ
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
      title={isAbsent ? 'غير متاح — اجتماع أو استراحة' : ''}
      style={{ padding:'8px 4px', borderRadius:10, border:`1px solid ${border}`, background:bg, color, fontSize:12, fontWeight:600, cursor, transition:'all 0.15s', fontFamily:"'Inter', monospace", position:'relative' }}>
      {slot.time}
      {isBooked && <span style={{ position:'absolute', top:-4, right:-4, width:8, height:8, borderRadius:'50%', background:'#DC2626', border:'1px solid #FFF' }} />}
      {isAbsent && <span style={{ position:'absolute', top:-4, right:-4, fontSize:9 }}>🚫</span>}
    </button>
  )
})}
          </div>

          {/* مفتاح الألوان */}
         <div style={{ display:'flex', gap:16, fontSize:11, color:TEXT_MUTED, flexWrap:'wrap' }}>
  {[
    { color:'#E8F5E9', border:'#A5D6A7', label:'متاح' },
    { color:'#FFF5F5', border:'#FECACA', label:'محجوز' },
    { color:'#FEF3C7', border:'#FCD34D', label:'إجازة' },  // ✅ جديد
    { color:PRIMARY, border:PRIMARY, label:'مختار' },
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