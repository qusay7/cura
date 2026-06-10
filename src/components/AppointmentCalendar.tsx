import { useState, useEffect } from 'react'
import api from '../api/axios'

interface Slot {
  time: string
  dateTime: string
  isBooked: boolean
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

export default function AppointmentCalendar({ doctorId, onSelectSlot, isFirstVisit = true }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slotsData, setSlotsData] = useState<SlotsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // جلب المواعيد المتاحة
  const fetchSlots = async (date: Date) => {
    setLoading(true)
    setSlotsData(null)
    try {
      const dateStr = date.toISOString().split('T')[0]
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

  // توليد أيام الأسبوع
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
    const price = isFirstVisit
      ? slotsData?.firstVisitPrice ?? undefined
      : slotsData?.followUpPrice ?? undefined
    onSelectSlot(slot.dateTime, price)
  }

  return (
    <div dir="rtl" className="space-y-4">

      {/* اختيار اليوم */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">اختر اليوم</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {getWeekDays().map((day, i) => {
            const isSelected = day.toDateString() === selectedDate.toDateString()
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl border transition ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className="text-xs">{dayNames[day.getDay()]}</span>
                <span className="text-lg font-bold">{day.getDate()}</span>
                {isToday && (
                  <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-blue-500'}`}>
                    اليوم
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* المواعيد المتاحة */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-400">جارٍ التحميل...</p>
          </div>
        ) : slotsData === null ? (
          <div className="text-center py-8 text-gray-400">
            <p>تعذّر جلب المواعيد</p>
          </div>
        ) : !slotsData.available ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <span className="text-3xl">🏖️</span>
            <p className="text-gray-500 mt-2">{slotsData.reason}</p>
          </div>
        ) : (
          <>
            {/* معلومات الدوام */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                🕐 {slotsData.workStart} - {slotsData.workEnd}
                <span className="mr-2">({slotsData.slotDuration} دقيقة/موعد)</span>
              </p>
              <p className="text-sm text-green-600 font-medium">
                {slotsData.availableSlots} موعد متاح
              </p>
            </div>

            {/* السعر */}
            {(slotsData.firstVisitPrice || slotsData.followUpPrice) && (
              <div className="flex gap-3 mb-3">
                {slotsData.firstVisitPrice && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                    أول زيارة: {slotsData.firstVisitPrice} ر.س
                  </span>
                )}
                {slotsData.followUpPrice && (
                  <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full">
                    متابعة: {slotsData.followUpPrice} ر.س
                  </span>
                )}
              </div>
            )}

            {/* شبكة المواعيد */}
            <div className="grid grid-cols-4 gap-2">
              {slotsData.slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                    selectedSlot === slot.dateTime
                      ? 'bg-blue-600 text-white'
                      : slot.isBooked
                      ? 'bg-red-50 text-red-300 cursor-not-allowed line-through'
                      : !slot.isAvailable
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>

            {/* مفتاح الألوان */}
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-200" />
                متاح
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-50" />
                محجوز
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-600" />
                مختار
              </span>
            </div>
          </>
        )}
      </div>

    </div>
  )
}