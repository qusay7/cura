import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import SearchableSelect from '../components/SearchableSelect'
import { useSubmitGuard } from '../hooks/useSubmitGuard'
import { useColumnVisibility, ColumnToggleButton, type ColumnDef } from '../components/ColumnToggle'
const getStoredLang = (): 'ar' | 'en' => (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const PRIMARY      = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK    = '#2C3E3F'
const TEXT_MUTED   = '#6B8A8C'
const BORDER       = '#DCE5E5'
const CARD_BG      = '#FFFFFF'
const SUCCESS      = '#16A34A'
const SUCCESS_BG   = '#F0FDF4'
const DANGER       = '#EF4444'
const DANGER_BG    = '#FEF2F2'
const WARNING      = '#F59E0B'

const css = `
@keyframes fade-up{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.staff-shell{animation:fade-up 0.4s ease both;}
.staff-shell *{box-sizing:border-box;}
.staff-card{transition:all 0.2s;cursor:pointer;}
.staff-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(91,140,143,0.12)!important;}
.form-inp,.form-sel{width:100%;padding:9px 12px;border:1px solid ${BORDER};border-radius:10px;font-size:13px;color:${TEXT_DARK};outline:none;background:${CARD_BG};font-family:inherit;}
.form-inp:focus,.form-sel:focus{border-color:${PRIMARY};box-shadow:0 0 0 3px ${PRIMARY}18;}
.tab-btn{padding:8px 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid ${BORDER};background:transparent;color:${TEXT_MUTED};transition:all 0.2s;}
.tab-btn.active{background:${PRIMARY};color:#FFF;border-color:${PRIMARY};}
.tab-btn:not(.active):hover{background:${PRIMARY_SOFT};color:${PRIMARY};}
`
const globalCss = `
@media print {
  .no-print { display: none !important; }
  body { margin: 0; padding: 10px; }
}
`
const CONTRACTS_AR = ['دوام كامل','دوام جزئي','عقد مؤقت']
const CONTRACTS_EN = ['Full Time','Part Time','Contract']
const CONTRACT_VALS = ['fulltime','parttime','contract']

const T = {
  ar: {
    font:"'Noto Kufi Arabic',sans-serif", dir:'rtl' as const,
    title:'فريق العمل', subtitle:'إدارة موظفي العيادة',
    add:'إضافة موظف', edit:'تعديل', delete:'حذف', save:'حفظ', cancel:'إلغاء',
    confirm:'تأكيد الحذف؟', search:'بحث...',
    // بيانات
    fullName:'الاسم الكامل', fullNameEn:'الاسم بالإنجليزي',
    gender:'الجنس', male:'ذكر', female:'أنثى',
    dob:'تاريخ الميلاد', age:'العمر', nationalId:'الرقم الوطني',
    nationality:'الجنسية', maritalStatus:'الحالة الاجتماعية',
    single:'أعزب', married:'متزوج', divorced:'مطلق', widowed:'أرمل',
    bloodType:'فصيلة الدم',
    phone:'الهاتف', phone2:'هاتف 2', email:'البريد الإلكتروني',
    address:'العنوان', emergencyContact:'شخص الطوارئ', emergencyPhone:'هاتف الطوارئ',
    jobTitle:'المسمى الوظيفي', department:'القسم', role:'الدور',
    contractType:'نوع العقد', joinDate:'تاريخ الانضمام', endDate:'تاريخ انتهاء العقد',
    salary:'الراتب', workingHours:'ساعات العمل',
    qualifications:'المؤهلات', specialization:'التخصص',
    notes:'ملاحظات', active:'نشط', inactive:'موقوف',
    yearsInClinic:'سنوات الخدمة', riyal:'د.أ',
    // تبويبات النموذج
    tabPersonal:'👤 شخصية', tabContact:'📱 تواصل', tabWork:'💼 عمل',
    // إحصائيات
    total:'إجمالي الموظفين', totalSalary:'إجمالي الرواتب',
    // أدوار
    roleFieldLabel:'المسمى الوظيفي (نص حر)',
    contracts: CONTRACTS_AR, contractVals: CONTRACT_VALS,
    noData:'لا يوجد موظفون', loading:'جاري التحميل...',
    errSave:'حدث خطأ', successSave:'تم الحفظ بنجاح',
    allRoles:'كل الأدوار', allStatus:'كل الحالات',
    // ✅ طبيب / حساب دخول
    isDoctor:'هل هذا الشخص طبيب؟',
    doctorModeAuto:'إنشاء بطاقة طبيب جديدة تلقائياً',
    doctorModeExisting:'ربط بطبيب موجود مسبقاً',
    selectDoctor:'اختر الطبيب', searchDoctor:'ابحث عن طبيب...',
    linkedTo:'مرتبط بـ:', noDoctorsAvailable:'لا يوجد أطباء غير مرتبطين',
    doctorWorkType:'نوع عمل الطبيب', workAppointments:'مواعيد فقط', workBoth:'مواعيد وطابور',
    createLogin:'إنشاء حساب دخول للنظام؟',
    loginEmail:'البريد الإلكتروني', loginUsername:'اسم المستخدم',
    loginPassword:'كلمة المرور', alreadyLinkedUser:'هذا الموظف مرتبط بحساب دخول بالفعل',
    selectPlaceholder:'اختر...',    print: 'طباعة',
    exportPdf: 'تصدير PDF',
    exportExcel: 'تصدير Excel',
  },
  en: {
    font:"'Inter',sans-serif", dir:'ltr' as const,
    title:'Staff', subtitle:'Manage clinic staff members',
    add:'Add Staff', edit:'Edit', delete:'Delete', save:'Save', cancel:'Cancel',
    confirm:'Confirm delete?', search:'Search...',
    fullName:'Full Name', fullNameEn:'Name in English',
    gender:'Gender', male:'Male', female:'Female',
    dob:'Date of Birth', age:'Age', nationalId:'National ID',
    nationality:'Nationality', maritalStatus:'Marital Status',
    single:'Single', married:'Married', divorced:'Divorced', widowed:'Widowed',
    bloodType:'Blood Type',
    phone:'Phone', phone2:'Phone 2', email:'Email',
    address:'Address', emergencyContact:'Emergency Contact', emergencyPhone:'Emergency Phone',
    jobTitle:'Job Title', department:'Department', role:'Role',
    contractType:'Contract Type', joinDate:'Join Date', endDate:'End Date',
    salary:'Salary', workingHours:'Working Hours',
    qualifications:'Qualifications', specialization:'Specialization',
    notes:'Notes', active:'Active', inactive:'Inactive',
    yearsInClinic:'Years in Clinic', riyal:'JD',
    tabPersonal:'👤 Personal', tabContact:'📱 Contact', tabWork:'💼 Work',
    total:'Total Staff', totalSalary:'Total Salaries',
    roleFieldLabel:'Job Role (free text)',
    contracts: CONTRACTS_EN, contractVals: CONTRACT_VALS,
    noData:'No staff members', loading:'Loading...',
    errSave:'An error occurred', successSave:'Saved successfully',
    allRoles:'All Roles', allStatus:'All Status',
    isDoctor:'Is this person a doctor?',
    doctorModeAuto:'Create a new doctor card automatically',
    doctorModeExisting:'Link to an existing doctor',
    selectDoctor:'Select doctor', searchDoctor:'Search for a doctor...',
    linkedTo:'Linked to:', noDoctorsAvailable:'No unlinked doctors available',
    doctorWorkType:'Doctor work type', workAppointments:'Appointments only', workBoth:'Appointments & Queue',
    createLogin:'Create a system login account?',
    loginEmail:'Email', loginUsername:'Username',
    loginPassword:'Password', alreadyLinkedUser:'This staff member already has a login account',
    selectPlaceholder:'Select...',
    print: 'Print',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
  },
}

interface Department {
  id: string
  name: string
}

interface DoctorOption {
  id: string
  fullName: string
  specialty: string | null
  linkedStaffId: string | null
  linkedStaffName: string | null
  isAvailable: boolean
}

interface StaffForm {
  fullName: string
  fullNameEn: string
  gender: string
  dateOfBirth: string
  nationalId: string
  nationality: string
  maritalStatus: string
  bloodType: string
  phone: string
  phone2: string
  email: string
  address: string
  emergencyContact: string
  emergencyPhone: string
  jobTitle: string
  department: string
  departmentId: string
  roleId: string
  contractType: string
  joinDate: string
  endDate: string
  salary: string
  workingHours: string
  qualifications: string
  specialization: string
  notes: string
  // ✅ طبيب
  isDoctor: boolean
  doctorMode: 'auto' | 'existing'
  doctorId: string
  doctorWorkType: string
  // ✅ حساب دخول
  createLoginAccount: boolean
  loginEmail: string
  loginUsername: string
  loginPassword: string
}

const emptyForm: StaffForm = {
  fullName:'', fullNameEn:'', gender:'', dateOfBirth:'', nationalId:'',
  nationality:'', maritalStatus:'', bloodType:'',
  phone:'', phone2:'', email:'', address:'', emergencyContact:'', emergencyPhone:'',
  jobTitle:'', department:'', departmentId:'', roleId:'', contractType:'fulltime',
  joinDate:'', endDate:'', salary:'', workingHours:'', qualifications:'', specialization:'',
  notes:'',
  isDoctor:false, doctorMode:'auto', doctorId:'', doctorWorkType:'appointments',
  createLoginAccount:false, loginEmail:'', loginUsername:'', loginPassword:'',
}

const bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

export default function Staff() {
  const navigate   = useNavigate()
  const [lang, setLang]     = useState<'ar'|'en'>(getStoredLang())
  const [staff, setStaff]   = useState<any[]>([])
  const [stats, setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert]   = useState<{type:'ok'|'err';msg:string}|null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole]     = useState('')
  const [filterActive, setFilterActive] = useState('')
  // Form
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string|null>(null)
  const [formTab, setFormTab]   = useState<'personal'|'contact'|'work'>('personal')
  const [form, setForm]         = useState<StaffForm>({ ...emptyForm })
  // Detail Modal
  const [selected, setSelected] = useState<any>(null)

  const t    = T[lang]
  const isAr = lang === 'ar'
// ✅ إعدادات الأعمدة
const columnDefs: ColumnDef[] = [
  { key: 'fullName', label: t.fullName, locked: true },
  { key: 'phone', label: t.phone },
  { key: 'email', label: t.email },
  { key: 'role', label: t.role },
  { key: 'department', label: t.department },
  { key: 'contractType', label: t.contractType },
  { key: 'salary', label: t.salary },
  { key: 'yearsInClinic', label: t.yearsInClinic },
  { key: 'jobTitle', label: t.jobTitle },
]
const { visibleKeys, toggle } = useColumnVisibility('staff-table', columnDefs)

  useEffect(() => {
    const id = 'cura-staff-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id=id; s.textContent=css; document.head.appendChild(s)
    }
    const onLang = (e:Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLang)
    fetchAll()
    return () => window.removeEventListener('cura-lang-change', onLang)
  }, [])

  const showAlrt = (type:'ok'|'err', msg:string) => {
    setAlert({type,msg}); setTimeout(()=>setAlert(null),3000)
  }
const [departments, setDepartments] = useState<Department[]>([])
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [systemRoles, setSystemRoles] = useState<{id:string; name:string; nameEn:string|null; description:string|null}[]>([])
  const [systemRolesLoading, setSystemRolesLoading] = useState(false)

  // ✅ الأدوار وتسمياتها تُجلب من قاعدة البيانات بالكامل — بدون أي خريطة ترجمة يدوية.
  // Role.Description = التسمية العربية، Role.NameEn = التسمية الإنجليزية (كلاهما مخزّن فعلياً
  // بجدول Roles من لحظة إنشاء العيادة عبر RoleSeedingService)
  useEffect(() => {
    setSystemRolesLoading(true)
    api.get('/roles')
      .then(res => setSystemRoles(res.data
        .filter((r:any) => r.name !== 'SuperAdmin')
        .map((r:any) => ({ id:r.id, name:r.name, nameEn:r.nameEn, description:r.description }))))
      .catch(() => setSystemRoles([]))
      .finally(() => setSystemRolesLoading(false))
  }, [])

  const systemRoleLabel = (role: {name:string; nameEn:string|null; description:string|null}) =>
    (isAr ? role.description : role.nameEn) || role.name

  // ✅ يجيب قائمة الأطباء (مع بيان المرتبط منهم بموظف آخر) — نجيبها بس أول ما
  // المستخدم يختار "ربط بطبيب موجود"، بدل ما نحملها دايماً بدون داعي
  const fetchAvailableDoctors = async () => {
    setDoctorsLoading(true)
    try {
      const qs = editId ? `?excludeStaffId=${editId}` : ''
      const res = await api.get(`/doctors/available-for-staff${qs}`)
      setAvailableDoctors(res.data)
    } catch { /* تجاهل — القائمة بترجع فاضية والمستخدم يقدر يعيد المحاولة */ }
    finally { setDoctorsLoading(false) }
  }

  const fetchAll = async () => {
    
    setLoading(true)
    try {
      const [staffRes, statsRes] = await Promise.all([
        api.get('/staff'),
        api.get('/staff/stats'),
        api.get('/departments').then((r:any)=>setDepartments(r.data)).catch(()=>{})

      ])
      
      setStaff(staffRes.data)
      setStats(statsRes.data)
    } catch (err:any) {
      if (err?.response?.status===401) navigate('/login')
    } finally { setLoading(false) }

  }
   const [currentUserId, setCurrentUserId] = useState<string | null>(null)

   const openAdd = () => {
    setEditId(null); setForm({...emptyForm}); setFormTab('personal'); setShowForm(true)
    setCurrentUserId(null); setAvailableDoctors([])
  }

  const openEdit = (s:any) => {
    setEditId(s.id)
    setCurrentUserId(s.userId || null)
   setForm({
  fullName:s.fullName||'', fullNameEn:s.fullNameEn||'',
  gender:s.gender||'', dateOfBirth:s.dateOfBirth||'', nationalId:s.nationalId||'',
  nationality:s.nationality||'', maritalStatus:s.maritalStatus||'', bloodType:s.bloodType||'',
  phone:s.phone||'', phone2:s.phone2||'', email:s.email||'',
  address:s.address||'', emergencyContact:s.emergencyContact||'', emergencyPhone:s.emergencyPhone||'',
  jobTitle:s.jobTitle||'', department:s.department||'', departmentId:s.departmentId||'',  // ✅
  roleId:s.roleId||'', contractType:s.contractType||'fulltime', joinDate:s.joinDate||'', endDate:s.endDate||'',
  salary:s.salary?.toString()||'', workingHours:s.workingHours||'',
  qualifications:s.qualifications||'', specialization:s.specialization||'', notes:s.notes||'',
  isDoctor: !!s.doctorId, doctorMode:'existing', doctorId: s.doctorId||'', doctorWorkType:'appointments',
  createLoginAccount:false, loginEmail:'', loginUsername:'', loginPassword:'',
})
    setFormTab('personal'); setShowForm(true); setSelected(null)
    if (s.doctorId) fetchAvailableDoctors()
  }

  const handleSaveRaw = async () => {
    if (!form.fullName.trim()) { showAlrt('err', isAr?'الاسم مطلوب':'Name required'); return }

    // ✅ تحقق قبل الإرسال
    if (form.isDoctor && form.doctorMode === 'existing' && !form.doctorId) {
      showAlrt('err', isAr ? 'اختر طبيباً من القائمة' : 'Please select a doctor'); return
    }
    if (form.createLoginAccount) {
      if (!form.loginUsername.trim()) {
        showAlrt('err', isAr ? 'اسم المستخدم مطلوب' : 'Username is required'); return
      }
      if (!/^[a-zA-Z0-9]+$/.test(form.loginUsername)) {
        showAlrt('err', isAr ? 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط' : 'Username must contain only English letters and numbers'); return
      }
      if (!form.loginPassword.trim() || form.loginPassword.length < 6) {
        showAlrt('err', isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'); return
      }
      if (!form.roleId) {
        showAlrt('err', isAr ? 'اختر دور الموظف من تبويب العمل أولاً' : 'Please select the staff role in the Work tab first'); return
      }
    }

    try {
      const payload = {
        ...form,
        salary: form.salary ? parseFloat(form.salary) : null,
        dateOfBirth: form.dateOfBirth || null,
        joinDate:    form.joinDate    || null,
        endDate:     form.endDate     || null,
        // ✅ نحوّل السلاسل الفاضية لـ null بدل ما نرسلها كنص فاضي —
        // الباك إند يتوقع Guid? حقيقي أو null، مو ""
        departmentId: form.departmentId || null,
        roleId: form.roleId || null,   // ✅ الدور الحقيقي من جدول Roles
        doctorId: (form.isDoctor && form.doctorMode === 'existing') ? (form.doctorId || null) : null,
        // ✅ الإيميل يُبنى تلقائياً من اسم المستخدم — بنفس نمط شاشة "إضافة مستخدم"
        loginEmail: form.createLoginAccount ? `${form.loginUsername}@CURA.COM` : null,
        loginUsername: form.createLoginAccount ? form.loginUsername : null,
        loginPassword: form.createLoginAccount ? form.loginPassword : null,
        // ✅ الدور صار يُختار صراحةً من قائمة حقيقية بدل تخمين الباك إند بصمت
        // ✅ دور الحساب = نفس دور الموظف المختار بتبويب العمل، بدون اختيار مكرر
        loginRole: form.createLoginAccount ? (systemRoles.find(r=>r.id===form.roleId)?.name || null) : null,
      }
      if (editId) {
        await api.put(`/staff/${editId}?lang=${lang}`, payload)
      } else {
        await api.post(`/staff?lang=${lang}`, payload)
      }
      showAlrt('ok', t.successSave)
      setShowForm(false); setEditId(null)
      fetchAll()
    } catch (err:any) {
      showAlrt('err', err.response?.data?.message || err.response?.data || t.errSave)
    }
  }

  // ✅ يمنع الضغط المزدوج على زر الحفظ (مثلاً وقت نت بطيء وتأخر رد الـ API)
  const { run: handleSave, loading: savingStaff } = useSubmitGuard(handleSaveRaw)

  const handleDelete = async (id:string) => {
    if (!window.confirm(t.confirm)) return
    try {
      await api.delete(`/staff/${id}?lang=${lang}`)
      showAlrt('ok', isAr?'تم الحذف':'Deleted')
      setSelected(null); fetchAll()
    } catch (err:any) { showAlrt('err', err.response?.data?.message || err.response?.data || t.errSave)}
  }

  const handleToggle = async (id:string) => {
    try {
      await api.put(`/staff/${id}/toggle-active?lang=${lang}`)
      fetchAll()
    } catch {}
  }

  // فلترة
  const filtered = staff.filter(s => {
    const matchSearch = !search || s.fullName?.includes(search) || s.phone?.includes(search) || s.jobTitle?.includes(search)
    const matchRole   = !filterRole   || s.roleId === filterRole
    const matchActive = !filterActive || (filterActive==='active' ? s.isActive : !s.isActive)
    return matchSearch && matchRole && matchActive
  })

  const inp: CSSProperties = { width:'100%', padding:'9px 12px', border:`1px solid ${BORDER}`, borderRadius:10, fontSize:13, color:TEXT_DARK, outline:'none', background:CARD_BG, fontFamily:'inherit' }
  const fld = (label:string, children:ReactNode) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:11, fontWeight:700, color:TEXT_MUTED, display:'block', marginBottom:4 }}>{label}</label>
      {children}
    </div>
  )

  // ✅ ما عاد فيه قائمة ثابتة نترجم منها — عرض الدور صار مباشرة عبر roleName القادم من الباك إند
  const contractLabel = (c:string) => {
    const idx = CONTRACT_VALS.indexOf(c)
    return idx >= 0 ? t.contracts[idx] : c
  }

  return (
  <>
    <style>{globalCss}</style>
    <div className="staff-shell" dir={t.dir} style={{ background:'#F8FAFA', minHeight:'100vh', padding:24, fontFamily:t.font }}>
      <div style={{ maxWidth:1300, margin:'0 auto' }}>

        {/* Alert */}
        {alert && (
          <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 20px', borderRadius:12,
            background:alert.type==='ok'?SUCCESS_BG:DANGER_BG, border:`1px solid ${alert.type==='ok'?SUCCESS:DANGER}`,
            color:alert.type==='ok'?SUCCESS:DANGER, fontWeight:600, fontSize:13 }}>
            {alert.type==='ok'?'✅':'❌'} {alert.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:24 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:100, padding:'4px 16px', fontSize:11, fontWeight:600, color:PRIMARY, marginBottom:12 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY }} /> 👥
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, fontWeight:500, color:TEXT_DARK, margin:0 }}>{t.title}</h2>
            <p style={{ fontSize:13, color:TEXT_MUTED, margin:'6px 0 0' }}>{t.subtitle}</p>
          </div>
          <button onClick={openAdd}
            style={{ padding:'10px 22px', background:PRIMARY, color:'#FFF', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
            + {t.add}
          </button>
        </div>
        {/* ✅ أزرار الطباعة والتصدير والأعمدة */}
<div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }} className="no-print">
  <button onClick={() => window.print()}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
    🖨️ {t.print || 'Print'}
  </button>
  <button onClick={() => {
    const rows = filtered.map(s => [
      s.fullName,
      s.phone || '—',
      s.email || '—',
      (isAr ? s.roleNameAr : s.roleNameEn) || s.roleName || '—',
      s.departmentName || '—',
      contractLabel(s.contractType) || '—',
      s.salary ? `${s.salary} ${t.riyal}` : '—',
      s.yearsInClinic || '—',
      s.jobTitle || '—',
    ])
    api.post('/export/pdf', {
      title: t.title,
      columns: columnDefs.map(c => c.label),
      rows,
      isRtl: isAr,
    }, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'staff.pdf'; a.click()
      URL.revokeObjectURL(url)
      }).catch(() => window.alert(isAr ? 'فشل التصدير' : 'Export failed'))
  }}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: 'pointer' }}>
    📄 {t.exportPdf || 'Export PDF'}
  </button>
  <button onClick={() => {
    const rows = filtered.map(s => [
      s.fullName,
      s.phone || '—',
      s.email || '—',
      (isAr ? s.roleNameAr : s.roleNameEn) || s.roleName || '—',
      s.departmentName || '—',
      contractLabel(s.contractType) || '—',
      s.salary ? `${s.salary} ${t.riyal}` : '—',
      s.yearsInClinic || '—',
      s.jobTitle || '—',
    ])
    api.post('/export/excel', {
      title: t.title,
      columns: columnDefs.map(c => c.label),
      rows,
      isRtl: isAr,
    }, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'staff.xlsx'; a.click()
      URL.revokeObjectURL(url)
   }).catch(() => window.alert(isAr ? 'فشل التصدير' : 'Export failed'))
  }}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: 'pointer' }}>
    📊 {t.exportExcel || 'Export Excel'}
  </button>
  <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
</div>

        {/* إحصائيات */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {[
              { icon:'👥', label:t.total, val:stats.total, color:TEXT_DARK },
              { icon:'✅', label:t.active, val:stats.active, color:SUCCESS },
              { icon:'❌', label:t.inactive, val:stats.inactive, color:DANGER },
              { icon:'💰', label:t.totalSalary, val:`${stats.totalSalary?.toFixed(2)} ${t.riyal}`, color:PRIMARY },
            ].map((s,i)=>(
              <div key={i} style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:16, padding:18 }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                <p style={{ fontSize:20, fontWeight:700, color:s.color, margin:0 }}>{s.val}</p>
                <p style={{ fontSize:11, color:TEXT_MUTED, margin:'4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* توزيع حسب الدور */}
        {stats?.byRole?.length > 0 && (
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
            {stats.byRole.map((r:any,i:number)=>(
              <div key={i} style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:12, padding:'8px 16px', display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:700, color:PRIMARY }}>{((isAr ? r.roleNameAr : r.roleNameEn) || r.roleName || "—")}</span>
                <span style={{ fontSize:11, color:TEXT_MUTED }}>{r.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* فلترة */}
        <div style={{ background:CARD_BG, border:`1px solid ${BORDER}`, borderRadius:14, padding:'12px 16px', marginBottom:20, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}
            style={{ ...inp, maxWidth:200 }} />
          <div style={{ maxWidth:170 }}>
            {/* ✅ يفلتر حسب الدور الحقيقي من جدول Roles، بنفس قائمة الأدوار المستخدمة بالفورم */}
            <SearchableSelect isRtl={isAr} value={filterRole} onChange={setFilterRole}
              placeholder={t.allRoles}
              options={systemRoles.map(r=>({value:r.id, label:systemRoleLabel(r)}))} />
          </div>
          <div style={{ maxWidth:150 }}>
            <SearchableSelect isRtl={isAr} value={filterActive} onChange={setFilterActive}
              placeholder={t.allStatus}
              options={[{value:'active',label:t.active},{value:'inactive',label:t.inactive}]} />
          </div>
          {(search||filterRole||filterActive) && (
            <button onClick={()=>{setSearch('');setFilterRole('');setFilterActive('')}}
              style={{ padding:'8px 12px', background:'transparent', border:`1px solid ${BORDER}`, borderRadius:9, fontSize:12, cursor:'pointer', color:TEXT_MUTED }}>
              ✕
            </button>
          )}
          <span style={{ fontSize:12, color:TEXT_MUTED, marginRight:'auto' }}>{filtered.length} {isAr?'موظف':'staff'}</span>
        </div>

        {/* بطاقات الموظفين */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:TEXT_MUTED }}>{t.loading}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:TEXT_MUTED }}>
            <span style={{ fontSize:48, opacity:0.4 }}>👥</span>
            <p style={{ fontSize:14, marginTop:12 }}>{t.noData}</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {filtered.map(s=>(
              <div key={s.id} className="staff-card"
                style={{ background:CARD_BG, border:`1px solid ${s.isActive?BORDER:DANGER+'40'}`, borderRadius:18, padding:20,
                  opacity:s.isActive?1:0.7 }}
                onClick={()=>setSelected(s)}>
                {/* Header البطاقة */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:46, height:46, borderRadius:14, background:PRIMARY_SOFT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                      {s.gender==='female'?'👩':'👨'}
                    </div>
                    <div>
                      <p style={{ fontSize:15, fontWeight:700, color:TEXT_DARK, margin:0 }}>{s.fullName}</p>
                      <p style={{ fontSize:12, color:PRIMARY, margin:'2px 0 0', fontWeight:600 }}>{s.jobTitle}</p>
                    </div>
                  </div>
                  <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600,
                    background:s.isActive?SUCCESS_BG:DANGER_BG, color:s.isActive?SUCCESS:DANGER }}>
                    {s.isActive?t.active:t.inactive}
                  </span>
                </div>

                {/* تفاصيل */}
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {s.role && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:TEXT_MUTED }}>
                      <span>🏷️</span> {((isAr ? s.roleNameAr : s.roleNameEn) || s.roleName || "—")} — {contractLabel(s.contractType)}
                    </div>
                  )}
                  {s.phone && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:TEXT_MUTED }}>
                      <span>📱</span> {s.phone}
                    </div>
                  )}
                  {s.departmentName && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:TEXT_MUTED }}>
                      <span>🏥</span> {s.departmentName}
                    </div>
                  )}
                  {s.yearsInClinic && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:TEXT_MUTED }}>
                      <span>📅</span> {s.yearsInClinic} {isAr?'سنة':'yr'} {t.yearsInClinic}
                    </div>
                  )}
                </div>

                {/* أزرار */}
                <div style={{ display:'flex', gap:8 }} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>openEdit(s)}
                    style={{ flex:1, padding:'7px', border:`1px solid ${PRIMARY}`, borderRadius:9, background:'transparent', color:PRIMARY, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    ✏️ {t.edit}
                  </button>
                  <button onClick={()=>handleToggle(s.id)}
                    style={{ padding:'7px 12px', border:`1px solid ${s.isActive?DANGER:SUCCESS}`, borderRadius:9, background:'transparent', color:s.isActive?DANGER:SUCCESS, fontSize:12, cursor:'pointer' }}>
                    {s.isActive?'⏸':'▶'}
                  </button>
                  <button onClick={()=>handleDelete(s.id)}
                    style={{ padding:'7px 12px', border:`1px solid ${DANGER}`, borderRadius:9, background:'transparent', color:DANGER, fontSize:12, cursor:'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ نموذج الإضافة/التعديل ════ */}
        {showForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9998 }}
            onClick={()=>setShowForm(false)}>
            <div style={{ background:CARD_BG, borderRadius:20, padding:28, width:600, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', direction:t.dir }}
              onClick={e=>e.stopPropagation()}>
              <h3 style={{ fontSize:17, fontWeight:700, color:TEXT_DARK, margin:'0 0 20px' }}>
                {editId ? `✏️ ${t.edit}` : `+ ${t.add}`}
              </h3>

              {/* تبويبات النموذج */}
              <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {(['personal','contact','work'] as const).map(tab=>(
                  <button key={tab} className={`tab-btn${formTab===tab?' active':''}`} onClick={()=>setFormTab(tab)}>
                    {tab==='personal'?t.tabPersonal:tab==='contact'?t.tabContact:t.tabWork}
                  </button>
                ))}
              </div>

              {/* تبويب البيانات الشخصية */}
              {formTab==='personal' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {fld(t.fullName+' *', <input className="form-inp" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} />)}
                  {fld(t.fullNameEn, <input className="form-inp" value={form.fullNameEn} onChange={e=>setForm({...form,fullNameEn:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                  {fld(t.gender, (
                    <SearchableSelect isRtl={isAr} value={form.gender} onChange={v=>setForm({...form,gender:v})}
                      placeholder={t.selectPlaceholder}
                      options={[{value:'male',label:t.male},{value:'female',label:t.female}]} />
                  ))}
                  {fld(t.dob, <input type="date" className="form-inp" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                  {fld(t.nationalId, <input className="form-inp" value={form.nationalId} onChange={e=>setForm({...form,nationalId:e.target.value})} />)}
                  {fld(t.nationality, <input className="form-inp" value={form.nationality} onChange={e=>setForm({...form,nationality:e.target.value})} />)}
                  {fld(t.maritalStatus, (
                    <SearchableSelect isRtl={isAr} value={form.maritalStatus} onChange={v=>setForm({...form,maritalStatus:v})}
                      placeholder={t.selectPlaceholder}
                      options={[
                        {value:'single',label:t.single},{value:'married',label:t.married},
                        {value:'divorced',label:t.divorced},{value:'widowed',label:t.widowed},
                      ]} />
                  ))}
                  {fld(t.bloodType, (
                    <SearchableSelect isRtl={isAr} value={form.bloodType} onChange={v=>setForm({...form,bloodType:v})}
                      placeholder={t.selectPlaceholder}
                      options={bloodTypes.map(b=>({value:b,label:b}))} />
                  ))}
                </div>
              )}

              {/* تبويب التواصل */}
              {formTab==='contact' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {fld(t.phone, <input className="form-inp" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                  {fld(t.phone2, <input className="form-inp" value={form.phone2} onChange={e=>setForm({...form,phone2:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                  {fld(t.email, <input type="email" className="form-inp" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                  {fld(t.address, <input className="form-inp" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} />)}
                  {fld(t.emergencyContact, <input className="form-inp" value={form.emergencyContact} onChange={e=>setForm({...form,emergencyContact:e.target.value})} />)}
                  {fld(t.emergencyPhone, <input className="form-inp" value={form.emergencyPhone} onChange={e=>setForm({...form,emergencyPhone:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                </div>
              )}

              {/* تبويب العمل */}
              {formTab==='work' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {fld(t.jobTitle, <input className="form-inp" value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} />)}
                  {/* ✅ الدور — بالضبط زي حقل القسم: قائمة اختيار حقيقية من جدول Roles بقاعدة البيانات */}
                  {fld(t.role, (
                    <SearchableSelect isRtl={isAr} value={form.roleId} onChange={v=>setForm({...form,roleId:v})}
                      placeholder={isAr?'اختر دوراً...':'Select role...'}
                      searchPlaceholder={t.search}
                      loading={systemRolesLoading}
                      emptyText={isAr?'لا توجد أدوار — أنشئها أولاً من إعدادات العيادة':'No roles found — create some in clinic settings first'}
                      options={systemRoles.map(r=>({value:r.id, label:systemRoleLabel(r)}))} />
                  ))}
                  {fld(t.department, (
                    <SearchableSelect isRtl={isAr} value={form.departmentId} onChange={v=>setForm({...form,departmentId:v})}
                      placeholder={isAr?'اختر قسماً...':'Select department...'}
                      searchPlaceholder={t.search}
                      options={departments.map(d=>({value:d.id,label:d.name}))} />
                  ))}
                  {fld(t.contractType, (
                    <SearchableSelect isRtl={isAr} value={form.contractType} onChange={v=>setForm({...form,contractType:v})}
                      options={CONTRACT_VALS.map((v,i)=>({value:v,label:t.contracts[i]}))} />
                  ))}
                  {fld(t.joinDate, <input type="date" className="form-inp" value={form.joinDate} onChange={e=>setForm({...form,joinDate:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                  {fld(t.endDate, <input type="date" className="form-inp" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                  {fld(`${t.salary} (${t.riyal})`, <input type="number" className="form-inp" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                  {fld(t.workingHours, <input className="form-inp" value={form.workingHours} onChange={e=>setForm({...form,workingHours:e.target.value})} placeholder={isAr?'مثال: 8-16':'e.g. 8am-4pm'} />)}
                  {fld(t.specialization, <input className="form-inp" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} />)}
                  <div style={{ gridColumn:'1/-1' }}>
                    {fld(t.qualifications, <textarea className="form-inp" value={form.qualifications} onChange={e=>setForm({...form,qualifications:e.target.value})} rows={2} style={{resize:'none'}} />)}
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    {fld(t.notes, <textarea className="form-inp" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} style={{resize:'none'}} />)}
                  </div>

                  {/* ════ هل طبيب؟ ════ */}
                  <div style={{ gridColumn:'1/-1', background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:12, padding:14 }}>
                    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, fontWeight:700, color:TEXT_DARK }}>
                      <input type="checkbox" checked={form.isDoctor}
                        onChange={e=>{
                          const checked = e.target.checked
                          setForm({...form, isDoctor:checked, doctorMode: checked ? form.doctorMode : 'auto', doctorId: checked ? form.doctorId : ''})
                          if (checked && form.doctorMode==='existing' && availableDoctors.length===0) fetchAvailableDoctors()
                        }}
                        style={{ width:16, height:16, accentColor:PRIMARY }} />
                      🩺 {t.isDoctor}
                    </label>

                    {form.isDoctor && (
                      <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                        <div style={{ display:'flex', gap:16 }}>
                          {(['auto','existing'] as const).map(mode=>(
                            <label key={mode} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:TEXT_DARK, cursor:'pointer' }}>
                              <input type="radio" name="doctorMode" checked={form.doctorMode===mode}
                                onChange={()=>{
                                  setForm({...form, doctorMode:mode})
                                  if (mode==='existing' && availableDoctors.length===0) fetchAvailableDoctors()
                                }}
                                style={{ accentColor:PRIMARY }} />
                              {mode==='auto' ? t.doctorModeAuto : t.doctorModeExisting}
                            </label>
                          ))}
                        </div>

                        {form.doctorMode==='auto' ? (
                          fld(t.doctorWorkType, (
                            <SearchableSelect isRtl={isAr} value={form.doctorWorkType} onChange={v=>setForm({...form,doctorWorkType:v})}
                              options={[{value:'appointments',label:t.workAppointments},{value:'both',label:t.workBoth}]} />
                          ))
                        ) : (
                          fld(t.selectDoctor, (
                            <SearchableSelect
                              isRtl={isAr}
                              value={form.doctorId}
                              onChange={v=>setForm({...form,doctorId:v})}
                              loading={doctorsLoading}
                              placeholder={t.selectDoctor}
                              searchPlaceholder={t.searchDoctor}
                              emptyText={t.noDoctorsAvailable}
                              options={availableDoctors.map(d=>({
                                value:d.id,
                                label: d.specialty ? `${d.fullName} — ${d.specialty}` : d.fullName,
                                disabled: !d.isAvailable,
                                hint: !d.isAvailable && d.linkedStaffName ? `${t.linkedTo} ${d.linkedStaffName}` : undefined,
                              }))}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* ════ حساب دخول ════ */}
                  {currentUserId ? (
                    <div style={{ gridColumn:'1/-1', background:SUCCESS_BG, border:`1px solid ${SUCCESS}40`, borderRadius:12, padding:12, fontSize:12.5, color:SUCCESS, fontWeight:600 }}>
                      ✅ {t.alreadyLinkedUser}
                    </div>
                  ) : !editId && (
                    <div style={{ gridColumn:'1/-1', background:PRIMARY_SOFT, border:`1px solid ${BORDER}`, borderRadius:12, padding:14 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, fontWeight:700, color:TEXT_DARK }}>
                        <input type="checkbox" checked={form.createLoginAccount}
                          onChange={e=>setForm({...form, createLoginAccount:e.target.checked})}
                          style={{ width:16, height:16, accentColor:PRIMARY }} />
                        🔐 {t.createLogin}
                      </label>

                      {form.createLoginAccount && (
                        <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                          {fld(t.loginUsername+' *', (
                            <input className="form-inp" value={form.loginUsername}
                              onChange={e=>setForm({...form, loginUsername:e.target.value.replace(/[^a-zA-Z0-9]/g,'')})}
                              placeholder={isAr?'أحرف إنجليزية وأرقام فقط':'English letters & numbers only'}
                              style={{fontFamily:'Inter,sans-serif'}} />
                          ))}
                          {fld(t.loginEmail, (
                            <input type="email" readOnly value={form.loginUsername ? `${form.loginUsername}@CURA.COM` : ''}
                              style={{ width:'100%', padding:'9px 12px', border:`1px solid ${BORDER}`, borderRadius:10, fontSize:13, fontFamily:'Inter,sans-serif', background:'#F5F7F7', color:TEXT_MUTED, cursor:'not-allowed' }} />
                          ))}
                          <div style={{ gridColumn:'1/-1', marginTop:-8 }}>
                            <span style={{ fontSize:10.5, color:TEXT_MUTED, fontStyle:'italic' }}>
                              📧 {isAr?'يُنشأ تلقائياً من اسم المستخدم':'Auto-generated from username'}
                            </span>
                          </div>
                          <div style={{ gridColumn:'1/-1' }}>
                            {fld(t.loginPassword+' *', <input type="password" className="form-inp" value={form.loginPassword} onChange={e=>setForm({...form,loginPassword:e.target.value})} style={{fontFamily:'Inter,sans-serif'}} />)}
                          </div>
                          {/* ✅ ما فيه اختيار دور مكرر — الحساب ياخذ نفس دور الموظف المختار بتبويب العمل */}
                          <div style={{ gridColumn:'1/-1', fontSize:11.5, color:TEXT_MUTED, background:CARD_BG, border:`1px dashed ${BORDER}`, borderRadius:9, padding:'8px 10px' }}>
                            🔗 {isAr ? 'دور الحساب: ' : 'Account role: '}
                            <strong style={{ color:TEXT_DARK }}>
                              {systemRoles.find(r=>r.id===form.roleId) ? systemRoleLabel(systemRoles.find(r=>r.id===form.roleId)!) : (isAr?'اختر الدور من تبويب العمل أولاً':'Select the role in the Work tab first')}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button onClick={handleSave} disabled={savingStaff}
                  style={{ flex:1, padding:'10px', background:PRIMARY, color:'#FFF', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor: savingStaff ? 'not-allowed' : 'pointer', opacity: savingStaff ? 0.7 : 1 }}>
                  {savingStaff ? '⏳ ...' : `💾 ${t.save}`}
                </button>
                <button onClick={()=>setShowForm(false)} disabled={savingStaff}
                  style={{ padding:'10px 20px', background:'transparent', border:`1px solid ${BORDER}`, borderRadius:10, fontSize:13, cursor:'pointer', color:TEXT_MUTED }}>
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ نافذة تفاصيل الموظف ════ */}
        {selected && !showForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9997 }}
            onClick={()=>setSelected(null)}>
            <div style={{ background:CARD_BG, borderRadius:20, padding:28, width:520, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', direction:t.dir }}
              onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:PRIMARY_SOFT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                    {selected.gender==='female'?'👩':'👨'}
                  </div>
                  <div>
                    <h3 style={{ fontSize:18, fontWeight:700, color:TEXT_DARK, margin:0 }}>{selected.fullName}</h3>
                    <p style={{ fontSize:13, color:PRIMARY, margin:'3px 0 0', fontWeight:600 }}>{selected.jobTitle}</p>
                    {selected.fullNameEn && <p style={{ fontSize:11, color:TEXT_MUTED, margin:'2px 0 0', fontFamily:'Inter,sans-serif' }}>{selected.fullNameEn}</p>}
                  </div>
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:TEXT_MUTED }}>✕</button>
              </div>

              {/* بيانات مجمّعة */}
              {[
                [t.gender,    selected.gender==='male'?t.male:selected.gender==='female'?t.female:'—'],
                [t.dob,       selected.dateOfBirth||'—'],
                [t.age,       selected.age ? `${selected.age} ${isAr?'سنة':'yr'}` : '—'],
                [t.nationalId, selected.nationalId||'—'],
                [t.nationality, selected.nationality||'—'],
                [t.maritalStatus, selected.maritalStatus||'—'],
                [t.bloodType,  selected.bloodType||'—'],
                [t.phone,      selected.phone||'—'],
                [t.phone2,     selected.phone2||'—'],
                [t.email,      selected.email||'—'],
                [t.address,    selected.address||'—'],
                [t.emergencyContact, selected.emergencyContact||'—'],
                [t.emergencyPhone,   selected.emergencyPhone||'—'],
                [t.role,       (isAr ? selected.roleNameAr : selected.roleNameEn) || selected.roleName || '—'],
                [t.contractType, contractLabel(selected.contractType)||'—'],
                [t.department, selected.departmentName||'—'],
                [t.joinDate,   selected.joinDate||'—'],
                [t.salary,     selected.salary ? `${selected.salary} ${t.riyal}` : '—'],
                [t.workingHours, selected.workingHours||'—'],
                [t.yearsInClinic, selected.yearsInClinic ? `${selected.yearsInClinic} ${isAr?'سنة':'yr'}` : '—'],
                [t.qualifications, selected.qualifications||'—'],
                [t.notes,      selected.notes||'—'],
              ].map(([label,val],i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${BORDER}` }}>
                  <span style={{ fontSize:12, color:TEXT_MUTED, fontWeight:600 }}>{label}</span>
                  <span style={{ fontSize:13, color:TEXT_DARK, maxWidth:'60%', textAlign:isAr?'left':'right', wordBreak:'break-word' }}>{val}</span>
                </div>
              ))}

          {/* ✅ أزرار الطباعة والتصدير والأعمدة */}
<div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }} className="no-print">
  <button onClick={() => window.print()}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 12px', fontSize: 11, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
    🖨️
  </button>
  <button onClick={() => {
    const rowData = [
      selected.fullName,
      selected.phone || '—',
      selected.email || '—',
      (isAr ? selected.roleNameAr : selected.roleNameEn) || selected.roleName || '—',
      selected.departmentName || '—',
      contractLabel(selected.contractType) || '—',
      selected.salary ? `${selected.salary} ${t.riyal}` : '—',
      selected.yearsInClinic || '—',
      selected.jobTitle || '—',
    ]
    api.post('/export/pdf', {
      title: `${t.title} - ${selected.fullName}`,
      columns: columnDefs.map(c => c.label),
      rows: [rowData],
      isRtl: isAr,
    }, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = `staff-${selected.fullName}.pdf`; a.click()
      URL.revokeObjectURL(url)
    }).catch(() => window.alert(isAr ? 'فشل التصدير' : 'Export failed'))
  }}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 12px', fontSize: 11, fontWeight: 600, color: TEXT_DARK, cursor: 'pointer' }}>
    📄
  </button>
  <button onClick={() => {
    const rowData = [
      selected.fullName,
      selected.phone || '—',
      selected.email || '—',
      (isAr ? selected.roleNameAr : selected.roleNameEn) || selected.roleName || '—',
      selected.departmentName || '—',
      contractLabel(selected.contractType) || '—',
      selected.salary ? `${selected.salary} ${t.riyal}` : '—',
      selected.yearsInClinic || '—',
      selected.jobTitle || '—',
    ]
    api.post('/export/excel', {
      title: `${t.title} - ${selected.fullName}`,
      columns: columnDefs.map(c => c.label),
      rows: [rowData],
      isRtl: isAr,
    }, { responseType: 'blob' }).then(r => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = `staff-${selected.fullName}.xlsx`; a.click()
      URL.revokeObjectURL(url)
    }).catch(() => window.alert(isAr ? 'فشل التصدير' : 'Export failed'))
  }}
    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 12px', fontSize: 11, fontWeight: 600, color: TEXT_DARK, cursor: 'pointer' }}>
    📊
  </button>
  
  {/* ✅ زر الأعمدة */}
  <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
</div>

<div style={{ display:'flex', gap:10, marginTop:20 }}>
  <button onClick={()=>openEdit(selected)}
                  style={{ flex:1, padding:'9px', border:`1px solid ${PRIMARY}`, borderRadius:10, background:'transparent', color:PRIMARY, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  ✏️ {t.edit}
                </button>
                <button onClick={()=>handleToggle(selected.id)}
                  style={{ padding:'9px 16px', border:`1px solid ${selected.isActive?DANGER:SUCCESS}`, borderRadius:10, background:'transparent', color:selected.isActive?DANGER:SUCCESS, fontSize:13, cursor:'pointer' }}>
                  {selected.isActive?'⏸':'▶'}
                </button>
                <button onClick={()=>handleDelete(selected.id)}
                  style={{ padding:'9px 16px', border:`1px solid ${DANGER}`, borderRadius:10, background:'transparent', color:DANGER, fontSize:13, cursor:'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
   </div>
  </>
)
}