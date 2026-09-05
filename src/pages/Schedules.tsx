import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import SearchableSelect from '../components/SearchableSelect'
import PrintHeader from '../components/PrintHeader'
import ExportBar from '../components/ExportBar'
import { useColumnVisibility, ColumnToggleButton, type ColumnDef } from '../components/ColumnToggle'

// ✅ تحسين #11: التحقق الصحيح من اللغة المحفوظة
const getStoredLang = (): 'ar' | 'en' => {
  const lang = localStorage.getItem('cura-lang')
  return lang === 'ar' ? 'ar' : 'en'
}

const PRIMARY      = '#5B8C8F'
const PRIMARY_DARK = '#4A7679'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK    = '#2C3E3F'
const TEXT_MUTED   = '#6B8A8C'
const BORDER       = '#DCE5E5'
const SUCCESS_BG   = '#F0FDF4'
const SUCCESS_C    = '#16A34A'
const ERROR_BG     = '#FDF5F5'
const ERROR_C      = '#C4A77D'
const AMBER        = '#F59E0B'
const AMBER_BG     = '#FFF8E1'

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&family=Noto+Kufi+Arabic:wght@400;500;600&display=swap');
@keyframes fade-up   { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
@keyframes slide-in  { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);} }

.sch-shell { animation:fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.sch-shell * { box-sizing:border-box; }

.sch-tabs { display:flex; gap:6px; background:#FFF; padding:5px; border-radius:16px; border:1px solid ${BORDER}; width:fit-content; margin-bottom:24px; }
.sch-tab  { padding:9px 22px; border-radius:12px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s ease; border:none; background:transparent; color:${TEXT_MUTED}; display:flex; align-items:center; gap:7px; }
.sch-tab.active { background:${PRIMARY}; color:#FFF; box-shadow:0 4px 12px ${PRIMARY}30; }
.sch-tab:not(.active):hover { background:${PRIMARY_SOFT}; color:${PRIMARY}; }

.day-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin-bottom:4px; }
.day-btn.disabled { opacity:0.4; cursor:not-allowed !important; }
.day-btn  { border:1.5px solid ${BORDER}; background:#FFF; border-radius:10px; padding:8px 4px; font-size:12px; font-weight:600; color:${TEXT_MUTED}; cursor:pointer; transition:all 0.2s; text-align:center; }
.day-btn.sel { border-color:${PRIMARY}; background:${PRIMARY_SOFT}; color:${PRIMARY}; }
.day-btn:hover:not(.sel) { border-color:${PRIMARY}; color:${PRIMARY}; }

.sch-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
.sch-card  { background:#FFF; border:1px solid ${BORDER}; border-radius:16px; padding:16px 18px; transition:all 0.2s; position:relative; overflow:hidden; }
.sch-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,${PRIMARY},${PRIMARY_DARK}); }
.sch-card:hover { box-shadow:0 6px 20px ${PRIMARY}12; border-color:${PRIMARY}40; }
.sch-card.editing { border-color:${PRIMARY}; box-shadow:0 0 0 3px ${PRIMARY}18; }
.sch-card.editing .field input,.sch-card.editing .field select { background:#F8FAFA; font-size:13px; padding:8px 10px; }
.sch-card.editing .field label { font-size:10px; }

.abs-card { background:#FFF; border:1px solid ${BORDER}; border-radius:16px; padding:16px 18px; transition:all 0.2s; position:relative; overflow:hidden; }
.abs-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,${AMBER},#F97316); }
.abs-card:hover { box-shadow:0 6px 20px rgba(245,158,11,0.12); border-color:${AMBER}40; }

.doc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; margin-bottom:20px; }
.doc-card { border:1.5px solid ${BORDER}; background:#FFF; border-radius:14px; padding:12px 14px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:10px; }
.doc-card.sel { border-color:${PRIMARY}; background:${PRIMARY_SOFT}; }
.doc-card:hover:not(.sel) { border-color:${PRIMARY}40; }

.sch-form { background:#FFF; border:1px solid ${BORDER}; border-radius:20px; padding:22px 24px; margin-bottom:20px; animation:slide-in 0.3s ease; }
.field-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; margin-bottom:16px; }
.field { display:flex; flex-direction:column; gap:5px; }
.field label { font-size:11px; font-weight:700; color:${TEXT_MUTED}; text-transform:uppercase; letter-spacing:0.5px; }
.field input,.field select,.field textarea { padding:10px 12px; border:1px solid ${BORDER}; border-radius:10px; font-size:14px; font-family:inherit; color:${TEXT_DARK}; background:#FFF; outline:none; transition:all 0.2s; }
.field input:focus,.field select:focus,.field textarea:focus { border-color:${PRIMARY}; box-shadow:0 0 0 3px ${PRIMARY}18; }
.field input[type="time"] { font-family:'Inter',sans-serif; direction:ltr; }
.field input[type="date"] { font-family:'Inter',sans-serif; direction:ltr; }

.h24-toggle { display:flex; align-items:center; gap:8px; padding:8px 12px; background:${PRIMARY_SOFT}; border:1px solid ${BORDER}; border-radius:10px; cursor:pointer; user-select:none; font-size:13px; font-weight:600; color:${PRIMARY}; transition:all 0.2s; }
.h24-toggle.on { background:${PRIMARY}; color:#FFF; border-color:${PRIMARY}; }

.btn-p    { background:${PRIMARY}; color:#FFF; border:none; border-radius:10px; padding:10px 20px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:6px; }
.btn-p:hover { background:${PRIMARY_DARK}; transform:translateY(-1px); box-shadow:0 4px 12px ${PRIMARY}30; }
.btn-s    { background:transparent; color:${TEXT_MUTED}; border:1px solid ${BORDER}; border-radius:10px; padding:10px 20px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; }
.btn-s:hover { background:${PRIMARY_SOFT}; color:${PRIMARY}; border-color:${PRIMARY}; }
.btn-del  { background:transparent; border:1px solid ${ERROR_C}40; color:${ERROR_C}; border-radius:8px; padding:5px 11px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; }
.btn-del:hover { background:${ERROR_C}; color:#FFF; border-color:${ERROR_C}; }
.btn-edit { background:transparent; border:1px solid ${PRIMARY}40; color:${PRIMARY}; border-radius:8px; padding:5px 11px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; }
.btn-edit:hover { background:${PRIMARY_SOFT}; }
.btn-copy { background:transparent; border:1px solid ${PRIMARY}50; color:${PRIMARY}; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:5px; }
.btn-copy:hover { background:${PRIMARY_SOFT}; }
.btn-amber { background:${AMBER}; color:#FFF; border:none; border-radius:10px; padding:10px 20px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:6px; }
.btn-amber:hover { background:#D97706; transform:translateY(-1px); }

.type-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:8px; margin-bottom:16px; }
.type-btn  { border:1.5px solid ${BORDER}; background:#FFF; border-radius:10px; padding:8px 10px; font-size:12px; font-weight:600; color:${TEXT_MUTED}; cursor:pointer; transition:all 0.2s; text-align:center; }
.type-btn.sel { border-color:${AMBER}; background:${AMBER_BG}; color:#92400E; }
.type-btn:hover:not(.sel) { border-color:${AMBER}; color:${AMBER}; }

.alert { border-radius:12px; padding:11px 16px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; font-size:13px; animation:slide-in 0.3s ease; }
.alert.ok  { background:${SUCCESS_BG}; border:1px solid #86EFAC; color:${SUCCESS_C}; }
.alert.err { background:${ERROR_BG}; border:1px solid ${ERROR_C}40; color:${ERROR_C}; }

.empty { text-align:center; padding:40px 24px; color:${TEXT_MUTED}; }
.empty p { margin-top:10px; font-size:14px; }
.badge { font-size:11px; padding:3px 9px; border-radius:100px; font-weight:600; }

@media(max-width:768px){
  .sch-tabs  { width:100%; flex-wrap:wrap; }
  .sch-tab   { flex:1; justify-content:center; padding:9px 8px; min-width:100px; }
  .day-grid  { grid-template-columns:repeat(4,1fr); }
  .sch-cards,.abs-cards { grid-template-columns:1fr 1fr; }
  .doc-grid  { grid-template-columns:1fr 1fr; }
}
@media(max-width:480px){
  .sch-cards,.abs-cards { grid-template-columns:1fr; }
  .doc-grid  { grid-template-columns:1fr; }
  .type-grid { grid-template-columns:repeat(2,1fr); }
}
`

interface ClinicSchedule  { id:string; dayOfWeek:number; dayName:string; openTime:string; closeTime:string; isActive:boolean }
interface DoctorSchedule  { id:string; doctorId:string; doctorName:string; dayOfWeek:number; dayName:string; startTime:string; endTime:string; slotDuration:number; isActive:boolean }
interface Doctor          { id:string; fullName:string; specialty?:string; isActive:boolean }
interface Absence         { id:string; doctorId?:string; doctorName?:string; startDate:string; endDate:string; startTime?:string; endTime?:string; isFullDay:boolean; type:string; notes?:string }

const ABSENCE_TYPES = {
  ar: [
    { value:'holiday',  icon:'🎉', label:'عطلة رسمية' },
    { value:'vacation', icon:'🌴', label:'إجازة'      },
    { value:'meeting',  icon:'👥', label:'اجتماع'     },
    { value:'break',    icon:'☕', label:'استراحة'    },
    { value:'other',    icon:'📝', label:'أخرى'       },
  ],
  en: [
    { value:'holiday',  icon:'🎉', label:'Public Holiday' },
    { value:'vacation', icon:'🌴', label:'Vacation'       },
    { value:'meeting',  icon:'👥', label:'Meeting'        },
    { value:'break',    icon:'☕', label:'Break'          },
    { value:'other',    icon:'📝', label:'Other'          },
  ],
}

const T = {
  ar: {
    font:"'Noto Kufi Arabic',sans-serif", dir:'rtl' as const,
    title:'جداول الدوام', mgmt:'إدارة الدوام',
    clinicTab:'دوام العيادة', doctorTab:'دوام الأطباء', absenceTab:'الإجازات',
    addDay:'+ إضافة يوم', save:'حفظ', cancel:'إلغاء', delete:'حذف', edit:'تعديل',
    selectDays:'اختر الأيام', openTime:'وقت الفتح', closeTime:'وقت الإغلاق',
    startTime:'من', endTime:'إلى', slot:'مدة الموعد',
    h24:'24 ساعة', noData:'لا يوجد جدول دوام بعد',
    selectDoctor:'اختر طبيباً', allDoctors:'الأطباء',
    copyClinic:'📋 نسخ من جدول العيادة', copyConfirm:"سيتم نسخ دوام العيادة لهذا الطبيب. متابعة؟",
    copied:'تم نسخ جدول العيادة بنجاح',
    errSave:'حدث خطأ أثناء الحفظ', errDel:'حدث خطأ أثناء الحذف', errLoad:'حدث خطأ أثناء تحميل البيانات',
    errNoDays:'اختر يوماً على الأقل', errNoClinic:'لا يوجد جدول للعيادة للنسخ منه',
    errAllClinicDaysAdded:'جميع أيام العيادة مضافة للطبيب مسبقاً',
    errEndDateBefore:'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
    errEndTimeBeforeStart:'وقت النهاية يجب أن يكون بعد وقت البداية',
    errClinicTimeInvalid:'وقت النهاية يجب أن يكون بعد وقت البداية للعيادة',
    errPartialAdd:'تمت إضافة بعض الأيام. يرجى التحقق من التحذيرات',
    saved:'تم الحفظ بنجاح', deleted:'تم الحذف',
    min:'د',
    days:['أحد','إث','ثل','أرب','خم','جم','سبت'],
    daysLong:['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],
    // Absence
    addAbsence:'+ إضافة إجازة',
    absenceFor:'إجازة لـ',
    clinicAbsence:'إجازة العيادة كاملة',
    doctorAbsence:'إجازة طبيب محدد',
    absenceType:'نوع الإجازة',
    startDate:'تاريخ البداية', endDate:'تاريخ النهاية',
    fullDay:'يوم كامل', partialDay:'فترة محددة',
    notes:'ملاحظات', notesPlaceholder:'سبب الإجازة...',
    noAbsences:'لا توجد إجازات مسجلة',
    selectAbsenceFor:'للعيادة', forDoctor:'للطبيب',
    clinicHoliday:'إجازة عيادة',
  },
  en: {
    font:"'Inter',sans-serif", dir:'ltr' as const,
    title:'Schedules', mgmt:'Schedule Management',
    clinicTab:'Clinic Hours', doctorTab:'Doctor Hours', absenceTab:'Absences',
    addDay:'+ Add Day', save:'Save', cancel:'Cancel', delete:'Delete', edit:'Edit',
    selectDays:'Select Days', openTime:'Open Time', closeTime:'Close Time',
    startTime:'From', endTime:'To', slot:'Slot Duration',
    h24:'24 Hours', noData:'No schedule configured yet',
    selectDoctor:'Select a doctor', allDoctors:'Doctors',
    copyClinic:'📋 Copy from Clinic Schedule', copyConfirm:"Copy clinic schedule to this doctor?",
    copied:'Clinic schedule copied successfully',
    errSave:'Error saving', errDel:'Error deleting', errLoad:'Error loading data',
    errNoDays:'Select at least one day', errNoClinic:'No clinic schedule to copy from',
    errAllClinicDaysAdded:'All clinic days are already assigned to this doctor',
    errEndDateBefore:'End date must be after or equal to start date',
    errEndTimeBeforeStart:'End time must be after start time',
    errClinicTimeInvalid:'Close time must be after open time',
    errPartialAdd:'Some days were added. Please check the warnings',
    saved:'Saved successfully', deleted:'Deleted',
    min:'m',
    days:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    daysLong:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    // Absence
    addAbsence:'+ Add Absence',
    absenceFor:'Absence for',
    clinicAbsence:'Entire Clinic',
    doctorAbsence:'Specific Doctor',
    absenceType:'Absence Type',
    startDate:'Start Date', endDate:'End Date',
    fullDay:'Full Day', partialDay:'Specific Hours',
    notes:'Notes', notesPlaceholder:'Reason for absence...',
    noAbsences:'No absences recorded',
    selectAbsenceFor:'For Clinic', forDoctor:'For Doctor',
    clinicHoliday:'Clinic Holiday',
  },
}

const fmtTime = (t:string) => t?.substring(0,5) || ''
const fmtTime12 = (t:string) => {
  if (!t) return ''
  const [h,m] = t.substring(0,5).split(':').map(Number)
  const ampm = h>=12?'PM':'AM'; const h12=h%12||12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}
const fmtDate = (d:string) => {
  if (!d) return ''
  const [y,m,day] = d.split('-')
  return `${day}/${m}/${y}`
}

const typeColor = (type:string) => {
  switch(type) {
    case 'holiday':  return { bg:'#FEF3C7', color:'#92400E', border:'#FCD34D' }
    case 'vacation': return { bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE' }
    case 'meeting':  return { bg:'#F0FDF4', color:'#166534', border:'#86EFAC' }
    case 'break':    return { bg:'#FDF4FF', color:'#7E22CE', border:'#E9D5FF' }
    default:         return { bg:'#F8FAFA', color:'#2C3E3F', border:'#DCE5E5' }
  }
}

// ✅ تحسين #10: دالة مساعدة للتحقق من صحة الأوقات
const isValidTimeRange = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false
  return endTime > startTime
}

// ✅ تحسين #5: دالة لاستخراج رسالة الخطأ من Axios
const getErrorMessage = (err: any, fallback: string): string => {
  if (typeof err.response?.data === 'string') {
    return err.response.data
  }
  if (err.response?.data?.message) {
    return err.response.data.message
  }
  if (err.message) {
    return err.message
  }
  return fallback
}

const Spinner = () => (
  <div style={{ textAlign:'center', padding:40 }}>
    <div style={{ width:36, height:36, borderRadius:'50%', border:`3px solid ${PRIMARY_SOFT}`, borderTopColor:PRIMARY, animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
  </div>
)

export default function Schedules() {
  const [lang, setLang]           = useState<'ar'|'en'>(getStoredLang())
  const [tab,  setTab]            = useState<'clinic'|'doctor'|'absence'>('clinic')
  const [clinicSchedules, setCS]  = useState<ClinicSchedule[]>([])
  const [doctorSchedules, setDS]  = useState<DoctorSchedule[]>([])
  const [absences, setABS]        = useState<Absence[]>([])
  const [doctors, setDoctors]     = useState<Doctor[]>([])
  const [selectedDoctor, setSel]  = useState('')
  
  // ✅ تحسين #1: Loading منفصلة لكل عملية
  const [clinicLoading, setClinicLoading]     = useState(false)
  const [doctorLoading, setDoctorLoading]     = useState(false)
  const [absenceLoading, setAbsenceLoading]   = useState(false)
  
  // ✅ تحسين #6: AbortController لمنع مشاكل تغيير الطبيب أثناء التحميل
  const doctorAbortRef = useRef<AbortController | null>(null)
  
  const [showClinicForm, setSCF]  = useState(false)
  const [showDoctorForm, setSDF]  = useState(false)
  const [showAbsenceForm, setSAF] = useState(false)
  const [alert, setAlert]         = useState<{type:'ok'|'err';msg:string}|null>(null)

  // Clinic form
  const [cDays,  setCDays]  = useState<number[]>([])
  const [cOpen,  setCOpen]  = useState('08:00')
  const [cClose, setCClose] = useState('20:00')
  const [c24,    setC24]    = useState(false)

  // Doctor add form
  const [dDays,  setDDays]  = useState<number[]>([])
  const [dStart, setDStart] = useState('08:00')
  const [dEnd,   setDEnd]   = useState('14:00')
  const [d24,    setD24]    = useState(false)
  const [dSlot,  setDSlot]  = useState(15)

  // Doctor edit
  const [editId, setEditId] = useState<string|null>(null)
  const [eStart, setES]     = useState('')
  const [eEnd,   setEE]     = useState('')
  const [eSlot,  setESl]    = useState(15)

  // Absence form
  const [absFor,      setAbsFor]      = useState<'clinic'|'doctor'>('clinic')
  const [absDoctor,   setAbsDoctor]   = useState('')
  const [absType,     setAbsType]     = useState('holiday')
  const [absStart,    setAbsStart]    = useState('')
  const [absEnd,      setAbsEnd]      = useState('')
  const [absFullDay,  setAbsFullDay]  = useState(true)
  const [absStartT,   setAbsStartT]   = useState('09:00')
  const [absEndT,     setAbsEndT]     = useState('12:00')
  const [absNotes,    setAbsNotes]    = useState('')

  const t    = T[lang]
  const isAr = lang === 'ar'

  // ✅ Column visibility for each tab
  const clinicColumnDefs: ColumnDef[] = [
    { key: 'day', label: isAr ? 'اليوم' : 'Day', locked: true },
    { key: 'openTime', label: isAr ? 'وقت الفتح' : 'Open Time' },
    { key: 'closeTime', label: isAr ? 'وقت الإغلاق' : 'Close Time' },
  ]
  const { visibleKeys: clinicVisible, toggle: toggleClinic } = useColumnVisibility('clinic-schedule-fields', clinicColumnDefs)

  const doctorColumnDefs: ColumnDef[] = [
    { key: 'day', label: isAr ? 'اليوم' : 'Day', locked: true },
    { key: 'time', label: isAr ? 'الوقت' : 'Time' },
    { key: 'slotDuration', label: isAr ? 'مدة الموعد' : 'Slot Duration' },
  ]
  const { visibleKeys: doctorVisible, toggle: toggleDoctor } = useColumnVisibility('doctor-schedule-fields', doctorColumnDefs)
  const slotOptions = [5,10,15,20,30,45,60,90,120]

  const absenceColumnDefs: ColumnDef[] = [
    { key: 'type', label: isAr ? 'نوع الإجازة' : 'Absence Type', locked: true },
    { key: 'person', label: isAr ? 'الطبيب / العيادة' : 'Doctor / Clinic' },
    { key: 'date', label: isAr ? 'التاريخ' : 'Date' },
    { key: 'duration', label: isAr ? 'المدة' : 'Duration' },
    { key: 'notes', label: isAr ? 'الملاحظات' : 'Notes' },
  ]

  const { visibleKeys: absenceVisible, toggle: toggleAbsence } = useColumnVisibility('absence-schedule-fields', absenceColumnDefs)

  useEffect(() => {
    const id = 'cura-sch-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id=id; s.textContent=css; document.head.appendChild(s)
    }
    const onLang = (e:Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLang)
    
    // ✅ تحسين #6: تنظيف AbortController عند unmount
    return () => {
      window.removeEventListener('cura-lang-change', onLang)
      if (doctorAbortRef.current) {
        doctorAbortRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    fetchClinic()
    api.get('/doctors')
      .then(r => setDoctors(r.data.filter((d:Doctor)=>d.isActive)))
      .catch(err => { console.error('Failed to fetch doctors:', err); showAlert('err', t.errLoad) })
    fetchAbsences()
  }, [])

  // ✅ تحسين #12: تنظيف البيانات عند تغيير الطبيب
  useEffect(() => {
    if (selectedDoctor) {
      setDS([])
      fetchDoctor(selectedDoctor)
    }
  }, [selectedDoctor])

  const fetchClinic = async () => {
    setClinicLoading(true)
    try {
      const r = await api.get('/schedules/clinic')
      setCS(r.data)
    } catch (err) {
      console.error('Failed to fetch clinic schedule:', err)
      showAlert('err', t.errLoad)
    } finally {
      setClinicLoading(false)
    }
  }

  const fetchDoctor = async (id:string) => {
    // ✅ تحسين #6: إلغاء الطلب السابق إذا كان موجوداً
    if (doctorAbortRef.current) {
      doctorAbortRef.current.abort()
    }
    
    const abortController = new AbortController()
    doctorAbortRef.current = abortController
    
    setDoctorLoading(true)
    try {
      const r = await api.get(`/schedules/doctor/${id}`, {
        signal: abortController.signal
      })
      // ✅ تحقق إذا كانت العملية لم يتم إلغاؤها
      if (!abortController.signal.aborted) {
        setDS(r.data)
      }
    } catch (err: any) {
      // عدم عرض خطأ إذا تم إلغاء الطلب
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch doctor schedule:', err)
        showAlert('err', t.errLoad)
      }
    } finally {
      setDoctorLoading(false)
    }
  }

  const fetchAbsences = async () => {
    setAbsenceLoading(true)
    try {
      const r = await api.get('/absences')
      setABS(r.data)
    } catch (err) {
      console.error('Failed to fetch absences:', err)
      showAlert('err', t.errLoad)
    } finally {
      setAbsenceLoading(false)
    }
  }

  const showAlert = (type:'ok'|'err', msg:string) => {
    setAlert({type,msg}); setTimeout(()=>setAlert(null), 3500)
  }

  const toggleDay = (arr:number[], setArr:(v:number[])=>void, d:number) =>
    setArr(arr.includes(d) ? arr.filter(x=>x!==d) : [...arr,d])

  const handleAddClinicDays = async () => {
    // ✅ تحسين #1: التحقق من اختيار الأيام
    if (cDays.length===0) {
      showAlert('err', t.errNoDays)
      return
    }
    
    // ✅ تحسين #9: التحقق من صحة أوقات العيادة (التحقق #1)
    if (!c24 && !isValidTimeRange(cOpen, cClose)) {
      showAlert('err', t.errClinicTimeInvalid)
      return
    }

    try {
      // ✅ تحسين #2: معالجة أفضل لنتائج إضافة عدة أيام باستخدام allSettled
      const results = await Promise.allSettled(
        cDays.map(day => 
          api.post('/schedules/clinic', {
            dayOfWeek:day, 
            openTime:c24?'00:00:00':cOpen+':00', 
            closeTime:c24?'23:59:59':cClose+':00',
          })
        )
      )

      // ✅ تحسين #3: منع التكرار والتحقق من النتائج
      const failures = results.filter(r => r.status === 'rejected')
      const successes = results.filter(r => r.status === 'fulfilled')

      if (failures.length > 0 && successes.length > 0) {
        showAlert('err', t.errPartialAdd)
      } else if (failures.length > 0) {
        const firstError = (failures[0] as PromiseRejectedResult).reason
        const msg = getErrorMessage(firstError, t.errSave)
        showAlert('err', msg)
        return
      } else {
        showAlert('ok', t.saved)
      }

      // ✅ تحسين #8: تصفير البيانات بعد الحفظ الناجح
      setSCF(false)
      setCDays([])
      setCOpen('08:00')
      setCClose('20:00')
      setC24(false)
      fetchClinic()
    } catch (err) {
      console.error('Failed to add clinic schedule:', err)
      const msg = getErrorMessage(err, t.errSave)
      showAlert('err', msg)
    }
  }

  const handleAddDoctorDays = async () => {
    // ✅ تحسين #2 و #4: التحقق من اختيار الطبيب والأيام
    if (!selectedDoctor) {
      showAlert('err', t.selectDoctor)
      return
    }
    if (dDays.length===0) {
      showAlert('err', t.errNoDays)
      return
    }
    
    // ✅ تحسين #5 و #9: التحقق من صحة أوقات البداية والنهاية
    if (!d24 && !isValidTimeRange(dStart, dEnd)) {
      showAlert('err', t.errEndTimeBeforeStart)
      return
    }

    try {
      // ✅ تحسين #2: معالجة أفضل لنتائج إضافة عدة أيام مع التحذيرات باستخدام allSettled
      const results = await Promise.allSettled(
        dDays.map(day => 
          api.post(`/schedules/doctor?lang=${lang}`, {
            doctorId: selectedDoctor,
            dayOfWeek: day,
            startTime: d24?'00:00:00':dStart+':00',
            endTime: d24?'23:59:59':dEnd+':00',
            slotDuration: dSlot,
          })
        )
      )

      // ✅ تحسين #2 و #3: التحقق من النتائج والتحذيرات
      const failures = results.filter(r => r.status === 'rejected')
      const fulfilled = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[]
      const warnings = fulfilled
        .map(r => r.value?.data?.warning)
        .filter(Boolean)

      if (failures.length > 0 && fulfilled.length > 0) {
        // بعض الأيام نجحت وبعضها فشل
        showAlert('err', t.errPartialAdd)
      } else if (failures.length > 0) {
        // جميع الأيام فشلت
        const firstError = (failures[0] as PromiseRejectedResult).reason
        const msg = getErrorMessage(firstError, t.errSave)
        showAlert('err', msg)
        return
      } else if (warnings.length > 0) {
        // هناك تحذيرات
        showAlert('err', warnings[0])
      } else {
        // جميع الأيام نجحت بدون تحذيرات
        showAlert('ok', t.saved)
      }

      // ✅ تحسين #8: تصفير البيانات بعد الحفظ الناجح
      setSDF(false)
      setDDays([])
      setDStart('08:00')
      setDEnd('14:00')
      setD24(false)
      setDSlot(15)
      fetchDoctor(selectedDoctor)
    } catch (err) {
      console.error('Failed to add doctor schedule:', err)
      const msg = getErrorMessage(err, t.errSave)
      showAlert('err', msg)
    }
  }

  const startEdit = (s:DoctorSchedule) => {
    setEditId(s.id); setES(s.startTime.substring(0,5)); setEE(s.endTime.substring(0,5))
    setESl(s.slotDuration)
  }

  const handleEdit = async () => {
    // ✅ تحسين #4: التحقق من البيانات قبل الإرسال
    if (!editId) return
    const s = doctorSchedules.find(x=>x.id===editId)
    if (!s) return
    
    // ✅ تحسين #5 و #9: التحقق من صحة أوقات البداية والنهاية
    if (!isValidTimeRange(eStart, eEnd)) {
      showAlert('err', t.errEndTimeBeforeStart)
      return
    }

    try {
      await api.put(`/schedules/doctor/${editId}`, {
        doctorId: selectedDoctor,
        dayOfWeek: s.dayOfWeek,
        startTime: eStart+':00',
        endTime: eEnd+':00',
        slotDuration: eSlot,
      })
      showAlert('ok', t.saved)
      setEditId(null)
      fetchDoctor(selectedDoctor)
    } catch (err) {
      console.error('Failed to edit doctor schedule:', err)
      const msg = getErrorMessage(err, t.errSave)
      showAlert('err', msg)
    }
  }

  const handleCopyClinic = async () => {
    // ✅ تحسين #2 و #4: التحقق من اختيار الطبيب والبيانات
    if (!selectedDoctor) {
      showAlert('err', t.selectDoctor)
      return
    }
    if (clinicSchedules.length===0) {
      showAlert('err', t.errNoClinic)
      return
    }
    
    // ✅ تحسين #3 و #6: التحقق من الأيام المضافة مسبقاً ونسخ فقط الجديدة
    const schedulesToCopy = clinicSchedules.filter(
      s => !existingDoctorDays.has(s.dayOfWeek)
    )

    if (schedulesToCopy.length === 0) {
      showAlert('err', t.errAllClinicDaysAdded)
      return
    }

    if (!confirm(t.copyConfirm)) return

    try {
      // ✅ تحسين #2: معالجة أفضل لنتائج النسخ باستخدام allSettled
      const results = await Promise.allSettled(
        schedulesToCopy.map(s => 
          api.post('/schedules/doctor', {
            doctorId: selectedDoctor,
            dayOfWeek: s.dayOfWeek,
            startTime: s.openTime,
            endTime: s.closeTime,
            slotDuration: 15,
          })
        )
      )

      const failures = results.filter(r => r.status === 'rejected')
      const successes = results.filter(r => r.status === 'fulfilled')

      if (failures.length > 0 && successes.length > 0) {
        showAlert('err', t.errPartialAdd)
      } else if (failures.length > 0) {
        const firstError = (failures[0] as PromiseRejectedResult).reason
        const msg = getErrorMessage(firstError, t.errSave)
        showAlert('err', msg)
      } else {
        showAlert('ok', t.copied)
      }

      fetchDoctor(selectedDoctor)
    } catch (err) {
      console.error('Failed to copy clinic schedule:', err)
      const msg = getErrorMessage(err, t.errSave)
      showAlert('err', msg)
    }
  }

  const delClinic = async (id:string) => {
    try { 
      await api.delete(`/schedules/clinic/${id}`)
      showAlert('ok', t.deleted)
      fetchClinic()
    } catch (err) {
      console.error('Failed to delete clinic schedule:', err)
      const msg = getErrorMessage(err, t.errDel)
      showAlert('err', msg)
    }
  }

  const delDoctor = async (id:string) => {
    if (editId===id) setEditId(null)
    try {
      await api.delete(`/schedules/doctor/${id}`)
      showAlert('ok', t.deleted)
      fetchDoctor(selectedDoctor)
    } catch (err) {
      console.error('Failed to delete doctor schedule:', err)
      const msg = getErrorMessage(err, t.errDel)
      showAlert('err', msg)
    }
  }

  const handleAddAbsence = async () => {
    // ✅ تحسين #4: التحقق الشامل من البيانات قبل الإرسال
    if (!absStart || !absEnd) {
      showAlert('err', isAr?'حدد التواريخ':'Select dates')
      return
    }

    // ✅ تحسين #4: التحقق من تاريخ النهاية
    if (absEnd < absStart) {
      showAlert('err', t.errEndDateBefore)
      return
    }

    // ✅ تحسين #9: التحقق من الأوقات في الإجازة الجزئية
    if (!absFullDay && !isValidTimeRange(absStartT, absEndT)) {
      showAlert('err', t.errEndTimeBeforeStart)
      return
    }

    // ✅ تحسين #3 و #4: التحقق من اختيار الطبيب إذا كانت الإجازة للطبيب
    if (absFor === 'doctor' && !absDoctor) {
      showAlert('err', t.selectDoctor)
      return
    }

    try {
      await api.post(`/absences?lang=${lang}`, {
        doctorId:    absFor==='doctor' && absDoctor ? absDoctor : null,
        startDate:   absStart,
        endDate:     absEnd,
        isFullDay:   absFullDay,
        startTime:   absFullDay ? null : absStartT + ':00',
        endTime:     absFullDay ? null : absEndT + ':00',
        type:        absType,
        notes:       absNotes || null,
      })
      showAlert('ok', isAr?'تمت إضافة الإجازة':'Absence added')
      
      // ✅ تحسين #8: تصفير البيانات بعد الإضافة الناجحة
      setSAF(false)
      setAbsStart('')
      setAbsEnd('')
      setAbsNotes('')
      setAbsDoctor('')
      setAbsType('holiday')
      setAbsFullDay(true)
      setAbsStartT('09:00')
      setAbsEndT('12:00')
      setAbsFor('clinic')
      
      fetchAbsences()
    } catch (err) {
      console.error('Failed to add absence:', err)
      const msg = getErrorMessage(err, t.errSave)
      showAlert('err', msg)
    }
  }

  const delAbsence = async (id:string) => {
    try {
      await api.delete(`/absences/${id}`)
      showAlert('ok', t.deleted)
      fetchAbsences()
    } catch (err) {
      console.error('Failed to delete absence:', err)
      const msg = getErrorMessage(err, t.errDel)
      showAlert('err', msg)
    }
  }

  const selDoc = doctors.find(d=>d.id===selectedDoctor)
  const existingClinicDays = new Set(clinicSchedules.map(s => s.dayOfWeek))
  const existingDoctorDays = new Set(doctorSchedules.map(s => s.dayOfWeek))
  const getTypeLabel = (type:string) => ABSENCE_TYPES[lang].find(x=>x.value===type)

  return (
    <div className="sch-shell" style={{ fontFamily:t.font, direction:t.dir, background:'#F8FAFA', minHeight:'100vh', padding:24 }}>
      <div style={{ maxWidth:1300, margin:'0 auto' }}>

        {/* ✅ طباعة موحدة */}
        <PrintHeader reportTitle={t.title} lang={lang} />

        {/* Header */}
        <div className="no-print" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:12 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY, animation:'soft-pulse 2s infinite' }} />
              {t.mgmt}
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, fontWeight:500, color:TEXT_DARK, margin:0, letterSpacing:'-0.3px' }}>
              {t.title}
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="sch-tabs no-print">
          <button className={`sch-tab${tab==='clinic'?' active':''}`} onClick={()=>setTab('clinic')}>🏥 {t.clinicTab}</button>
          <button className={`sch-tab${tab==='doctor'?' active':''}`} onClick={()=>setTab('doctor')}>👨‍⚕️ {t.doctorTab}</button>
          <button className={`sch-tab${tab==='absence'?' active':''}`} onClick={()=>setTab('absence')}>
            🚫 {t.absenceTab}
            {absences.length > 0 && (
              <span style={{ background:AMBER, color:'#FFF', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:100, marginLeft:4 }}>
                {absences.length}
              </span>
            )}
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`alert ${alert.type}`}>
            <span>{alert.type==='ok'?'✓ ':''}{alert.msg}</span>
            <button onClick={()=>setAlert(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'inherit' }}>✕</button>
          </div>
        )}

        {/* ════════ CLINIC TAB ════════ */}
        {tab==='clinic' && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <button className="btn-p" onClick={()=>{
                // ✅ تحسين #8: تصفير البيانات عند الإلغاء
                if (showClinicForm) {
                  setCDays([])
                  setCOpen('08:00')
                  setCClose('20:00')
                  setC24(false)
                }
                setSCF(!showClinicForm)
              }}>
                {showClinicForm ? t.cancel : t.addDay}
              </button>
            </div>
            {showClinicForm && (
              <div className="sch-form">
                <p style={{ fontSize:13, fontWeight:700, color:TEXT_DARK, marginBottom:14 }}>{t.selectDays}</p>
                <div className="day-grid" style={{ marginBottom:16 }}>
                  {t.days.map((d,i) => {
                    const taken = existingClinicDays.has(i)
                    return (
                      <button key={i}
                        className={`day-btn${cDays.includes(i)?' sel':''}${taken?' disabled':''}`}
                        disabled={taken}
                        onClick={()=>!taken && toggleDay(cDays,setCDays,i)}
                        title={taken ? (isAr ? 'مضاف مسبقاً' : 'Already added') : ''}
                        style={{ opacity:taken?0.4:1, cursor:taken?'not-allowed':'pointer' }}>
                        {d}
                        {taken && <span style={{ display:'block', fontSize:9, color:ERROR_C }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                  <button className={`h24-toggle${c24?' on':''}`} onClick={()=>setC24(!c24)}>🕐 {t.h24}</button>
                  {!c24 && (
                    <div style={{ display:'flex', gap:12, flex:1, flexWrap:'wrap' }}>
                      <div className="field" style={{ minWidth:130 }}>
                        <label>{t.openTime}</label>
                        <input type="time" value={cOpen} onChange={e=>setCOpen(e.target.value)} />
                      </div>
                      <div className="field" style={{ minWidth:130 }}>
                        <label>{t.closeTime}</label>
                        <input type="time" value={cClose} onChange={e=>setCClose(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <button className="btn-p" onClick={handleAddClinicDays}>{t.save}</button>
                  <button className="btn-s" onClick={()=>{
                    // ✅ تحسين #8: تصفير عند الإلغاء
                    setCDays([])
                    setCOpen('08:00')
                    setCClose('20:00')
                    setC24(false)
                    setSCF(false)
                  }}>{t.cancel}</button>
                </div>
              </div>
            )}
            {clinicLoading ? <Spinner /> : clinicSchedules.length===0 ? (
              <div className="empty"><span style={{ fontSize:48, opacity:0.4 }}>📅</span><p>{t.noData}</p></div>
            ) : (
              <>
                <div className="no-print" style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:12 }}>
                  <ExportBar endpoint="/schedules/clinic/export" lang={lang} fileName="clinic-schedule" />
                  <ColumnToggleButton columns={clinicColumnDefs} visibleKeys={clinicVisible} onToggle={toggleClinic} isRtl={isAr} />
                </div>
                <div className="sch-cards">
                  {clinicSchedules.slice().sort((a,b)=>a.dayOfWeek-b.dayOfWeek).map(s => (
                    <div key={s.id} className="sch-card">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <div>
                          <p style={{ fontSize:15, fontWeight:700, color:TEXT_DARK, margin:0 }}>{t.daysLong[s.dayOfWeek]}</p>
                          <p style={{ fontSize:12, color:TEXT_MUTED, margin:'3px 0 0', fontFamily:"'Inter',sans-serif" }}>
                            {fmtTime(s.openTime)==='00:00'&&fmtTime(s.closeTime)==='23:59' ? `🕐 ${t.h24}` : `${fmtTime12(s.openTime)} — ${fmtTime12(s.closeTime)}`}
                          </p>
                        </div>
                        <button className="btn-del no-print" onClick={()=>delClinic(s.id)}>✕</button>
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {clinicVisible.has('openTime') && <span className="badge" style={{ background:PRIMARY_SOFT, color:PRIMARY }}>🕗 {fmtTime12(s.openTime)}</span>}
                        {clinicVisible.has('closeTime') && <span className="badge" style={{ background:PRIMARY_SOFT, color:PRIMARY }}>🕓 {fmtTime12(s.closeTime)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════ DOCTOR TAB ════════ */}
        {tab==='doctor' && (
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:TEXT_MUTED, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>{t.allDoctors}</p>
            <div className="doc-grid">
              {doctors.map(d => (
                <div key={d.id} className={`doc-card${selectedDoctor===d.id?' sel':''}`} onClick={()=>{ setSel(d.id); setSDF(false); setEditId(null) }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:PRIMARY_SOFT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>👨‍⚕️</div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:TEXT_DARK, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.fullName}</p>
                    {d.specialty && <p style={{ fontSize:11, color:TEXT_MUTED, margin:0 }}>{d.specialty}</p>}
                  </div>
                </div>
              ))}
            </div>
            {selectedDoctor && (
              <div>
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
                  <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>👨‍⚕️</span>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:TEXT_DARK, margin:0 }}>{selDoc?.fullName}</p>
                      {selDoc?.specialty && <p style={{ fontSize:11, color:TEXT_MUTED, margin:0 }}>{selDoc.specialty}</p>}
                    </div>
                  </div>
                  <button className="btn-copy" onClick={handleCopyClinic}>{t.copyClinic}</button>
                  <button className="btn-p" onClick={()=>{
                    // ✅ تحسين #8: تصفير البيانات عند الإلغاء
                    if (showDoctorForm) {
                      setDDays([])
                      setDStart('08:00')
                      setDEnd('14:00')
                      setD24(false)
                      setDSlot(15)
                    }
                    setSDF(!showDoctorForm)
                    setEditId(null)
                  }}>
                    {showDoctorForm ? t.cancel : t.addDay}
                  </button>
                </div>
                {showDoctorForm && (
                  <div className="sch-form">
                    <p style={{ fontSize:13, fontWeight:700, color:TEXT_DARK, marginBottom:14 }}>{t.selectDays}</p>
                    <div className="day-grid" style={{ marginBottom:16 }}>
                      {t.days.map((d,i) => {
                        const taken = existingDoctorDays.has(i)
                        return (
                          <button key={i}
                            className={`day-btn${dDays.includes(i)?' sel':''}${taken?' disabled':''}`}
                            disabled={taken}
                            onClick={()=>!taken && toggleDay(dDays,setDDays,i)}
                            title={taken ? (isAr ? 'مضاف مسبقاً' : 'Already added') : ''}
                            style={{ opacity:taken?0.4:1, cursor:taken?'not-allowed':'pointer' }}>
                            {d}
                            {taken && <span style={{ display:'block', fontSize:9, color:ERROR_C }}>✓</span>}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                      <button className={`h24-toggle${d24?' on':''}`} onClick={()=>setD24(!d24)}>🕐 {t.h24}</button>
                      {!d24 && (
                        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                          <div className="field" style={{ minWidth:130 }}>
                            <label>{t.startTime}</label>
                            <input type="time" value={dStart} onChange={e=>setDStart(e.target.value)} />
                          </div>
                          <div className="field" style={{ minWidth:130 }}>
                            <label>{t.endTime}</label>
                            <input type="time" value={dEnd} onChange={e=>setDEnd(e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="field-row">
                      <div className="field">
                        <label>{t.slot}</label>
                        <SearchableSelect isRtl={isAr} value={String(dSlot)} onChange={v=>setDSlot(Number(v))}
                          options={slotOptions.map(v=>({value:String(v), label:`${v} ${t.min}`}))} />
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                      <button className="btn-p" onClick={handleAddDoctorDays}>{t.save}</button>
                      <button className="btn-s" onClick={()=>{
                        // ✅ تحسين #8: تصفير عند الإلغاء
                        setDDays([])
                        setDStart('08:00')
                        setDEnd('14:00')
                        setD24(false)
                        setDSlot(15)
                        setSDF(false)
                      }}>{t.cancel}</button>
                    </div>
                  </div>
                )}
                {doctorLoading ? <Spinner /> : doctorSchedules.length===0 ? (
                  <div className="empty">
                    <span style={{ fontSize:48, opacity:0.4 }}>📅</span>
                    <p style={{ marginBottom:12 }}>{t.noData}</p>
                    <button className="btn-copy" onClick={handleCopyClinic}>{t.copyClinic}</button>
                  </div>
                ) : (
                  <>
                    <div className="no-print" style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:12 }}>
                      <ExportBar endpoint={`/schedules/doctor/${selectedDoctor}/export`} lang={lang} fileName="doctor-schedule" />
                      <ColumnToggleButton columns={doctorColumnDefs} visibleKeys={doctorVisible} onToggle={toggleDoctor} isRtl={isAr} />
                    </div>
                    <div className="sch-cards">
                      {doctorSchedules.slice().sort((a,b)=>a.dayOfWeek-b.dayOfWeek).map(s => {
                        const isEditing = editId===s.id
                        return (
                          <div key={s.id} className={`sch-card${isEditing?' editing':''}`}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                              <p style={{ fontSize:15, fontWeight:700, color:TEXT_DARK, margin:0 }}>{t.daysLong[s.dayOfWeek]}</p>
                              <div className="no-print" style={{ display:'flex', gap:6 }}>
                                <button className="btn-edit" onClick={()=>isEditing?setEditId(null):startEdit(s)}>
                                  {isEditing ? t.cancel : `✏️ ${t.edit}`}
                                </button>
                                <button className="btn-del" onClick={()=>delDoctor(s.id)}>✕</button>
                              </div>
                            </div>
                            {isEditing ? (
                              <div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                                  <div className="field">
                                    <label>{t.startTime}</label>
                                    <input type="time" value={eStart} onChange={e=>setES(e.target.value)} />
                                  </div>
                                  <div className="field">
                                    <label>{t.endTime}</label>
                                    <input type="time" value={eEnd} onChange={e=>setEE(e.target.value)} />
                                  </div>
                                </div>
                                <div className="field" style={{ marginBottom:8 }}>
                                  <label>{t.slot}</label>
                                  <select value={eSlot} onChange={e=>setESl(Number(e.target.value))} style={{ background:PRIMARY_SOFT, fontWeight:600, color:PRIMARY }}>
                                    {slotOptions.map(v=><option key={v} value={v}>{v} {t.min}</option>)}
                                  </select>
                                </div>
                                <button className="btn-p" onClick={handleEdit} style={{ width:'100%', borderRadius:10, justifyContent:'center' }}>💾 {t.save}</button>
                              </div>
                            ) : (
                              <>
                                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
                                  {doctorVisible.has('time') && (
                                    <span className="badge" style={{ background:PRIMARY_SOFT, color:PRIMARY, fontFamily:"'Inter',sans-serif" }}>
                                      🕗 {fmtTime12(s.startTime)} — {fmtTime12(s.endTime)}
                                    </span>
                                  )}
                                  {doctorVisible.has('slotDuration') && (
                                    <span className="badge" style={{ background:AMBER_BG, color:AMBER }}>⏱ {s.slotDuration} {t.min}</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
            {!selectedDoctor && (
              <div className="empty"><span style={{ fontSize:48, opacity:0.4 }}>👨‍⚕️</span><p>{t.selectDoctor}</p></div>
            )}
          </div>
        )}

        {/* ════════ ABSENCE TAB ════════ */}
        {tab==='absence' && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
              <button className="btn-amber" onClick={()=>{
                // ✅ تحسين #8: تصفير البيانات عند الإلغاء
                if (showAbsenceForm) {
                  setAbsStart('')
                  setAbsEnd('')
                  setAbsNotes('')
                  setAbsDoctor('')
                  setAbsType('holiday')
                  setAbsFullDay(true)
                  setAbsStartT('09:00')
                  setAbsEndT('12:00')
                  setAbsFor('clinic')
                }
                setSAF(!showAbsenceForm)
              }}>
                {showAbsenceForm ? t.cancel : t.addAbsence}
              </button>
            </div>

            {/* Absence Form */}
            {showAbsenceForm && (
              <div className="sch-form" style={{ borderColor:AMBER+'60' }}>
                {/* لمن الإجازة */}
                <p style={{ fontSize:13, fontWeight:700, color:TEXT_DARK, marginBottom:12 }}>{t.absenceFor}</p>
                <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                  <button className={`day-btn${absFor==='clinic'?' sel':''}`}
                    style={{ flex:1, padding:'10px' }}
                    onClick={()=>setAbsFor('clinic')}>
                    🏥 {t.clinicAbsence}
                  </button>
                  <button className={`day-btn${absFor==='doctor'?' sel':''}`}
                    style={{ flex:1, padding:'10px' }}
                    onClick={()=>setAbsFor('doctor')}>
                    👨‍⚕️ {t.doctorAbsence}
                  </button>
                </div>

                {/* اختيار الطبيب */}
                {absFor==='doctor' && (
                  <div className="field" style={{ marginBottom:16 }}>
                    <label>{t.selectDoctor}</label>
                    <SearchableSelect isRtl={isAr} value={absDoctor} onChange={setAbsDoctor}
                      placeholder={`${t.selectDoctor}...`}
                      options={doctors.map(d=>({value:d.id, label:d.fullName}))} />
                  </div>
                )}

                {/* نوع الإجازة */}
                <p style={{ fontSize:11, fontWeight:700, color:TEXT_MUTED, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>{t.absenceType}</p>
                <div className="type-grid" style={{ marginBottom:16 }}>
                  {ABSENCE_TYPES[lang].map(tp => (
                    <button key={tp.value} className={`type-btn${absType===tp.value?' sel':''}`}
                      onClick={()=>setAbsType(tp.value)}>
                      {tp.icon} {tp.label}
                    </button>
                  ))}
                </div>

                {/* التواريخ */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div className="field">
                    <label>{t.startDate}</label>
                    <input type="date" value={absStart} onChange={e=>setAbsStart(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t.endDate}</label>
                    <input type="date" value={absEnd} onChange={e=>setAbsEnd(e.target.value)} />
                  </div>
                </div>

                {/* يوم كامل أم فترة */}
                <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                  <button className={`h24-toggle${absFullDay?' on':''}`} onClick={()=>setAbsFullDay(true)}>
                    📅 {t.fullDay}
                  </button>
                  <button className={`h24-toggle${!absFullDay?' on':''}`} onClick={()=>setAbsFullDay(false)}>
                    ⏰ {t.partialDay}
                  </button>
                </div>

                {!absFullDay && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                    <div className="field">
                      <label>{t.startTime}</label>
                      <input type="time" value={absStartT} onChange={e=>setAbsStartT(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>{t.endTime}</label>
                      <input type="time" value={absEndT} onChange={e=>setAbsEndT(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* ملاحظات */}
                <div className="field" style={{ marginBottom:16 }}>
                  <label>{t.notes}</label>
                  <textarea value={absNotes} onChange={e=>setAbsNotes(e.target.value)}
                    placeholder={t.notesPlaceholder} rows={2}
                    style={{ resize:'vertical' }} />
                </div>

                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <button className="btn-amber" onClick={handleAddAbsence}>{t.save}</button>
                  <button className="btn-s" onClick={()=>{
                    // ✅ تحسين #8: تصفير عند الإلغاء
                    setAbsStart('')
                    setAbsEnd('')
                    setAbsNotes('')
                    setAbsDoctor('')
                    setAbsType('holiday')
                    setAbsFullDay(true)
                    setAbsStartT('09:00')
                    setAbsEndT('12:00')
                    setAbsFor('clinic')
                    setSAF(false)
                  }}>{t.cancel}</button>
                </div>
              </div>
            )}

            {/* قائمة الإجازات */}
            <div className="no-print" style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:12 }}>
              <ExportBar endpoint="/absences/export" lang={lang} fileName="absence-schedule" />
              <ColumnToggleButton columns={absenceColumnDefs} visibleKeys={absenceVisible} onToggle={toggleAbsence} isRtl={isAr} />
            </div>

            {absenceLoading ? <Spinner /> : absences.length===0 ? (
              <div className="empty">
                <span style={{ fontSize:48, opacity:0.4 }}>🚫</span>
                <p>{t.noAbsences}</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                {absences.map(a => {
                  const tp  = getTypeLabel(a.type)
                  const col = typeColor(a.type)
                  return (
                    <div key={a.id} className="abs-card">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:22 }}>{tp?.icon}</span>
                          <div>
                            {absenceVisible.has('type') && (
                              <p style={{ fontSize:14, fontWeight:700, color:TEXT_DARK, margin:0 }}>
                                {tp?.label}
                              </p>
                            )}
                            {absenceVisible.has('person') && (
                              <p style={{ fontSize:11, color:TEXT_MUTED, margin:'2px 0 0' }}>
                                {a.doctorName ? `👨‍⚕️ ${a.doctorName}` : `🏥 ${t.clinicHoliday}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <button className="btn-del no-print" onClick={()=>delAbsence(a.id)}>✕</button>
                      </div>

                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                        {absenceVisible.has('date') && (
                          <span className="badge" style={{ background:col.bg, color:col.color, border:`1px solid ${col.border}` }}>
                            📅 {fmtDate(a.startDate)}
                            {a.endDate!==a.startDate && ` → ${fmtDate(a.endDate)}`}
                          </span>
                        )}
                        {absenceVisible.has('duration') && (
                          a.isFullDay ? (
                            <span className="badge" style={{ background:AMBER_BG, color:'#92400E' }}>
                              🕐 {t.fullDay}
                            </span>
                          ) : (
                            <span className="badge" style={{ background:AMBER_BG, color:'#92400E', fontFamily:"'Inter',sans-serif" }}>
                              ⏰ {fmtTime12(a.startTime||'')} — {fmtTime12(a.endTime||'')}
                            </span>
                          )
                        )}
                      </div>
                      {absenceVisible.has('notes') && a.notes && (
                        <p style={{ fontSize:12, color:TEXT_MUTED, margin:0, fontStyle:'italic' }}>
                          📝 {a.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}