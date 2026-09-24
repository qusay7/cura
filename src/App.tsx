import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { LoadingScreen } from './components/LoadingScreen'

// ✅ Code splitting — كل صفحة أصبحت ملفاً منفصلاً يُحمَّل فقط عند زيارتها فعلياً،
// بدل تحميل كود كل صفحات النظام (30+ صفحة) دفعة واحدة حتى لزائر لم يسجّل دخول بعد
const Login               = lazy(() => import('./pages/Login'))
const Dashboard           = lazy(() => import('./pages/Dashboard'))
const Patients            = lazy(() => import('./pages/Patients'))
const Doctors             = lazy(() => import('./pages/Doctors'))
const Appointments        = lazy(() => import('./pages/Appointments'))
const AddPatient          = lazy(() => import('./pages/AddPatient'))
const AddDoctor           = lazy(() => import('./pages/AddDoctor'))
const AddAppointment      = lazy(() => import('./pages/AddAppointment'))
const PatientDetail       = lazy(() => import('./pages/PatientDetail'))
const EditPatient         = lazy(() => import('./pages/EditPatient'))
const EditDoctor          = lazy(() => import('./pages/EditDoctor'))
const EditAppointment     = lazy(() => import('./pages/EditAppointment'))
const QuickVisit          = lazy(() => import('./pages/QuickVisit'))
const Schedules           = lazy(() => import('./pages/Schedules'))
const Settings            = lazy(() => import('./pages/Settings'))
const AddUser             = lazy(() => import('./pages/AddUser'))
const Users               = lazy(() => import('./pages/Users'))
const Departments         = lazy(() => import('./pages/Departments'))
const TreatmentTemplates  = lazy(() => import('./pages/TreatmentTemplates'))
const ClinicPermissions   = lazy(() => import('./pages/ClinicPermissions'))
const Reports             = lazy(() => import('./pages/Reports'))
const SuperAdminClinics   = lazy(() => import('./pages/SuperAdmin/Clinics'))
const SuperAdminPlans     = lazy(() => import('./pages/SuperAdmin/Plans'))
const Queue               = lazy(() => import('./pages/Queue'))
const AppointmentDetail   = lazy(() => import('./pages/AppointmentDetail'))
const PatientVisitNotes   = lazy(() => import('./pages/PatientVisitNotes'))
const LandingPage         = lazy(() => import('./pages/LandingPage'))
const Insurance           = lazy(() => import('./pages/Insurance'))
const Payments            = lazy(() => import('./pages/Payments'))
const Staff               = lazy(() => import('./pages/Staff'))
const Settlements         = lazy(() => import('./pages/Settlements'))
const DoctorDaily         = lazy(() => import('./pages/DoctorDaily'))
const VisitWorkspace      = lazy(() => import('./pages/VisitWorkspace'))
const Invoices            = lazy(() => import('./pages/Invoices'))
const DoctorCalendar      = lazy(() => import('./pages/DoctorCalendar'))
// ✅ يزامن <html lang>/dir مع اللغة الفعلية — كانت تتغيّر ترجمة النصوص فقط
// بدون خصائص المستند نفسها، فتقرأ تقنيات المساعدة (قارئ الشاشة) لغة خاطئة
const applyDocumentLang = (lang: 'ar' | 'en') => {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

// ✅ الـ PWA يفتح دومًا على start_url ("/"). إذا كانت عيادة محفوظة ولا يوجد
// تسجيل دخول فعّال، اذهب مباشرة لواجهة تسجيل الدخول الخاصة بها بدل الصفحة الرئيسية
function RootRoute() {
  const hasToken = !!localStorage.getItem('_auth_tokens')
  const savedSubdomain = localStorage.getItem('clinicSubdomain')

  if (!hasToken && savedSubdomain) {
    return <Navigate to={`/login/${savedSubdomain}`} replace />
  }
  return <LandingPage />
}

function App() {
  useEffect(() => {
    const stored = (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'
    applyDocumentLang(stored)

    const onLangChange = (e: Event) => applyDocumentLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', onLangChange)
    return () => window.removeEventListener('cura-lang-change', onLangChange)
  }, [])

  return (
    <>
      <Suspense fallback={<LoadingScreen fullScreen />}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        {/* ── عام ── */}
       <Route path="/login/:subdomain?" element={<Login />} />

        {/* ── Dashboard ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />

        {/* ── المرضى ── */}
        <Route path="/patients" element={
          <ProtectedRoute permission="patients.view">
            <Layout><Patients /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/patients/add" element={
          <ProtectedRoute permission="patients.create">
            <Layout><AddPatient /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/patients/:id" element={
          <ProtectedRoute permission="patients.view">
            <Layout><PatientDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/patients/:id/edit" element={
          <ProtectedRoute permission="patients.edit">
            <Layout><EditPatient /></Layout>
          </ProtectedRoute>
        } />
        {/* ── سجل زيارات المريض ── */}
        <Route path="/patients/:patientId/visit-notes" element={
          <ProtectedRoute permission="patients.view">
            <Layout><PatientVisitNotes /></Layout>
          </ProtectedRoute>
        } />

        {/* ── الأطباء ── */}
        <Route path="/doctors" element={
          <ProtectedRoute permission="doctors.view">
            <Layout><Doctors /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/doctors/add" element={
          <ProtectedRoute permission="doctors.create">
            <Layout><AddDoctor /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/doctors/:id/edit" element={
          <ProtectedRoute permission="doctors.edit">
            <Layout><EditDoctor /></Layout>
          </ProtectedRoute>
        } />

        {/* ── المواعيد ── */}
        <Route path="/appointments" element={
          <ProtectedRoute permission="appointments.view">
            <Layout><Appointments /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/appointments/add" element={
          <ProtectedRoute permission="appointments.create">
            <Layout><AddAppointment /></Layout>
          </ProtectedRoute>
        } />
        {/* ✅ تفاصيل الموعد — قبل edit */}
        <Route path="/appointments/:id" element={
          <ProtectedRoute permission="appointments.view">
            <Layout><AppointmentDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/appointments/:id/edit" element={
          <ProtectedRoute permission="appointments.edit">
            <Layout><EditAppointment /></Layout>
          </ProtectedRoute>
        } />

        {/* ── الجداول ── */}
        <Route path="/schedules" element={
          <ProtectedRoute permission="schedules.clinic.view">
            <Layout><Schedules /></Layout>
          </ProtectedRoute>
        } />

        {/* ── تقويم الطبيب ── */}
<Route path="/doctor-calendar" element={
  <ProtectedRoute permission="appointments.view">
    <Layout><DoctorCalendar /></Layout>
  </ProtectedRoute>
} />

        {/* ── الزيارة السريعة ── */}
        <Route path="/quick-visit" element={
          <ProtectedRoute>
            <Layout><QuickVisit /></Layout>
          </ProtectedRoute>
        } />

        {/* ── المستخدمون ── */}
        <Route path="/users" element={
          <ProtectedRoute permission="users.view">
            <Layout><Users /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/users/add" element={
          <ProtectedRoute permission="users.create">
            <Layout><AddUser /></Layout>
          </ProtectedRoute>
        } />

        {/* ── الأقسام ── */}
        <Route path="/departments" element={
          <ProtectedRoute permission="departments.manage">
            <Layout><Departments /></Layout>
          </ProtectedRoute>
        } />

        {/* ── قوالب الزيارة ── */}
        <Route path="/treatment-templates" element={
          <ProtectedRoute permission="departments.manage">
            <Layout><TreatmentTemplates /></Layout>
          </ProtectedRoute>
        } />

        {/* ── التقارير ── */}
        <Route path="/reports" element={
          <ProtectedRoute permission="reports.view">
            <Layout><Reports /></Layout>
          </ProtectedRoute>
        } />

        {/* ── الصلاحيات ── */}
        <Route path="/permissions" element={
          <ProtectedRoute permission="settings.view">
            <Layout><ClinicPermissions /></Layout>
          </ProtectedRoute>
        } />

        {/* ── الإعدادات ── */}
        <Route path="/settings" element={
          <ProtectedRoute permission="settings.view">
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />

        {/* ── SuperAdmin ── */}
        <Route path="/superadmin/clinics" element={
          <ProtectedRoute role="SuperAdmin">
            <Layout><SuperAdminClinics /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/superadmin/plans" element={
          <ProtectedRoute role="SuperAdmin">
            <Layout><SuperAdminPlans /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/invoices" element={
          <ProtectedRoute permission="payments.view">
            <Layout><Invoices /></Layout>
          </ProtectedRoute>
        } />
        
        {/* ── قائمة الانتظار ── */}
        <Route path="/queue" element={
          <ProtectedRoute>
            <Layout><Queue /></Layout>
          </ProtectedRoute>
        } />
          
        <Route path="/insurance" element={
          <ProtectedRoute>
            <Layout><Insurance /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/payments" element={
          <ProtectedRoute>
            <Layout><Payments /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/staff" element={
          <ProtectedRoute>
            <Layout><Staff /></Layout>
          </ProtectedRoute>
        } />

        {/* ── التسويات المالية ── */}
        <Route path="/settlements" element={
          <ProtectedRoute permission="reports.view">
            <Layout><Settlements /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/daily" element={
          <ProtectedRoute>
            <Layout><DoctorDaily /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/visit/:appointmentId" element={
            <ProtectedRoute><Layout><VisitWorkspace /></Layout>
            </ProtectedRoute>
            } />

        {/* ── Redirects ── */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Suspense>
      {/* ✅ PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  )
}
export default App