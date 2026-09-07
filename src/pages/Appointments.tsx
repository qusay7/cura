import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { Appointment } from '../types'
import { ECGAnimation } from '../components/ECGAnimation'
import { hasPermission } from '../utils/permissions'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import SearchableSelect from '../components/SearchableSelect'
import PrintHeader from '../components/PrintHeader'
import ExportBar from '../components/ExportBar'
import { useColumnVisibility, ColumnToggleButton, type ColumnDef } from '../components/ColumnToggle'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const globalCss = `
@keyframes pulse-red { 0%,100%{background-color:#FFF0F0;} 50%{background-color:#FECACA;} }
@keyframes fade-up-modal { from{opacity:0;transform:translateY(12px) scale(0.98);} to{opacity:1;transform:translateY(0) scale(1);} }
.detail-card { animation: fade-up-modal 0.2s cubic-bezier(0.2,0.9,0.4,1.1) both; }

.appointments-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.appointment-row { animation: slide-in 0.3s ease both; }
.appointment-row:nth-child(1){animation-delay:0.02s} .appointment-row:nth-child(2){animation-delay:0.04s}
.appointment-row:nth-child(3){animation-delay:0.06s} .appointment-row:nth-child(4){animation-delay:0.08s}
.appointment-row:nth-child(5){animation-delay:0.10s}
.appointments-shell * { box-sizing:border-box; }
.appointments-shell ::-webkit-scrollbar{width:5px;height:5px;}
.appointments-shell ::-webkit-scrollbar-track{background:#E8EDEE;border-radius:4px;}
.appointments-shell ::-webkit-scrollbar-thumb{background:#8BAFB1;border-radius:4px;}
.appointments-table{width:100%;border-collapse:separate;border-spacing:0;}
.appointments-table th{position:sticky;top:0;background:#F8FAFA;z-index:10;}
.appointments-table td{transition:background 0.2s ease;}
.search-input:focus{border-color:#5B8C8F !important;box-shadow:0 0 0 3px rgba(91,140,143,0.1) !important;}
.react-datepicker-wrapper{width:100%;} .react-datepicker__input-container{width:100%;}
.react-datepicker__input-container input{width:100%;background:#FFFFFF;border:1px solid #DCE5E5;border-radius:12px;padding:10px 14px;font-size:13px;font-family:inherit;color:#2C3E3F;outline:none;transition:all 0.2s ease;cursor:pointer;direction:ltr !important;text-align:left !important;}
.react-datepicker__input-container input:focus{border-color:#5B8C8F;box-shadow:0 0 0 3px rgba(91,140,143,0.1);}
.react-datepicker{font-family:inherit;border-radius:16px;border-color:#DCE5E5;}
.react-datepicker__header{background-color:#E8F0F0;border-bottom-color:#DCE5E5;}
.react-datepicker__current-month{color:#2C3E3F;font-weight:600;}
.react-datepicker__day-name{color:#6B8A8C;}
.react-datepicker__day--selected{background-color:#5B8C8F;}
.react-datepicker__day--selected:hover{background-color:#4A7679;}
.react-datepicker__day:hover{background-color:#E8F0F0;}
.action-btn{border-radius:8px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s ease;border:1px solid;white-space:nowrap;}
.action-btn:disabled{opacity:0.5;cursor:not-allowed;}
.row-due{animation:pulse-red 1.2s ease-in-out infinite !important;}
`

const PRIMARY_DARK = '#4A7679'
const SUCCESS = '#4A7679'
const INFO = '#8BAFB1'
const DANGER = '#79674D'

const T = {
  ar: {
    title: 'المواعيد', addAppointment: 'حجز موعد', patient: 'المريض',
    doctor: 'الطبيب', date: 'التاريخ والوقت', type: 'النوع', price: 'السعر',
    status: 'الحالة', actions: 'إجراءات', noAppointments: 'لا يوجد مواعيد',
    patientNumber: 'رقم المريض', scheduled: 'مجدول', confirmed: 'مؤكد',
    completed: 'مكتمل', cancelled: 'ملغي', riyal: 'د.أ',
    loadingMessage: 'جاري تحميل المواعيد', loadingSub: 'يرجى الانتظار أثناء تحميل جدول المواعيد',
    today: 'اليوم', tomorrow: 'غداً', filterAll: 'الكل', filterUpcoming: 'القادمة', filterToday: 'اليوم',
    searchPatient: 'بحث عن مريض...', searchDoctor: 'بحث عن طبيب...',
    searchDateFrom: 'من تاريخ', searchDateTo: 'إلى تاريخ', clearDate: 'مسح التاريخ',
    confirm: 'تأكيد', complete: 'مكتمل', cancel: 'إلغاء', edit: 'تعديل',
    checkIn: 'دخول', checkOut: 'خروج',
    noAppointmentsToday: 'لا توجد مواعيد اليوم', noAppointmentsTodayHint: 'يمكنك حجز موعد جديد للمرضى',
    clearAllFilters: 'مسح جميع الفلاتر', totalAppointments: 'إجمالي المواعيد',
    completedLabel: 'المكتملة', remainingLabel: 'المتبقية', cancelledLabel: 'الملغية',
    revenueLabel: 'إجمالي الإيرادات', searchResults: 'نتائج البحث', schedule: 'جدول المواعيد',
    appointments: 'موعد', allStatus: 'كل الحالات',
    overdueLabel: 'فات الوقت', dueLabel: 'حان الموعد الآن!',
    checkedIn: 'تم الدخول', checkedOut: 'تم الخروج',
    // ✅ نافذة إنهاء الزيارة السريع — فاتورة ببنود متعددة
    quickCheckoutTitle: 'إنهاء الزيارة', quickCheckoutHint: 'سجّل ملاحظة الزيارة وبنود الفاتورة بخطوة واحدة (اختياري)',
    diagnosis: 'التشخيص', prescription: 'الوصفة الطبية', visitNotes: 'ملاحظات',
    invoiceItems: 'بنود الفاتورة', itemDesc: 'البند', itemPrice: 'السعر', itemInsurance: 'يغطيه التأمين',
    addItem: '+ إضافة بند', removeItem: 'حذف',
    totalAmount: 'المجموع الكلي', totalInsurance: 'يغطيه التأمين', totalPatientOwes: 'على المريض',
    amountPaidNow: 'المبلغ المدفوع الآن', paymentMethod: 'طريقة الدفع', cash: 'نقدي', card: 'بطاقة', insurance: 'تأمين',
    remainingAfterPayment: 'المتبقي على المريض بعد هذي الدفعة',
    finishVisit: 'إنهاء الزيارة', skipAndFinish: 'تخطي وإنهاء فقط', saving: 'جارٍ الحفظ...',
    quickCheckoutError: 'حدث خطأ أثناء الإنهاء', skipWarning: 'سيُسجَّل الموعد كمكتمل بدون دفعة — يظهر بالتقارير كمبلغ مستحق',
  },
  en: {
    title: 'Appointments', addAppointment: 'Book Appointment', patient: 'Patient',
    doctor: 'Doctor', date: 'Date & Time', type: 'Type', price: 'Price',
    status: 'Status', actions: 'Actions', noAppointments: 'No appointments found',
    patientNumber: 'Patient ID', scheduled: 'Scheduled', confirmed: 'Confirmed',
    completed: 'Completed', cancelled: 'Cancelled', riyal: 'JD',
    loadingMessage: 'Loading Appointments', loadingSub: 'Please wait while we load appointment data',
    today: 'Today', tomorrow: 'Tomorrow', filterAll: 'All', filterUpcoming: 'Upcoming', filterToday: 'Today',
    searchPatient: 'Search patient...', searchDoctor: 'Search doctor...',
    searchDateFrom: 'From date', searchDateTo: 'To date', clearDate: 'Clear date',
    confirm: 'Confirm', complete: 'Complete', cancel: 'Cancel', edit: 'Edit',
    checkIn: 'Check In', checkOut: 'Check Out',
    noAppointmentsToday: 'No appointments today', noAppointmentsTodayHint: 'You can book a new appointment for patients',
    clearAllFilters: 'Clear all filters', totalAppointments: 'Total',
    completedLabel: 'Completed', remainingLabel: 'Remaining', cancelledLabel: 'Cancelled',
    revenueLabel: 'Total Revenue', searchResults: 'search results', schedule: 'Schedule',
    appointments: 'appointments', allStatus: 'All Status',
    overdueLabel: 'Overdue', dueLabel: 'Appointment Now!',
    checkedIn: 'Checked In', checkedOut: 'Checked Out',
    quickCheckoutTitle: 'Finish Visit', quickCheckoutHint: 'Log the visit note and invoice items in one step (optional)',
    diagnosis: 'Diagnosis', prescription: 'Prescription', visitNotes: 'Notes',
    invoiceItems: 'Invoice Items', itemDesc: 'Item', itemPrice: 'Price', itemInsurance: 'Insurance Covers',
    addItem: '+ Add Item', removeItem: 'Remove',
    totalAmount: 'Total Amount', totalInsurance: 'Insurance Covers', totalPatientOwes: 'Patient Owes',
    amountPaidNow: 'Amount Paid Now', paymentMethod: 'Payment Method', cash: 'Cash', card: 'Card', insurance: 'Insurance',
    remainingAfterPayment: "Patient's remaining balance after this payment",
    finishVisit: 'Finish Visit', skipAndFinish: 'Skip & Finish', saving: 'Saving...',
    quickCheckoutError: 'An error occurred while finishing the visit', skipWarning: 'The visit will be marked complete with no payment — it will show as due in reports',
  },
}

// ─── Loading Screen ──────────────────────────────────────────────────────────
const AppointmentsLoadingScreen = ({ msg, subMsg }: { msg: string; subMsg: string }) => (
  <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.95)', backdropFilter:'blur(8px)', zIndex:9999 }}>
    <div style={{ textAlign:'center', padding:'2rem', maxWidth:400, width:'100%' }}>
      <div style={{ background:PRIMARY_SOFT, borderRadius:20, padding:'20px 24px', marginBottom:'1.5rem', border:`1px solid ${BORDER}` }}>
        <ECGAnimation height={100} showLetters={true} speed={0.7} />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:9, color:TEXT_MUTED }}>
          <span>📅 FETCHING DATA</span><span>⚡ LOADING</span><span>📊 SECURE</span>
        </div>
      </div>
      <h3 style={{ fontSize:18, fontWeight:600, color:TEXT_DARK, marginBottom:8, fontFamily:"'Playfair Display', serif" }}>{msg}</h3>
      <p style={{ fontSize:13, color:TEXT_MUTED, marginBottom:24 }}>{subMsg}</p>
      <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY, animation:`pulse-soft 1.5s ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  </div>
)

// ─── Payment Badge ───────────────────────────────────────────────────────────
const PaymentBadge = ({ isPaid, lang }: { isPaid: boolean | null | undefined; lang: 'ar' | 'en' }) => {
  const isAr = lang === 'ar'
  // ✅ isPaid == undefined/null يعني "ما فيه سجل دفعة إطلاقاً" — ما نعرضها كخطأ، بس ما نعرض شارة أصلاً
  if (isPaid === null || isPaid === undefined) return null
  return isPaid ? (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:100, fontSize:10.5, fontWeight:700, background:'#E8F5E9', color:'#22C55E' }}>
      ✅ {isAr ? 'مدفوع' : 'Paid'}
    </span>
  ) : (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:100, fontSize:10.5, fontWeight:700, background:'#FFF8E1', color:'#B8892A' }}>
      ⏳ {isAr ? 'غير مدفوع' : 'Unpaid'}
    </span>
  )
}

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status, lang }: { status: string; lang: 'ar' | 'en' }) => {
  const t = T[lang]
  const config = (() => {
    switch (status) {
      case 'scheduled': return { color:INFO,      bg:`${INFO}20`,       label:t.scheduled, icon:'⏰' }
      case 'confirmed': return { color:SUCCESS,   bg:`${SUCCESS}20`,    label:t.confirmed, icon:'✓'  }
      case 'completed': return { color:PRIMARY,   bg:`${PRIMARY}20`,    label:t.completed, icon:'✔️' }
      case 'cancelled': return { color:DANGER,    bg:`${DANGER}20`,     label:t.cancelled, icon:'✕'  }
      default:          return { color:TEXT_MUTED, bg:`${TEXT_MUTED}20`, label:status,     icon:'📋' }
    }
  })()
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:100, fontSize:11, fontWeight:600, background:config.bg, color:config.color }}>
      <span style={{ fontSize:10 }}>{config.icon}</span>{config.label}
    </span>
  )
}

// ─── Custom Date Input ───────────────────────────────────────────────────────
const CustomDateInput = ({ value, onClick, placeholder }: { value?: string; onClick?: () => void; placeholder?: string }) => (
  <input type="text" value={value||''} onClick={onClick} placeholder={placeholder||'dd/mm/yyyy'} readOnly
    style={{ width:'100%', background:'#FFFFFF', border:`1px solid ${BORDER}`, borderRadius:12, padding:'10px 14px', fontSize:13, fontFamily:'inherit', color:TEXT_DARK, outline:'none', cursor:'pointer', direction:'ltr', textAlign:'left' }} />
)

// ─── Filter Bar ──────────────────────────────────────────────────────────────
const FilterBar = ({
  currentFilter, onFilterChange, statusFilter, onStatusFilterChange,
  searchPatient, onSearchPatientChange, searchDoctor, onSearchDoctorChange,
  searchDateFrom, onSearchDateFromChange, searchDateTo, onSearchDateToChange, lang,
}: {
  currentFilter: string; onFilterChange: (f:string)=>void;
  statusFilter: string; onStatusFilterChange: (f:string)=>void;
  searchPatient: string; onSearchPatientChange: (v:string)=>void;
  searchDoctor: string; onSearchDoctorChange: (v:string)=>void;
  searchDateFrom: Date|null; onSearchDateFromChange: (v:Date|null)=>void;
  searchDateTo: Date|null; onSearchDateToChange: (v:Date|null)=>void;
  lang: 'ar'|'en';
}) => {
  const t = T[lang]; const isAr = lang==='ar'; const hasDateFilter = searchDateFrom||searchDateTo
  
  const periodFilters = [
    { value:'all',      label:t.filterAll,     icon:'📋' },
    { value:'upcoming', label:t.filterUpcoming, icon:'⏰' },
    { value:'today',    label:t.filterToday,    icon:'📅' },
  ]
  
  const statusFilters = [
    { value:'all_status', label:t.allStatus,  icon:'📋', color:'#6B8A8C', bg:'#F1F4F4' },
    { value:'scheduled',  label:t.scheduled,  icon:'⏰', color:'#F59E0B', bg:'#FFF8E1' },
    { value:'confirmed',  label:t.confirmed,  icon:'✓',  color:'#22C55E', bg:'#E8F5E9' },
    { value:'completed',  label:t.completed,  icon:'✔️', color:PRIMARY,   bg:PRIMARY_SOFT },
    { value:'cancelled',  label:t.cancelled,  icon:'✕',  color:'#EF4444', bg:'#FFF5F5' },
  ]

  return (
    <div style={{ marginBottom:24 }}>
      {/* Period + Status Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        {/* Period buttons */}
        <div style={{ display:'flex', gap:6, background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:4 }}>
          {periodFilters.map(f => (
            <button key={f.value} onClick={()=>onFilterChange(f.value)} 
              style={{ 
                padding:'8px 18px', 
                borderRadius:10, 
                fontSize:12, 
                fontWeight:currentFilter===f.value?600:500,
                background:currentFilter===f.value?PRIMARY:'transparent', 
                color:currentFilter===f.value?'#FFFFFF':TEXT_MUTED, 
                border:'none', 
                cursor:'pointer', 
                transition:'all 0.2s ease',
                display:'flex',
                alignItems:'center',
                gap:6,
              }}>
              <span>{f.icon}</span><span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Status buttons */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {statusFilters.map(f => {
            const isActive = statusFilter===f.value
            return (
              <button key={f.value} onClick={()=>onStatusFilterChange(f.value)} 
                style={{ 
                  padding:'8px 16px', 
                  borderRadius:100, 
                  fontSize:11, 
                  fontWeight:isActive?600:500, 
                  border:`1px solid ${isActive?f.color:BORDER}`, 
                  background:isActive?f.bg:'#FFFFFF', 
                  color:isActive?f.color:TEXT_MUTED, 
                  cursor:'pointer', 
                  transition:'all 0.15s ease', 
                  display:'flex', 
                  alignItems:'center', 
                  gap:5,
                  boxShadow:isActive?'0 2px 4px rgba(0,0,0,0.05)':'none',
                }}>
                <span>{f.icon}</span><span>{f.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search & Date - All in one row */}
      <div style={{ 
        display:'grid', 
        gridTemplateColumns:'1fr 1fr 1fr 1fr auto', 
        gap:12, 
        alignItems:'end',
        background:CARD_BG,
        border:`1px solid ${BORDER}`,
        borderRadius:16,
        padding:'16px 20px',
        boxShadow:'0 1px 3px rgba(0,0,0,0.02)',
      }}>
        {/* Patient Search */}
        <div style={{ position:'relative' }}>
          <label style={{ display:'block', fontSize:10, fontWeight:600, color:TEXT_MUTED, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>
            👤 {t.patient}
          </label>
          <input 
            type="text" 
            value={searchPatient} 
            onChange={e=>onSearchPatientChange(e.target.value)} 
            placeholder={t.searchPatient}
            style={{ 
              width:'100%', 
              background:'#F8FAFA', 
              border:`1px solid ${BORDER}`, 
              borderRadius:10, 
              padding:'9px 14px 9px 36px', 
              fontSize:13, 
              fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif", 
              color:TEXT_DARK, 
              outline:'none', 
              transition:'all 0.2s ease',
            }}
            onFocus={e=>{e.currentTarget.style.borderColor=PRIMARY;e.currentTarget.style.background='#FFFFFF'}}
            onBlur={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.background='#F8FAFA'}}
          />
          <span style={{ position:'absolute', bottom:'9px', left:12, fontSize:14, color:TEXT_MUTED }}>🔍</span>
          {searchPatient && (
            <button onClick={()=>onSearchPatientChange('')} 
              style={{ position:'absolute', bottom:'8px', right:10, background:'none', border:'none', cursor:'pointer', fontSize:12, color:TEXT_MUTED, padding:4 }}>
              ✕
            </button>
          )}
        </div>

        {/* Doctor Search */}
        <div style={{ position:'relative' }}>
          <label style={{ display:'block', fontSize:10, fontWeight:600, color:TEXT_MUTED, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>
            👨‍⚕️ {t.doctor}
          </label>
          <input 
            type="text" 
            value={searchDoctor} 
            onChange={e=>onSearchDoctorChange(e.target.value)} 
            placeholder={t.searchDoctor}
            style={{ 
              width:'100%', 
              background:'#F8FAFA', 
              border:`1px solid ${BORDER}`, 
              borderRadius:10, 
              padding:'9px 14px 9px 36px', 
              fontSize:13, 
              fontFamily:isAr?"'Cairo',sans-serif":"'Inter',sans-serif", 
              color:TEXT_DARK, 
              outline:'none', 
              transition:'all 0.2s ease',
            }}
            onFocus={e=>{e.currentTarget.style.borderColor=PRIMARY;e.currentTarget.style.background='#FFFFFF'}}
            onBlur={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.background='#F8FAFA'}}
          />
          <span style={{ position:'absolute', bottom:'9px', left:12, fontSize:14, color:TEXT_MUTED }}>🔍</span>
          {searchDoctor && (
            <button onClick={()=>onSearchDoctorChange('')} 
              style={{ position:'absolute', bottom:'8px', right:10, background:'none', border:'none', cursor:'pointer', fontSize:12, color:TEXT_MUTED, padding:4 }}>
              ✕
            </button>
          )}
        </div>

        {/* Date From */}
        <div>
          <label style={{ display:'block', fontSize:10, fontWeight:600, color:TEXT_MUTED, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>
            📅 {t.searchDateFrom}
          </label>
          <DatePicker 
            selected={searchDateFrom} 
            onChange={(d:Date|null)=>onSearchDateFromChange(d)} 
            dateFormat="dd/MM/yyyy" 
            placeholderText="From"
            customInput={
              <input 
                style={{ 
                  width:'100%', 
                  background:'#F8FAFA', 
                  border:`1px solid ${BORDER}`, 
                  borderRadius:10, 
                  padding:'9px 14px', 
                  fontSize:13, 
                  fontFamily:'inherit', 
                  color:TEXT_DARK, 
                  outline:'none', 
                  cursor:'pointer',
                  transition:'all 0.2s ease',
                }}
                onFocus={e=>{e.currentTarget.style.borderColor=PRIMARY;e.currentTarget.style.background='#FFFFFF'}}
                onBlur={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.background='#F8FAFA'}}
              />
            } 
          />
        </div>

        {/* Date To */}
        <div>
          <label style={{ display:'block', fontSize:10, fontWeight:600, color:TEXT_MUTED, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>
            📅 {t.searchDateTo}
          </label>
          <DatePicker 
            selected={searchDateTo} 
            onChange={(d:Date|null)=>onSearchDateToChange(d)} 
            dateFormat="dd/MM/yyyy" 
            placeholderText="To"
            customInput={
              <input 
                style={{ 
                  width:'100%', 
                  background:'#F8FAFA', 
                  border:`1px solid ${BORDER}`, 
                  borderRadius:10, 
                  padding:'9px 14px', 
                  fontSize:13, 
                  fontFamily:'inherit', 
                  color:TEXT_DARK, 
                  outline:'none', 
                  cursor:'pointer',
                  transition:'all 0.2s ease',
                }}
                onFocus={e=>{e.currentTarget.style.borderColor=PRIMARY;e.currentTarget.style.background='#FFFFFF'}}
                onBlur={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.background='#F8FAFA'}}
              />
            } 
          />
        </div>

        {/* Clear Filters Button */}
        <div style={{ display:'flex', alignItems:'center', paddingBottom:1 }}>
          <button 
            onClick={()=>{
              onSearchPatientChange('')
              onSearchDoctorChange('')
              onSearchDateFromChange(null)
              onSearchDateToChange(null)
            }}
            style={{ 
              background:hasDateFilter || searchPatient || searchDoctor ? PRIMARY : '#F1F4F4',
              color:hasDateFilter || searchPatient || searchDoctor ? '#FFFFFF' : TEXT_MUTED,
              border:'none',
              borderRadius:10,
              padding:'9px 16px',
              fontSize:12,
              fontWeight:600,
              cursor:hasDateFilter || searchPatient || searchDoctor ? 'pointer' : 'default',
              transition:'all 0.2s ease',
              whiteSpace:'nowrap',
              display:'flex',
              alignItems:'center',
              gap:6,
              opacity:hasDateFilter || searchPatient || searchDoctor ? 1 : 0.5,
            }}
            onMouseEnter={e=>{
              if(hasDateFilter || searchPatient || searchDoctor) {
                e.currentTarget.style.background=PRIMARY_DARK
                e.currentTarget.style.transform='translateY(-1px)'
              }
            }}
            onMouseLeave={e=>{
              if(hasDateFilter || searchPatient || searchDoctor) {
                e.currentTarget.style.background=PRIMARY
                e.currentTarget.style.transform='translateY(0)'
              }
            }}
            disabled={!hasDateFilter && !searchPatient && !searchDoctor}
          >
            <span>🔄</span> {t.clearAllFilters}
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(hasDateFilter || searchPatient || searchDoctor || statusFilter !== 'all_status') && (
        <div style={{ marginTop:12, display:'flex', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:TEXT_MUTED, display:'flex', alignItems:'center', gap:4 }}>
            🔍 {t.searchResults}:
          </span>
          {searchPatient && (
            <span style={{ background:PRIMARY_SOFT, padding:'4px 12px', borderRadius:100, fontSize:11, color:PRIMARY, display:'flex', alignItems:'center', gap:4 }}>
              👤 {searchPatient}
              <button onClick={()=>onSearchPatientChange('')} style={{ background:'none', border:'none', cursor:'pointer', color:PRIMARY, padding:0, fontSize:12 }}>✕</button>
            </span>
          )}
          {searchDoctor && (
            <span style={{ background:PRIMARY_SOFT, padding:'4px 12px', borderRadius:100, fontSize:11, color:PRIMARY, display:'flex', alignItems:'center', gap:4 }}>
              👨‍⚕️ {searchDoctor}
              <button onClick={()=>onSearchDoctorChange('')} style={{ background:'none', border:'none', cursor:'pointer', color:PRIMARY, padding:0, fontSize:12 }}>✕</button>
            </span>
          )}
          {searchDateFrom && (
            <span style={{ background:PRIMARY_SOFT, padding:'4px 12px', borderRadius:100, fontSize:11, color:PRIMARY }}>
              📅 From: {searchDateFrom.toLocaleDateString('en-GB')}
            </span>
          )}
          {searchDateTo && (
            <span style={{ background:PRIMARY_SOFT, padding:'4px 12px', borderRadius:100, fontSize:11, color:PRIMARY }}>
              📅 To: {searchDateTo.toLocaleDateString('en-GB')}
            </span>
          )}
          {statusFilter !== 'all_status' && (
            <span style={{ background:PRIMARY_SOFT, padding:'4px 12px', borderRadius:100, fontSize:11, color:PRIMARY }}>
              {statusFilters.find(f=>f.value===statusFilter)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Payment Modal (موحّد لـ checkout و payLater) ────────────────────────────
// ✅ كل بند بالفاتورة = نوع زيارة مختار من قوالب العلاج (TreatmentPlanTemplates)،
// وعند الحفظ يُخزَّن كل بند بسطر مستقل لنفس الموعد
interface InvoiceItem { templateId: string; desc: string; price: string; insuranceRate: string; covered: boolean }
const emptyItem = (): InvoiceItem => ({ templateId: '', desc: '', price: '', insuranceRate: '', covered: true })
const itemInsuranceAmount = (it: InvoiceItem) =>
  it.covered ? Math.round((parseFloat(it.price) || 0) * (parseFloat(it.insuranceRate) || 0) / 100 * 1000) / 1000 : 0

interface PaymentModalProps {
  appointmentId: string
  mode: 'checkout' | 'payLater'
  appointment: Appointment | undefined
  lang: 'ar' | 'en'
  t: typeof T['ar']
  onClose: () => void
  onSuccess: (updates: Partial<Appointment> & { status?: string; checkOutTime?: string }) => void
}

function PaymentModal({ appointmentId, mode, appointment, lang, t, onClose, onSuccess }: PaymentModalProps) {
  const isAr = lang === 'ar'
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingInsurance, setLoadingInsurance] = useState(true)
  const [patientHasInsurance, setPatientHasInsurance] = useState(false)
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()])
  const [form, setForm] = useState({ diagnosis: '', prescription: '', notes: '', paymentMethod: 'cash', amountPaidNow: '', nextVisitDate: '' })
  // ✅ لو فيه دفعة مسجّلة أصلاً لهذا الموعد (حتى لو بمبلغ صفر) — نعدّلها بدل ما نحاول
  // ننشئ وحدة جديدة، لأن AppointmentId فريد بجدول الدفعات وأي محاولة إنشاء ثانية بترمي خطأ
  const [existingPayment, setExistingPayment] = useState<any>(null)

  // ✅ قوالب العلاج — مصدر أنواع الزيارات المتاحة كبنود للفاتورة
  const [visitTemplates, setVisitTemplates] = useState<{ id: string; name: string; nameEn: string | null; firstVisitPrice: number | null; followUpPrice: number | null }[]>([])
  // ✅ قائمة المواعيد ما بترجّع templateId — نجيبه من سجل الموعد نفسه
  const [apptTemplateId, setApptTemplateId] = useState('')

  useEffect(() => {
    api.get('/treatmentplans/templates')
      .then(res => setVisitTemplates(res.data))
      .catch(() => setVisitTemplates([]))

    api.get(`/appointments/${appointmentId}`)
      .then(res => setApptTemplateId(res.data?.templateId || ''))
      .catch(() => {})

    if (mode !== 'checkout') return

    // ✅ نجيب ملاحظة الزيارة اللي أدخلها الطبيب وقت الدخول (شاشة "زيارة الطبيب") — تشخيص/
    // وصفة/موعد قادم — عشان ما يحتاج الموظف يعيد كتابتها وقت الخروج
    api.get(`/visitnotes/appointment/${appointmentId}`)
      .then(res => {
        if (res.data) {
          setForm(prev => ({
            ...prev,
            diagnosis: res.data.diagnosis || prev.diagnosis,
            prescription: res.data.prescription || prev.prescription,
            nextVisitDate: res.data.nextVisitDate ? res.data.nextVisitDate.split('T')[0] : prev.nextVisitDate,
          }))
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  // ✅ نجيب سعر الزيارة + حصة التأمين تلقائياً، أو الدفعة الموجودة أصلاً لو فيه وحدة سابقة
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingInsurance(true)
      const price = appointment?.price ?? 0

      // 1) تحقق أول: فيه دفعة مسجّلة أصلاً لهذا الموعد؟
      let existing: any = null
      try {
        const payRes = await api.get(`/payments/appointment/${appointmentId}`)
        if (payRes.data?.hasPayment) existing = payRes.data
      } catch { /* ما فيه دفعة مسجّلة بعد — طبيعي */ }

      if (cancelled) return

      if (existing) {
        // ✅ فيه دفعة سابقة — نعبّي الفورم منها بدل حساب جديد، ونحفظ بياناتها للتحديث لاحقاً
        setExistingPayment(existing)
        setPatientHasInsurance((existing.insuranceAmount ?? 0) > 0)
        const rate = existing.totalAmount > 0 ? String(Math.round((existing.insuranceAmount / existing.totalAmount) * 100)) : ''
        setItems(prev => prev.map((it, idx) => idx === 0 ? {
          ...it,
          price: String(existing.totalAmount ?? price),
          insuranceRate: rate,
          covered: (existing.insuranceAmount ?? 0) > 0,
        } : it))
        setForm(prev => ({ ...prev, amountPaidNow: existing.amountPaid != null ? String(existing.amountPaid) : '' }))
        setLoadingInsurance(false)
        return
      }

      // 2) ما فيه دفعة سابقة — نحسب حصة التأمين تلقائياً بنفس آلية صفحة الحجز
      let rate = ''
      let hasIns = false
      try {
        if (appointment?.patientId && price > 0) {
          const res = await api.get(`/insurance/calculate?patientId=${appointment.patientId}&amount=${price}`)
          if (res.data?.hasInsurance) {
            hasIns = true
            rate = String(res.data.coverageRate)
          }
        }
      } catch { /* ما فيه تأمين نشط أو تعذّر الحساب — يفضل فاضي، الموظف يعبّيه يدوياً لو احتاج */ }

      if (!cancelled) {
        setPatientHasInsurance(hasIns)
        // ✅ نبدأ بافتراض "مشمول" لو المريض عنده تأمين نشط — والموظف يقدر يلغيه بضغطة
        // لو رد التأمين الفعلي يقول إن هذا البند بالذات مستثنى (زي الأسنان غالباً)
        setItems(prev => prev.map((it, idx) => idx === 0 ? {
          ...it,
          price: price ? String(price) : '',
          insuranceRate: rate,
          covered: hasIns,
        } : it))
        setLoadingInsurance(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  // ✅ البند الأول افتراضياً = نوع الزيارة الفعلي للموعد، بعد ما توصل القوالب
  useEffect(() => {
    if (!visitTemplates.length) return
    const typeName = (appointment?.type || '').trim().toLowerCase()
    const tpl = visitTemplates.find(x => x.id === apptTemplateId)
      || visitTemplates.find(x => x.name.trim().toLowerCase() === typeName
        || (x.nameEn || '').trim().toLowerCase() === typeName)
    if (!tpl) return
    setItems(prev => prev.map((it, idx) => idx === 0
      ? { ...it, templateId: tpl.id, desc: isAr ? tpl.name : (tpl.nameEn || tpl.name) }
      : it))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitTemplates, apptTemplateId])

  const totals = (() => {
    const totalAmount = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0)
    // ✅ نتجاهل قيمة التأمين لأي بند غير مشمول، حتى لو فيه رقم قديم بالحقل (حماية إضافية)
    const totalInsurance = items.reduce((sum, it) => sum + itemInsuranceAmount(it), 0)
    const patientOwes = Math.max(0, totalAmount - totalInsurance)
    const paidNow = parseFloat(form.amountPaidNow) || 0
    const remaining = Math.max(0, patientOwes - paidNow)
    return { totalAmount, totalInsurance, patientOwes, remaining }
  })()

  const updateItem = (i: number, field: keyof InvoiceItem, value: string | boolean) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it))
  // ✅ اختيار نوع الزيارة للبند — الاسم والسعر يتعبّوا تلقائياً من القالب
  const pickTemplate = (i: number, templateId: string) => {
    const tpl = visitTemplates.find(x => x.id === templateId)
    const tplPrice = tpl ? (tpl.firstVisitPrice ?? tpl.followUpPrice) : null
    setItems(prev => prev.map((it, idx) => idx === i
      ? {
          ...it,
          templateId,
          desc: tpl ? (isAr ? tpl.name : (tpl.nameEn || tpl.name)) : '',
          price: tplPrice != null ? String(tplPrice) : it.price,
        }
      : it))
  }
  const toggleCovered = (i: number) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, covered: !it.covered } : it))
  const addItemRow = () => setItems(prev => [...prev, { ...emptyItem(), covered: patientHasInsurance }])
  const removeItemRow = (i: number) => setItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)

  const submit = async (skip: boolean) => {
    setSaving(true); setError('')
    try {
      // ✅ نحفظ أنواع الزيارة الفعلية — سطر لكل بند فاتورة على نفس الموعد
      if (mode === 'checkout') {
        const typeItems = items.filter(it => it.templateId)
        if (typeItems.length > 0) {
          await api.post(`/appointments/${appointmentId}/visit-types`, {
            items: typeItems.map(it => ({
              templateId: it.templateId,
              price: parseFloat(it.price) || 0,
              insuranceRate: it.covered ? (parseFloat(it.insuranceRate) || 0) : 0,
              insuranceAmount: itemInsuranceAmount(it),
            })),
          })
        }
      }

      let checkOutTime: string | undefined
      if (mode === 'checkout') {
        const res = await api.post(`/appointments/${appointmentId}/checkout`)
        checkOutTime = res.data.checkOutTime
      }

      if (!skip) {
        if (mode === 'checkout') {
          const filledItems = items.filter(it => it.desc.trim() || parseFloat(it.price) > 0)
          const itemsSummary = filledItems
            .map(it => it.covered
              ? `${it.desc || '-'}: ${it.price || 0} (${t.itemInsurance}: ${itemInsuranceAmount(it)})`
              : `${it.desc || '-'}: ${it.price || 0} (${isAr ? 'مستثنى من التأمين' : 'excluded from insurance'})`)
            .join(' | ')
          if (form.diagnosis.trim() || form.prescription.trim() || form.notes.trim() || filledItems.length > 0) {
            await api.post('/visitnotes', {
              patientId: appointment?.patientId,
              appointmentId,
              doctorId: appointment?.doctorId,
              diagnosis: form.diagnosis || null,
              prescription: form.prescription || null,
              notes: [form.notes, itemsSummary ? `📋 ${t.invoiceItems}: ${itemsSummary}` : ''].filter(Boolean).join('\n') || null,
            })
          }
        }

        if (totals.totalAmount > 0) {
          if (existingPayment) {
            // ✅ فيه دفعة أصلاً — نحدّثها بدل ما ننشئ وحدة جديدة (AppointmentId فريد بالجدول)
            await api.put(`/payments/${existingPayment.id}`, {
              totalAmount: totals.totalAmount,
              insuranceAmount: totals.totalInsurance,
              amountPaid: parseFloat(form.amountPaidNow) || 0,
              paymentMethod: form.paymentMethod,
              rowVersion: existingPayment.rowVersion,
            })
          } else {
            await api.post('/payments', {
              appointmentId,
              totalAmount: totals.totalAmount,
              insuranceAmount: totals.totalInsurance,
              amountPaid: parseFloat(form.amountPaidNow) || 0,
              paymentMethod: form.paymentMethod,
            })
          }
        }
      }

      onSuccess({
        ...(mode === 'checkout' ? { status: 'completed', checkOutTime } : {}),
        isPaid: skip ? false : totals.remaining <= 0,
        amountPaid: skip ? undefined : (parseFloat(form.amountPaidNow) || 0),
      })

      // ✅ لو فيه موعد قادم محدَّد (من ملاحظة الزيارة)، ننتقل تلقائياً:
      // لو فيه موعد فعلي موجود أصلاً بنفس التاريخ لهذا المريض → نفتحه للتأكيد
      // وإلا → نفتح شاشة حجز جديدة معبّاة مسبقاً بالمريض والتاريخ، الموظف يحدد الوقت بس
      if (mode === 'checkout' && !skip && form.nextVisitDate) {
        try {
          const checkRes = await api.get(`/appointments?date=${form.nextVisitDate}`)
          const existing = (checkRes.data as any[]).find(a =>
            a.patientId === appointment?.patientId && a.status !== 'cancelled' && a.id !== appointmentId)

          if (existing) {
            navigate(`/appointments/${existing.id}`)
          } else {
            navigate('/appointments/add', {
              state: {
                prefillPatientId: appointment?.patientId,
                prefillDoctorId: appointment?.doctorId,
                prefillDate: form.nextVisitDate,
              },
            })
          }
        } catch { /* تعذّر التحقق — النافذة تُغلق عادي بدون انتقال إضافي */ }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t.quickCheckoutError)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = { padding: '7px 9px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, fontFamily: "'Inter',sans-serif", color: TEXT_DARK, background: CARD_BG }

  return (
    <div onClick={() => !saving && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(2px)' }}>
      <div onClick={e => e.stopPropagation()} className="detail-card"
        style={{ background: CARD_BG, borderRadius: 22, padding: 26, maxWidth: 460, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>
              {mode === 'checkout' ? '🏁' : '💰'} {mode === 'checkout' ? t.quickCheckoutTitle : (isAr ? 'تسجيل دفعة' : 'Register Payment')}
            </h3>
            <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4, marginBottom: 0 }}>
              {mode === 'checkout' ? t.quickCheckoutHint : (isAr ? 'الموعد مكتمل أصلاً — هذي بس تسجيل دفعة لاحقة' : 'The visit is already completed — this just registers a payment')}
            </p>
          </div>
          <button onClick={onClose} disabled={saving}
            style={{ background: '#F1F4F4', border: 'none', borderRadius: 10, width: 30, height: 30, flexShrink: 0, color: TEXT_MUTED, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}>
            ✕
          </button>
        </div>

        {appointment?.patientName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 14, padding: '8px 12px', background: PRIMARY_SOFT, borderRadius: 10 }}>
            <span style={{ fontSize: 13 }}>👤</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK }}>{appointment.patientName}</span>
          </div>
        )}

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* حقول ملاحظة الزيارة — بوضع الخروج بس */}
        {mode === 'checkout' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>🩺 {t.diagnosis}</label>
              <input value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })}
                style={{ width: '100%', ...inputStyle, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>💊 {t.prescription}</label>
              <input value={form.prescription} onChange={e => setForm({ ...form, prescription: e.target.value })}
                style={{ width: '100%', ...inputStyle, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>📝 {t.visitNotes}</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                style={{ width: '100%', ...inputStyle, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'none' }} />
            </div>
            {form.nextVisitDate && (
              <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <div>
                  <p style={{ fontSize: 10.5, color: TEXT_MUTED, margin: 0 }}>{isAr ? 'الطبيب حدّد موعد للمراجعة' : "Doctor set a follow-up date"}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, margin: '2px 0 0', fontFamily: "'Inter',sans-serif" }}>
                    {new Date(form.nextVisitDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* بنود الفاتورة */}
        <div style={{ background: PRIMARY_SOFT, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, display: 'flex', alignItems: 'center', gap: 6 }}>
              🧾 {t.invoiceItems}
            </label>
            <button type="button" onClick={addItemRow}
              style={{ background: CARD_BG, border: `1px solid ${PRIMARY}50`, color: PRIMARY, borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              {t.addItem}
            </button>
          </div>

          {loadingInsurance ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '18px 0', color: TEXT_MUTED, fontSize: 12 }}>
              <span style={{ width: 14, height: 14, border: `2px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              {isAr ? 'جاري حساب السعر والتأمين...' : 'Calculating price & insurance...'}
            </div>
          ) : (
            <>
              {items.map((item, i) => {
                const itemPrice = parseFloat(item.price) || 0
                const itemInsurance = itemInsuranceAmount(item)
                const itemPatientOwes = Math.max(0, itemPrice - itemInsurance)
                return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 62px 55px 68px auto', gap: 6, alignItems: 'center' }}>
                    {/* ✅ البند = نوع زيارة يُختار من قوالب العلاج، بدل إدخال نص حر */}
                    <SearchableSelect
                      isRtl={isAr}
                      value={item.templateId}
                      onChange={v => pickTemplate(i, v)}
                      placeholder={t.itemDesc}
                      options={visitTemplates.map(tpl => ({ value: tpl.id, label: isAr ? tpl.name : (tpl.nameEn || tpl.name) }))}
                    />
                    <input type="number" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder={t.itemPrice} style={inputStyle} />
                    {/* ✅ نسبة تغطية التأمين (%) — نفس أسلوب شاشة الحجز، بدل إدخال مبلغ خام */}
                    <input type="number" min={0} max={100} value={item.covered ? item.insuranceRate : ''} disabled={!item.covered}
                      onChange={e => updateItem(i, 'insuranceRate', e.target.value)} placeholder={item.covered ? '%' : '—'}
                      title={t.itemInsurance}
                      style={{ ...inputStyle, textAlign: 'center', ...(item.covered && item.insuranceRate ? { borderColor: '#8BC79A', background: '#F3FBF4' } : {}), ...(!item.covered ? { background: '#F1F4F4', color: TEXT_MUTED, cursor: 'not-allowed' } : {}) }} />
                    {/* ✅ المبلغ المستحق على المريض لهذا البند بالذات — القيمة المهمة فعلياً للموظف */}
                    <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: PRIMARY, fontFamily: "'Inter',sans-serif" }}>
                      {itemPatientOwes.toFixed(2)}
                    </div>
                    <button type="button" onClick={() => removeItemRow(i)} disabled={items.length === 1}
                      style={{ background: 'none', border: 'none', color: items.length === 1 ? '#CBD5D5' : '#EF4444', cursor: items.length === 1 ? 'not-allowed' : 'pointer', fontSize: 15, padding: 4 }}>
                      ✕
                    </button>
                  </div>
                  {/* ✅ مفتاح صريح: هل التأمين يغطي هذا البند بالذات؟ (بعض الخدمات مستثناة، زي الأسنان غالباً) */}
                  {patientHasInsurance && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, cursor: 'pointer', width: 'fit-content' }}>
                      <input type="checkbox" checked={item.covered} onChange={() => toggleCovered(i)}
                        style={{ width: 13, height: 13, accentColor: PRIMARY, cursor: 'pointer' }} />
                      <span style={{ fontSize: 10.5, color: item.covered ? TEXT_MUTED : '#B8892A', fontWeight: item.covered ? 400 : 600 }}>
                        {item.covered
                          ? `🏥 ${isAr ? 'يغطي التأمين' : 'Insurance covers'} ${itemInsurance.toFixed(2)} ${t.riyal}`
                          : (isAr ? '🚫 مستثنى من التأمين (يدفعه المريض كامل)' : '🚫 Excluded from insurance (patient pays in full)')}
                      </span>
                    </label>
                  )}
                </div>
                )
              })}

              {/* عناوين الأعمدة — توضيح سريع لمعنى كل رقم بالصف */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 62px 55px 68px auto', gap: 6, marginTop: -4, marginBottom: 6, padding: '0 2px' }}>
                <span />
                <span style={{ fontSize: 9, color: TEXT_MUTED, textAlign: 'center' }}>{t.itemPrice}</span>
                <span style={{ fontSize: 9, color: TEXT_MUTED, textAlign: 'center' }}>{isAr ? 'تأمين %' : 'Ins. %'}</span>
                <span style={{ fontSize: 9, color: PRIMARY, textAlign: 'center', fontWeight: 700 }}>{isAr ? 'على المريض' : 'Patient'}</span>
                <span />
              </div>

              <div style={{ borderTop: `1px dashed ${BORDER}`, marginTop: 10, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: TEXT_MUTED }}>{t.totalAmount}</span>
                  <span style={{ fontWeight: 600, color: TEXT_DARK, fontFamily: "'Inter',sans-serif" }}>{totals.totalAmount.toFixed(2)}</span>
                </div>
                {totals.totalInsurance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: TEXT_MUTED }}>🏥 {t.totalInsurance}</span>
                    <span style={{ fontWeight: 600, color: SUCCESS, fontFamily: "'Inter',sans-serif" }}>-{totals.totalInsurance.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                  <span style={{ color: TEXT_DARK }}>{t.totalPatientOwes}</span>
                  <span style={{ color: PRIMARY, fontFamily: "'Inter',sans-serif" }}>{totals.patientOwes.toFixed(2)} {t.riyal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.amountPaidNow}</label>
            <input type="number" value={form.amountPaidNow} onChange={e => setForm({ ...form, amountPaidNow: e.target.value })}
              placeholder="0.00" style={{ width: '100%', ...inputStyle, padding: '9px 12px', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>{t.paymentMethod}</label>
            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
              style={{ width: '100%', ...inputStyle, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }}>
              <option value="cash">{t.cash}</option>
              <option value="card">{t.card}</option>
              <option value="insurance">{t.insurance}</option>
            </select>
          </div>
        </div>

        {totals.patientOwes > 0 && !loadingInsurance && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '9px 12px', background: totals.remaining > 0 ? '#FFF8E1' : '#E8F5E9', borderRadius: 10, marginBottom: 18 }}>
            <span style={{ color: TEXT_MUTED }}>{t.remainingAfterPayment}</span>
            <span style={{ fontWeight: 700, color: totals.remaining > 0 ? '#B8892A' : SUCCESS, fontFamily: "'Inter',sans-serif" }}>{totals.remaining.toFixed(2)} {t.riyal}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => submit(false)} disabled={saving || loadingInsurance}
            style={{ flex: 1, background: PRIMARY, color: '#FFF', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13.5, fontWeight: 700, cursor: (saving || loadingInsurance) ? 'not-allowed' : 'pointer', opacity: (saving || loadingInsurance) ? 0.6 : 1, transition: 'all 0.15s ease' }}>
            {saving ? t.saving : mode === 'checkout' ? `✔️ ${t.finishVisit}` : `💰 ${isAr ? 'تسجيل الدفعة' : 'Register Payment'}`}
          </button>
          {mode === 'checkout' ? (
            <button onClick={() => submit(true)} disabled={saving}
              style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: TEXT_MUTED, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {t.skipAndFinish}
            </button>
          ) : (
            <button onClick={onClose} disabled={saving}
              style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: TEXT_MUTED, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {t.cancel}
            </button>
          )}
        </div>
        {mode === 'checkout' && <p style={{ fontSize: 10.5, color: '#B8892A', textAlign: 'center', marginTop: 10 }}>⚠️ {t.skipWarning}</p>}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Appointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')
  const [statusFilter, setStatusFilter] = useState('all_status')
  const [searchPatient, setSearchPatient] = useState('')
  const [searchDoctor, setSearchDoctor] = useState('')
  const [searchDateFrom, setSearchDateFrom] = useState<Date | null>(null)
  const [searchDateTo, setSearchDateTo] = useState<Date | null>(null)
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [changingStatus, setChangingStatus] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())
  const [toastError, setToastError] = useState('')

  useEffect(() => {
    if (!toastError) return
    const timer = setTimeout(() => setToastError(''), 4000)
    return () => clearTimeout(timer)
  }, [toastError])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const styleId = 'cura-appointments-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style'); style.id = styleId; style.textContent = globalCss; document.head.appendChild(style)
    }
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)
    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  const fetchAppointments = () => {
    const startTime = Date.now()
    api.get('/appointments')
      .then(res => setAppointments(Array.isArray(res.data) ? res.data : []))
      .catch(() => navigate('/login'))
      .finally(() => { setTimeout(() => setLoading(false), Math.max(0, 800 - (Date.now() - startTime))) })
  }

  useEffect(() => { fetchAppointments() }, [])

  const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); setChangingStatus(id)
    try {
      const appointment = appointments.find(a => a.id === id)
      if (!appointment) return
      await api.put(`/appointments/${id}`, { patientId: appointment.patientId, status: newStatus })
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    } catch {
      console.error('Failed to update status')
      setToastError(lang === 'ar' ? 'حدث خطأ أثناء تحديث حالة الموعد' : 'Failed to update appointment status')
    }
    finally { setChangingStatus(null) }
  }

  // ✅ نافذة الدفع الموحّدة — تخدم "إنهاء الزيارة" و"تسجيل دفعة لاحقاً" بمكوّن واحد
  // بدل نسختين مكررتين (كانت تضاعف خطر أي خطأ مستقبلي، زي مشاكل واجهناها اليوم بالضبط)
  const [paymentModal, setPaymentModal] = useState<{ id: string; mode: 'checkout' | 'payLater' } | null>(null)

  const openPaymentModal = (id: string, mode: 'checkout' | 'payLater', e: React.MouseEvent) => {
    e.stopPropagation()
    setPaymentModal({ id, mode })
  }

  const handlePaymentModalSuccess = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } as Appointment : a))
    setPaymentModal(null)
  }

  // ✅ CheckIn
  const handleCheckIn = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); setChangingStatus(id)
    try {
      const res = await api.post(`/appointments/${id}/checkin`)
      setAppointments(prev => prev.map(a => a.id === id
        ? { ...a, status: 'confirmed', checkInTime: res.data.checkInTime } : a))
    } catch {
      console.error('CheckIn failed')
      setToastError(lang === 'ar' ? 'حدث خطأ أثناء تسجيل الحضور' : 'Failed to check in')
    }
    finally { setChangingStatus(null) }
  }

  const formatTime = (dateStr: string) => {
    const [datePart, timePart] = dateStr.split('T')
    const [y, mo, d] = datePart.split('-').map(Number)
    const [h, mi] = (timePart||'00:00').split(':').map(Number)
    return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`
  }

  const getDoctorName = (appointment: Appointment): string => {
    if (appointment.doctorName?.trim()) return appointment.doctorName
    const d = (appointment as any).doctor
    if (d?.fullName) return d.fullName
    return '—'
  }

  const getFilteredAppointments = () => {
    const today = new Date().toDateString()
    let filtered = appointments
    switch (filter) {
      case 'today':    filtered = filtered.filter(a => new Date(a.appointmentDate).toDateString() === today); break
      case 'upcoming': filtered = filtered.filter(a => new Date(a.appointmentDate) > new Date() && a.status !== 'cancelled'); break
    }
    if (statusFilter !== 'all_status') filtered = filtered.filter(a => a.status === statusFilter)
    if (searchPatient.trim()) { const term = searchPatient.toLowerCase(); filtered = filtered.filter(a => (a.patientName||'').toLowerCase().includes(term) || a.patientNumber?.toString().includes(term)) }
    if (searchDoctor.trim())  { const term = searchDoctor.toLowerCase();  filtered = filtered.filter(a => getDoctorName(a).toLowerCase().includes(term)) }
    if (searchDateFrom) { const from = new Date(searchDateFrom); from.setHours(0,0,0,0); filtered = filtered.filter(a => new Date(a.appointmentDate) >= from) }
    if (searchDateTo)   { const to = new Date(searchDateTo); to.setHours(23,59,59,999); filtered = filtered.filter(a => new Date(a.appointmentDate) <= to) }
    return filtered
  }

  const t = T[lang]; const isAr = lang === 'ar'
  const filteredAppointments = getFilteredAppointments()
  const hasActiveFilters = searchPatient || searchDoctor || searchDateFrom || searchDateTo || statusFilter !== 'all_status'

  // ✅ إظهار/إخفاء الأعمدة
  const columnDefs: ColumnDef[] = [
    { key: 'patient', label: t.patient, locked: true },
    { key: 'doctor', label: t.doctor },
    { key: 'date', label: t.date, locked: true },
    { key: 'type', label: t.type },
    { key: 'price', label: t.price },
    { key: 'status', label: t.status },
    { key: 'actions', label: t.actions, locked: true },
  ]
  const { visibleKeys, toggle } = useColumnVisibility('appointments-table', columnDefs)
  const colVisible = (key: string) => visibleKeys.has(key)

  const formatDate = (dateStr: string) => {
    const [datePart, timePart] = dateStr.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = (timePart||'00:00').split(':').map(Number)
    const date = new Date(year, month-1, day, hour, minute)
    const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
    const time = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
    if (date.toDateString() === today.toDateString())     return `${t.today} — ${time}`
    if (date.toDateString() === tomorrow.toDateString()) return `${t.tomorrow} — ${time}`
    return `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year} — ${time}`
  }

  if (loading) return <AppointmentsLoadingScreen msg={t.loadingMessage} subMsg={t.loadingSub} />

  return (
    <div className="appointments-shell" style={{ direction:isAr?'rtl':'ltr', background:'#F8FAFA', minHeight:'100vh', padding:'24px' }}>
      {toastError && (
        <div role="alert" style={{ position:'fixed', top:20, [isAr?'left':'right']:20, zIndex:2000, background:'#FFF5F5', border:'1px solid #FCA5A5', borderRadius:12, padding:'12px 18px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 6px 20px rgba(0,0,0,0.12)', maxWidth:340 }}>
          <span>⚠️</span><span style={{ fontSize:13, color:'#EF4444' }}>{toastError}</span>
        </div>
      )}
      <div style={{ maxWidth:1400, margin:'0 auto' }}>

        {/* ✅ رأس الطباعة الموحّد */}
        <PrintHeader reportTitle={t.title} lang={lang} />

        {/* Header */}
        <div className="no-print" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16, marginBottom:24 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:12 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY, animation:'soft-pulse 2s infinite' }} />{t.schedule}
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display','Georgia',serif", fontSize:32, fontWeight:500, color:TEXT_DARK, margin:0, letterSpacing:'-0.3px' }}>{t.title}</h2>
            <p style={{ fontSize:14, color:TEXT_MUTED, marginTop:8 }}>
              📊 {filteredAppointments.length} {t.appointments}
              {filter!=='all' && ` (${filter==='today'?t.today:t.filterUpcoming})`}
              {hasActiveFilters && <span style={{ marginRight:8, fontSize:11, color:PRIMARY }}> • {t.searchResults}</span>}
            </p>
          </div>
          {hasPermission('appointments.create') && (
            <button onClick={()=>navigate('/appointments/add')}
              style={{ background:PRIMARY, color:'#FFFFFF', border:'none', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'all 0.2s ease', boxShadow:'0 2px 8px rgba(91,140,143,0.2)' }}
              onMouseEnter={e=>{e.currentTarget.style.background=PRIMARY_DARK;e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.background=PRIMARY;e.currentTarget.style.transform='translateY(0)'}}>
              <span style={{ fontSize:16 }}>+</span> {t.addAppointment}
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="no-print">
          <FilterBar currentFilter={filter} onFilterChange={setFilter} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            searchPatient={searchPatient} onSearchPatientChange={setSearchPatient} searchDoctor={searchDoctor} onSearchDoctorChange={setSearchDoctor}
            searchDateFrom={searchDateFrom} onSearchDateFromChange={setSearchDateFrom} searchDateTo={searchDateTo} onSearchDateToChange={setSearchDateTo} lang={lang} />
        </div>

        {/* رسالة لا مواعيد */}
        {filter==='today' && filteredAppointments.length===0 && !hasActiveFilters && (
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, padding:'60px 24px', textAlign:'center', marginBottom:20 }}>
            <span style={{ fontSize:64, opacity:0.5 }}>📅</span>
            <h3 style={{ fontSize:18, fontWeight:600, color:TEXT_DARK, marginTop:16, marginBottom:8 }}>{t.noAppointmentsToday}</h3>
            <p style={{ fontSize:13, color:TEXT_MUTED, marginBottom:20 }}>{t.noAppointmentsTodayHint}</p>
            {hasPermission('appointments.create') && (
              <button onClick={()=>navigate('/appointments/add')}
                style={{ background:PRIMARY, color:'#FFFFFF', border:'none', borderRadius:12, padding:'10px 24px', fontSize:13, fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 }}
                onMouseEnter={e=>e.currentTarget.style.background=PRIMARY_DARK} onMouseLeave={e=>e.currentTarget.style.background=PRIMARY}>
                <span>+</span> {t.addAppointment}
              </button>
            )}
          </div>
        )}

        {/* الجدول */}
        {(filter!=='today' || filteredAppointments.length>0 || hasActiveFilters) && (
          <>
            <div className="no-print" style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:8 }}>
              <ExportBar
                endpoint={`/appointments/export${searchDateFrom ? `?dateFrom=${searchDateFrom.toISOString()}` : ''}`}
                lang={lang} fileName="appointments" />
              <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
            </div>
          <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ overflowX:'auto' }}>
              <table className="appointments-table" style={{ width:'100%', borderCollapse:'collapse', minWidth:780 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${BORDER}`, background:PRIMARY_SOFT }}>
                    {columnDefs.filter(c => visibleKeys.has(c.key)).map((c) => (
                      <th key={c.key} style={{ padding:'14px 16px', textAlign:isAr?'right':'left', fontSize:12, fontWeight:600, color:TEXT_MUTED }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length===0 ? (
                    <tr>
                      <td colSpan={columnDefs.filter(c => visibleKeys.has(c.key)).length} style={{ padding:'48px 24px', textAlign:'center' }}>
                        <span style={{ fontSize:48, opacity:0.5 }}>📅</span>
                        <p style={{ fontSize:14, color:TEXT_MUTED, marginTop:12 }}>{t.noAppointments}</p>
                        {hasActiveFilters && (
                          <button onClick={()=>{setFilter('all');setStatusFilter('all_status');setSearchPatient('');setSearchDoctor('');setSearchDateFrom(null);setSearchDateTo(null)}}
                            style={{ background:'none', border:'none', color:PRIMARY, fontSize:12, cursor:'pointer', marginTop:8, textDecoration:'underline' }}>
                            {t.clearAllFilters}
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : filteredAppointments.map((appointment) => {
                    const apptDate = new Date(appointment.appointmentDate)
                    const diffMins = (apptDate.getTime() - now.getTime()) / 60000
                    const isDue     = diffMins >= -2 && diffMins <= 2 && appointment.status === 'scheduled'
                    const isOverdue = diffMins < -2  && appointment.status === 'scheduled'
                    const hasCheckedIn  = !!(appointment as any).checkInTime
                    const hasCheckedOut = !!(appointment as any).checkOutTime

                    const rowBg = (() => {
                      if (appointment.status==='confirmed') return '#F0FDF4'
                      if (appointment.status==='cancelled') return '#FFF5F5'
                      if (isDue)     return '#FFF0F0'
                      if (isOverdue) return '#FFFBEB'
                      if (appointment.status==='scheduled') return '#FFF8E1'
                      return 'transparent'
                    })()
                    const rowHoverBg = (() => {
                      if (appointment.status==='confirmed') return '#DCFCE7'
                      if (appointment.status==='cancelled') return '#FEE2E2'
                      if (isDue)     return '#FFE4E4'
                      if (isOverdue) return '#FEF3C7'
                      if (appointment.status==='scheduled') return '#FEF9C3'
                      return PRIMARY_SOFT
                    })()
                    const sideColor = (() => {
                      if (appointment.status==='confirmed') return '#22C55E'
                      if (appointment.status==='cancelled') return '#EF4444'
                      if (isDue)     return '#EF4444'
                      if (isOverdue) return '#F59E0B'
                      if (appointment.status==='scheduled') return '#FCD34D'
                      return 'transparent'
                    })()

                    return (
                      <tr key={appointment.id}
                        className={`appointment-row${isDue?' row-due':''}`}
                        style={{ borderBottom:`1px solid ${BORDER}`, transition:isDue?'none':'all 0.2s ease', cursor:'pointer', background:isDue?undefined:rowBg, borderRight:`4px solid ${sideColor}` }}
                        onMouseEnter={e=>{if(!isDue) e.currentTarget.style.background=rowHoverBg}}
                        onMouseLeave={e=>{if(!isDue) e.currentTarget.style.background=rowBg}}
                        onClick={()=>navigate(`/appointments/${appointment.id}`)}>

                        {/* المريض */}
                        {colVisible('patient') && (
                        <td style={{ padding:'14px 16px' }}>
                          <p style={{ fontSize:14, fontWeight:500, color:TEXT_DARK, margin:0, marginBottom:2 }}>{appointment.patientName}</p>
                          <p style={{ fontSize:10, color:TEXT_MUTED, margin:0 }}>#{appointment.patientNumber}</p>
                        </td>
                        )}

                        {/* الطبيب */}
                        {colVisible('doctor') && (
                        <td style={{ padding:'14px 16px', fontSize:13, color:TEXT_MUTED }}>{getDoctorName(appointment)}</td>
                        )}

                        {/* التاريخ */}
                        {colVisible('date') && (
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ fontSize:13, fontWeight:500, color:isDue?'#EF4444':isOverdue?'#F59E0B':TEXT_DARK }}>
                            {formatDate(appointment.appointmentDate)}
                          </span>
                          {isDue     && <span style={{ display:'block', fontSize:10, color:'#EF4444', fontWeight:700, marginTop:2, animation:'soft-pulse 1s infinite' }}>🔔 {t.dueLabel}</span>}
                          {isOverdue && <span style={{ display:'block', fontSize:10, color:'#F59E0B', fontWeight:700, marginTop:2 }}>⚠️ {t.overdueLabel}</span>}
                          {/* ✅ وقت الدخول والخروج */}
                          {hasCheckedIn && (
                            <span style={{ display:'block', fontSize:10, color:'#22C55E', marginTop:2 }}>
                              🟢 {t.checkedIn}: {formatTime((appointment as any).checkInTime)}
                            </span>
                          )}
                          {hasCheckedOut && (
                            <span style={{ display:'block', fontSize:10, color:PRIMARY, marginTop:1 }}>
                              🏁 {t.checkedOut}: {formatTime((appointment as any).checkOutTime)}
                            </span>
                          )}
                        </td>
                        )}

                        {/* النوع */}
                        {colVisible('type') && (
                        <td style={{ padding:'14px 16px', fontSize:13, color:TEXT_MUTED }}>{appointment.type||'—'}</td>
                        )}

                        {/* السعر */}
                        {colVisible('price') && (
                        <td style={{ padding:'14px 16px', fontSize:13, fontWeight:500, color:TEXT_DARK }}>
                          {appointment.price ? `${appointment.price} ${t.riyal}` : '—'}
                        </td>
                        )}

                        {/* الحالة */}
                        {colVisible('status') && (
                        <td style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-start' }}>
                            <StatusBadge status={appointment.status} lang={lang} />
                            <PaymentBadge isPaid={(appointment as any).isPaid} lang={lang} />
                          </div>
                        </td>
                        )}

                        {/* الإجراءات */}
                        {colVisible('actions') && (
                        <td className="no-print" style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>

                            {/* ✅ CheckIn — للمواعيد المجدولة أو المؤكدة التي لم يتم دخولها */}
                            {['scheduled','confirmed'].includes(appointment.status) && !hasCheckedIn && (
                              <button className="action-btn" onClick={e=>handleCheckIn(appointment.id,e)}
                                disabled={changingStatus===appointment.id}
                                style={{ background:'#E8F5E9', color:'#22C55E', borderColor:'#86EFAC' }}>
                                🟢 {t.checkIn}
                              </button>
                            )}

                            {/* ✅ CheckOut — للمواعيد التي تم دخولها ولم يتم خروجها */}
                            {hasCheckedIn && !hasCheckedOut && appointment.status !== 'completed' && (
                              <button className="action-btn" onClick={e=>openPaymentModal(appointment.id,'checkout',e)}
                                disabled={changingStatus===appointment.id}
                                style={{ background:PRIMARY_SOFT, color:PRIMARY, borderColor:BORDER }}>
                                🏁 {t.checkOut}
                              </button>
                            )}

                            {/* ✅ موعد مكتمل وغير مدفوع — تسجيل دفعة لاحقاً */}
                            {appointment.status === 'completed' && (appointment as any).isPaid === false && (
                              <button className="action-btn" onClick={e=>openPaymentModal(appointment.id,'payLater',e)}
                                style={{ background:'#FFF8E1', color:'#B8892A', borderColor:'#E8D4A8' }}>
                                💰 {isAr ? 'تسجيل دفعة' : 'Register Payment'}
                              </button>
                            )}

                            {/* تأكيد / إلغاء للمجدول */}
                            {appointment.status==='scheduled' && !hasCheckedIn && (
                              <>
                                <button className="action-btn" onClick={e=>handleStatusChange(appointment.id,'confirmed',e)} disabled={changingStatus===appointment.id} style={{ background:'#E8F5E9', color:'#22C55E', borderColor:'#86EFAC' }}>✓ {t.confirm}</button>
                                <button className="action-btn" onClick={e=>handleStatusChange(appointment.id,'cancelled',e)} disabled={changingStatus===appointment.id} style={{ background:'#FFF5F5', color:'#EF4444', borderColor:'#FCA5A5' }}>✕ {t.cancel}</button>
                              </>
                            )}

                            {/* مكتمل / إلغاء للمؤكد */}
                            {appointment.status==='confirmed' && !hasCheckedIn && (
                              <>
                                <button className="action-btn" onClick={e=>handleStatusChange(appointment.id,'completed',e)} disabled={changingStatus===appointment.id} style={{ background:PRIMARY_SOFT, color:PRIMARY, borderColor:BORDER }}>✔ {t.complete}</button>
                                <button className="action-btn" onClick={e=>handleStatusChange(appointment.id,'cancelled',e)} disabled={changingStatus===appointment.id} style={{ background:'#FFF5F5', color:'#EF4444', borderColor:'#FCA5A5' }}>✕ {t.cancel}</button>
                              </>
                            )}

                            {/* تعديل */}
                            {hasPermission('appointments.edit') && (
                              <button className="action-btn" onClick={e=>{e.stopPropagation();navigate(`/appointments/${appointment.id}/edit`)}}
                                style={{ background:PRIMARY_SOFT, color:PRIMARY, borderColor:BORDER }}
                                onMouseEnter={e=>{e.currentTarget.style.background=PRIMARY;e.currentTarget.style.color='#FFF'}}
                                onMouseLeave={e=>{e.currentTarget.style.background=PRIMARY_SOFT;e.currentTarget.style.color=PRIMARY}}>
                                ✏️ {t.edit}
                              </button>
                            )}

                            {changingStatus===appointment.id && <span style={{ fontSize:14, color:TEXT_MUTED }}>⏳</span>}
                          </div>
                        </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {/* الإحصائيات */}
        {filteredAppointments.length>0 && (
          <div style={{ display:'flex', gap:12, marginTop:20, flexWrap:'wrap' }}>
            {[
              { icon:'📊', label:t.totalAppointments, value:filteredAppointments.length, bg:PRIMARY_SOFT, color:PRIMARY, border:BORDER },
              { icon:'✔️', label:t.completedLabel, value:filteredAppointments.filter(a=>a.status==='completed').length, bg:'#E8F5E9', color:'#22C55E', border:'#86EFAC' },
              { icon:'⏰', label:t.remainingLabel, value:filteredAppointments.filter(a=>a.status==='scheduled'||a.status==='confirmed').length, bg:'#FFF8E1', color:'#F59E0B', border:'#FCD34D' },
              { icon:'✕',  label:t.cancelledLabel, value:filteredAppointments.filter(a=>a.status==='cancelled').length, bg:'#FFF5F5', color:'#EF4444', border:'#FCA5A5' },
              { icon:'💰', label:t.revenueLabel, value:`${filteredAppointments.filter(a=>a.status==='completed').reduce((sum,a)=>sum+(Number(a.price)||0),0).toFixed(2)} ${t.riyal}`, bg:'#E8F0F0', color:PRIMARY, border:BORDER },
            ].map((stat,i) => (
              <div key={i} style={{ flex:1, minWidth:120, display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 12px', borderRadius:16, background:stat.bg, border:`1px solid ${stat.border}` }}>
                <span style={{ fontSize:22, marginBottom:6 }}>{stat.icon}</span>
                <span style={{ fontSize:24, fontWeight:700, color:stat.color, lineHeight:1 }}>{stat.value}</span>
                <span style={{ fontSize:11, color:TEXT_MUTED, marginTop:4, textAlign:'center' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ نافذة الدفع الموحّدة — تخدم "إنهاء الزيارة" و"تسجيل دفعة لاحقاً" */}
      {paymentModal && (
        <PaymentModal
          appointmentId={paymentModal.id}
          mode={paymentModal.mode}
          appointment={appointments.find(a => a.id === paymentModal.id)}
          lang={lang}
          t={t}
          onClose={() => setPaymentModal(null)}
          onSuccess={(updates) => handlePaymentModalSuccess(paymentModal.id, updates)}
        />
      )}
    </div>
  )
}