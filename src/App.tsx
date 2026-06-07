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
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* صفحة عامة */}
      <Route path="/login" element={<Login />} />

      {/* صفحات محمية */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/patients" element={
        <ProtectedRoute>
          <Layout><Patients /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/patients/add" element={
        <ProtectedRoute>
          <Layout><AddPatient /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/patients/:id" element={
        <ProtectedRoute>
          <Layout><PatientDetail /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/doctors" element={
        <ProtectedRoute>
          <Layout><Doctors /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/doctors/add" element={
        <ProtectedRoute>
          <Layout><AddDoctor /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute>
          <Layout><Appointments /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/appointments/add" element={
        <ProtectedRoute>
          <Layout><AddAppointment /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App