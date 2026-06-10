import { useState, useEffect } from 'react'
 import api from '../api/axios'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

// ─── Global CSS with Comfortable Colors ──────────────────────────────────────
const globalCss = `
@keyframes fade-up { 
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes soft-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.schedules-shell { animation: fade-up 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both; }

/* Tabs Styles */
.tabs-container {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
  background: #FFFFFF;
  padding: 6px;
  border-radius: 20px;
  border: 1px solid #DCE5E5;
  width: fit-content;
}

.tab-btn {
  padding: 10px 28px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn.active {
  background: linear-gradient(135deg, #5B8C8F 0%, #4A7679 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(91, 140, 143, 0.2);
}

.tab-btn:not(.active) {
  color: #6B8A8C;
}

.tab-btn:not(.active):hover {
  background: #E8F0F0;
  color: #5B8C8F;
}

/* Form Styles */
.form-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid #DCE5E5;
  padding: 24px;
  margin-bottom: 24px;
  animation: slide-in 0.3s ease;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #2C3E3F;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E8F0F0;
  display: inline-block;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B8A8C;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input, .form-select {
  padding: 10px 14px;
  border: 1px solid #DCE5E5;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  color: #2C3E3F;
  background: #FFFFFF;
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #5B8C8F;
  box-shadow: 0 0 0 3px rgba(91, 140, 143, 0.1);
}

/* Table Styles */
.table-container {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid #DCE5E5;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.schedules-table {
  width: 100%;
  border-collapse: collapse;
}

.schedules-table th {
  padding: 14px 16px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: #6B8A8C;
  background: #F8FAFA;
  border-bottom: 1px solid #DCE5E5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.schedules-table td {
  padding: 14px 16px;
  font-size: 13px;
  color: #2C3E3F;
  border-bottom: 1px solid #DCE5E5;
}

.schedules-table tr:last-child td {
  border-bottom: none;
}

.schedules-table tr:hover td {
  background: #F8FAFA;
}

/* Action Buttons */
.action-btn {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  background: transparent;
}

.btn-delete {
  color: #C4A77D;
  border-color: #C4A77D40;
}

.btn-delete:hover {
  background: #C4A77D;
  color: white;
  border-color: #C4A77D;
}

.btn-primary {
  background: #5B8C8F;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
  background: #4A7679;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(91, 140, 143, 0.2);
}

.btn-secondary {
  background: #F8FAFA;
  color: #6B8A8C;
  border: 1px solid #DCE5E5;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #E8F0F0;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #C4A77D;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  color: #b41e32;
}

/* Alert Messages */
.alert-success {
  background: #E8F0F0;
  border: 1px solid #5B8C8F;
  border-radius: 12px;
  padding: 12px 16px;
  color: #2C3E3F;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-error {
  background: #FDF5F5;
  border: 1px solid #C4A77D;
  border-radius: 12px;
  padding: 12px 16px;
  color: #C4A77D;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Doctor Select */
.doctor-select {
  max-width: 350px;
  margin-bottom: 24px;
}

.doctor-select label {
  font-size: 13px;
  font-weight: 600;
  color: #2C3E3F;
  margin-bottom: 8px;
  display: block;
}

/* Loading State */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6B8A8C;
}

.empty-state span {
  font-size: 48px;
  opacity: 0.5;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

/* Responsive */
@media(max-width: 768px) {
  .tabs-container {
    width: 100%;
  }
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 8px 16px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .schedules-table {
    min-width: 600px;
  }
  .table-container {
    overflow-x: auto;
  }
}
`

// Comfortable color palette
const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'

interface ClinicSchedule {
  id: string
  dayOfWeek: number
  dayName: string
  openTime: string
  closeTime: string
  isActive: boolean
}

interface DoctorSchedule {
  id: string
  doctorId: string
  doctorName: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  slotDuration: number
  firstVisitPrice: number | null
  followUpPrice: number | null
  isActive: boolean
}

interface Doctor {
  id: string
  fullName: string
  specialty?: string
  isActive: boolean
}

const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

// Loading Screen Component
const SchedulesLoadingScreen = ({ msg }: { msg: string }) => (
  <div className="loading-container">
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${PRIMARY_SOFT}`, borderTopColor: PRIMARY, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      <p style={{ color: TEXT_MUTED, marginTop: 16 }}>{msg}</p>
    </div>
  </div>
)

export default function Schedules() {
   const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [tab, setTab] = useState<'clinic' | 'doctor'>('clinic')
  const [clinicSchedules, setClinicSchedules] = useState<ClinicSchedule[]>([])
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [, setLoading] = useState(false)
  const [showClinicForm, setShowClinicForm] = useState(false)
  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Clinic Form
  const [clinicForm, setClinicForm] = useState({
    dayOfWeek: 0,
    openTime: '08:00:00',
    closeTime: '20:00:00',
  })

  // Doctor Form
  const [doctorForm, setDoctorForm] = useState({
    dayOfWeek: 0,
    startTime: '08:00:00',
    endTime: '14:00:00',
    slotDuration: 30,
    firstVisitPrice: '',
    followUpPrice: '',
  })

  // Inject global styles
  useEffect(() => {
    const styleId = 'cura-schedules-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss
      document.head.appendChild(style)
    }

    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLangChange)

    return () => window.removeEventListener('cura-lang-change', handleLangChange)
  }, [])

  // Fetch data
  useEffect(() => {
    fetchClinicSchedules()
    api.get('/doctors')
      .then(res => setDoctors(res.data.filter((d: Doctor) => d.isActive)))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedDoctor) fetchDoctorSchedules(selectedDoctor)
  }, [selectedDoctor])

  const fetchClinicSchedules = async () => {
    setLoading(true)
    try {
      const res = await api.get('/schedules/clinic')
      setClinicSchedules(res.data)
    } catch {
      setError('تعذّر جلب جدول العيادة')
    } finally {
      setLoading(false)
    }
  }

  const fetchDoctorSchedules = async (doctorId: string) => {
    if (!doctorId) return
    setLoading(true)
    try {
      const res = await api.get(`/schedules/doctor/${doctorId}`)
      setDoctorSchedules(res.data)
    } catch {
      setError('تعذّر جلب جدول الطبيب')
    } finally {
      setLoading(false)
    }
  }

  const handleAddClinicDay = async () => {
    setError('')
    try {
      await api.post('/schedules/clinic', clinicForm)
      setSuccess('تم إضافة يوم العمل بنجاح')
      setShowClinicForm(false)
      fetchClinicSchedules()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data || 'حدث خطأ')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleAddDoctorDay = async () => {
    setError('')
    try {
      const payload = {
        ...doctorForm,
        doctorId: selectedDoctor,
        firstVisitPrice: doctorForm.firstVisitPrice ? parseFloat(doctorForm.firstVisitPrice) : null,
        followUpPrice: doctorForm.followUpPrice ? parseFloat(doctorForm.followUpPrice) : null,
      }
      await api.post('/schedules/doctor', payload)
      setSuccess('تم إضافة يوم عمل الطبيب بنجاح')
      setShowDoctorForm(false)
      fetchDoctorSchedules(selectedDoctor)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data || 'حدث خطأ')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDeleteClinicDay = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا اليوم؟')) return
    try {
      await api.delete(`/schedules/clinic/${id}`)
      setSuccess('تم حذف اليوم')
      fetchClinicSchedules()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('حدث خطأ أثناء الحذف')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDeleteDoctorDay = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا اليوم؟')) return
    try {
      await api.delete(`/schedules/doctor/${id}`)
      setSuccess('تم حذف اليوم')
      fetchDoctorSchedules(selectedDoctor)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('حدث خطأ أثناء الحذف')
      setTimeout(() => setError(''), 3000)
    }
  }

  const t = {
    title: lang === 'ar' ? 'جداول الدوام' : 'Schedules',
    clinic: lang === 'ar' ? 'دوام العيادة' : 'Clinic Hours',
    doctor: lang === 'ar' ? 'دوام الأطباء' : 'Doctor Hours',
    addDay: lang === 'ar' ? '+ إضافة يوم' : '+ Add Day',
    day: lang === 'ar' ? 'اليوم' : 'Day',
    openTime: lang === 'ar' ? 'وقت الفتح' : 'Open Time',
    closeTime: lang === 'ar' ? 'وقت الإغلاق' : 'Close Time',
    startTime: lang === 'ar' ? 'من' : 'From',
    endTime: lang === 'ar' ? 'إلى' : 'To',
    slotDuration: lang === 'ar' ? 'مدة الموعد' : 'Slot Duration',
    firstVisitPrice: lang === 'ar' ? 'سعر أول زيارة' : 'First Visit Price',
    followUpPrice: lang === 'ar' ? 'سعر المتابعة' : 'Follow-up Price',
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    selectDoctor: lang === 'ar' ? 'اختر الطبيب' : 'Select Doctor',
    noData: lang === 'ar' ? 'لا توجد بيانات' : 'No data found',
    minute: lang === 'ar' ? 'دقيقة' : 'min',
    riyal: lang === 'ar' ? 'ر.س' : 'SAR',
  }

  const isAr = lang === 'ar'
  const font = isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif"

  return (
    <div className="schedules-shell" style={{ fontFamily: font, direction: isAr ? 'rtl' : 'ltr', background: '#F8FAFA', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
            borderRadius: 100, padding: '4px 16px', fontSize: 11,
            fontWeight: 600, color: PRIMARY, letterSpacing: '0.3px',
            marginBottom: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
            {lang === 'ar' ? 'إدارة الدوام' : 'Schedule Management'}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', 'Georgia', serif", fontSize: 28, fontWeight: 500, color: TEXT_DARK, margin: 0, letterSpacing: '-0.3px' }}>
            {t.title}
          </h2>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            onClick={() => setTab('clinic')}
            className={`tab-btn ${tab === 'clinic' ? 'active' : ''}`}
          >
            🏥 {t.clinic}
          </button>
          <button
            onClick={() => setTab('doctor')}
            className={`tab-btn ${tab === 'doctor' ? 'active' : ''}`}
          >
            👨‍⚕️ {t.doctor}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert-error">
            <span>{error}</span>
            <button onClick={() => setError('')} className="btn-icon">✕</button>
          </div>
        )}
        {success && (
          <div className="alert-success">
            <span>✓ {success}</span>
            <button onClick={() => setSuccess('')} className="btn-icon">✕</button>
          </div>
        )}

        {/* Clinic Tab */}
        {tab === 'clinic' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button className="btn-primary" onClick={() => setShowClinicForm(!showClinicForm)}>
                <span>+</span> {t.addDay}
              </button>
            </div>

            {showClinicForm && (
              <div className="form-card">
                <h3 className="form-title">{t.addDay}</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">{t.day}</label>
                    <select
                      value={clinicForm.dayOfWeek}
                      onChange={e => setClinicForm({ ...clinicForm, dayOfWeek: parseInt(e.target.value) })}
                      className="form-select"
                    >
                      {dayNames.map((name, i) => (
                        <option key={i} value={i}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t.openTime}</label>
                    <input
                      type="time"
                      value={clinicForm.openTime.slice(0, 5)}
                      onChange={e => setClinicForm({ ...clinicForm, openTime: e.target.value + ':00' })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t.closeTime}</label>
                    <input
                      type="time"
                      value={clinicForm.closeTime.slice(0, 5)}
                      onChange={e => setClinicForm({ ...clinicForm, closeTime: e.target.value + ':00' })}
                      className="form-input"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn-primary" onClick={handleAddClinicDay}>{t.save}</button>
                  <button className="btn-secondary" onClick={() => setShowClinicForm(false)}>{t.cancel}</button>
                </div>
              </div>
            )}

            <div className="table-container">
              <table className="schedules-table">
                <thead>
                  <tr>
                    <th>{t.day}</th>
                    <th>{t.openTime}</th>
                    <th>{t.closeTime}</th>
                    <th>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        <span>📅</span>
                        <p>{t.noData}</p>
                      </td>
                    </tr>
                  ) : (
                    clinicSchedules.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.dayName}</td>
                        <td>{s.openTime}</td>
                        <td>{s.closeTime}</td>
                        <td>
                          <button onClick={() => handleDeleteClinicDay(s.id)} className="btn-delete action-btn">
                            {t.delete}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Doctor Tab */}
        {tab === 'doctor' && (
          <div>
            <div className="doctor-select">
              <label>{t.selectDoctor}</label>
              <select
                value={selectedDoctor}
                onChange={e => setSelectedDoctor(e.target.value)}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="">{t.selectDoctor}...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} {d.specialty ? `— ${d.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctor && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button className="btn-primary" onClick={() => setShowDoctorForm(!showDoctorForm)}>
                    <span>+</span> {t.addDay}
                  </button>
                </div>

                {showDoctorForm && (
                  <div className="form-card">
                    <h3 className="form-title">{t.addDay}</h3>
                    <div className="form-grid">
                      <div className="form-field">
                        <label className="form-label">{t.day}</label>
                        <select
                          value={doctorForm.dayOfWeek}
                          onChange={e => setDoctorForm({ ...doctorForm, dayOfWeek: parseInt(e.target.value) })}
                          className="form-select"
                        >
                          {dayNames.map((name, i) => (
                            <option key={i} value={i}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label">{t.startTime}</label>
                        <input
                          type="time"
                          value={doctorForm.startTime.slice(0, 5)}
                          onChange={e => setDoctorForm({ ...doctorForm, startTime: e.target.value + ':00' })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">{t.endTime}</label>
                        <input
                          type="time"
                          value={doctorForm.endTime.slice(0, 5)}
                          onChange={e => setDoctorForm({ ...doctorForm, endTime: e.target.value + ':00' })}
                          className="form-input"
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">{t.slotDuration}</label>
                        <input
                          type="number"
                          value={doctorForm.slotDuration}
                          onChange={e => setDoctorForm({ ...doctorForm, slotDuration: parseInt(e.target.value) })}
                          min="5"
                          max="120"
                          step="5"
                          className="form-input"
                        />
                        <span style={{ fontSize: 11, color: TEXT_MUTED }}>{t.minute}</span>
                      </div>
                      <div className="form-field">
                        <label className="form-label">{t.firstVisitPrice}</label>
                        <input
                          type="number"
                          value={doctorForm.firstVisitPrice}
                          onChange={e => setDoctorForm({ ...doctorForm, firstVisitPrice: e.target.value })}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="form-input"
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">{t.followUpPrice}</label>
                        <input
                          type="number"
                          value={doctorForm.followUpPrice}
                          onChange={e => setDoctorForm({ ...doctorForm, followUpPrice: e.target.value })}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button className="btn-primary" onClick={handleAddDoctorDay}>{t.save}</button>
                      <button className="btn-secondary" onClick={() => setShowDoctorForm(false)}>{t.cancel}</button>
                    </div>
                  </div>
                )}

                <div className="table-container">
                  <table className="schedules-table">
                    <thead>
                      <tr>
                        <th>{t.day}</th>
                        <th>{t.startTime}</th>
                        <th>{t.endTime}</th>
                        <th>{t.slotDuration}</th>
                        <th>{t.firstVisitPrice}</th>
                        <th>{t.followUpPrice}</th>
                        <th>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorSchedules.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="empty-state">
                            <span>📅</span>
                            <p>{t.noData}</p>
                          </td>
                        </tr>
                      ) : (
                        doctorSchedules.map(s => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 600 }}>{s.dayName}</td>
                            <td>{s.startTime}</td>
                            <td>{s.endTime}</td>
                            <td>{s.slotDuration} {t.minute}</td>
                            <td>{s.firstVisitPrice ? `${s.firstVisitPrice} ${t.riyal}` : '—'}</td>
                            <td>{s.followUpPrice ? `${s.followUpPrice} ${t.riyal}` : '—'}</td>
                            <td>
                              <button onClick={() => handleDeleteDoctorDay(s.id)} className="btn-delete action-btn">
                                {t.delete}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}