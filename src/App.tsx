import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'
import AddPatient from './pages/AddPatient'
import AddDoctor from './pages/AddDoctor'
import AddAppointment from './pages/AddAppointment'
import PatientDetail from './pages/PatientDetail'
import EditPatient from './pages/EditPatient'
import EditDoctor from './pages/EditDoctor'
import EditAppointment from './pages/EditAppointment'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import QuickVisit from './pages/QuickVisit'
import Schedules from './pages/Schedules'
import Settings from './pages/Settings'
import AddUser from './pages/AddUser'
import Users from './pages/Users'
import Departments from './pages/Departments'
import ClinicPermissions from './pages/ClinicPermissions'
import Reports from './pages/Reports'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import SuperAdminClinics from './pages/SuperAdmin/Clinics'
import SuperAdminPlans from './pages/SuperAdmin/Plans'
import Queue from './pages/Queue'
import AppointmentDetail from './pages/AppointmentDetail'
import PatientVisitNotes from './pages/PatientVisitNotes'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* ── عام ── */}
        <Route path="/login" element={<Login />} />

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
          <ProtectedRoute permission="schedules.view">
            <Layout><Schedules /></Layout>
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
          <ProtectedRoute>
            <Layout><SuperAdminClinics /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/superadmin/plans" element={
          <ProtectedRoute>
            <Layout><SuperAdminPlans /></Layout>
          </ProtectedRoute>
        } />

        {/* ── قائمة الانتظار ── */}
        <Route path="/queue" element={
          <ProtectedRoute>
            <Layout><Queue /></Layout>
          </ProtectedRoute>
        } />

        {/* ── Redirects ── */}
<Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* ✅ PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  )
}

export default App