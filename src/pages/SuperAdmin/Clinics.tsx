import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const PRIMARY = '#5B8C8F'
const PRIMARY_SOFT = '#E8F0F0'
const TEXT_DARK = '#2C3E3F'
const TEXT_MUTED = '#6B8A8C'
const BORDER = '#DCE5E5'
const CARD_BG = '#FFFFFF'
const SUCCESS = '#4A7679'
const WARNING = '#C4A77D'

interface Clinic {
  id: string
  name: string
  subdomain: string
  phone?: string
  email?: string
  ownerName?: string
  isActive: boolean
  createdAt: string
}

export default function SuperAdminClinics() {
  const navigate = useNavigate()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', subDomain: '', phone: '', email: '',
    address: '', website: '', ownerName: '',
    ownerEmail: '', ownerPhone: '', taxNumber: '',
    commercialRegister: '', description: '',
    invoiceId: '', invoiceKey: '', logo: '',
  })

  useEffect(() => { fetchClinics() }, [])

  const fetchClinics = async () => {
    try {
      const res = await api.get('/clinics')
      setClinics(res.data)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/clinics', form)
      setSuccess('تم إنشاء العيادة بنجاح ✅')
      setShowForm(false)
      setForm({
        name: '', subDomain: '', phone: '', email: '',
        address: '', website: '', ownerName: '',
        ownerEmail: '', ownerPhone: '', taxNumber: '',
        commercialRegister: '', description: '',
        invoiceId: '', invoiceKey: '', logo: '',
      })
      fetchClinics()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/clinics/${id}/toggle`)
      setClinics(prev => prev.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ))
    } catch {
      alert('حدث خطأ')
    }
  }

  const fields = [
    { key: 'name',               label: 'اسم العيادة *',      placeholder: 'عيادة الأمل' },
    { key: 'subDomain',          label: 'Subdomain *',         placeholder: 'alamal' },
    { key: 'phone',              label: 'الهاتف',             placeholder: '05xxxxxxxx' },
    { key: 'email',              label: 'البريد الإلكتروني',  placeholder: 'clinic@example.com' },
    { key: 'address',            label: 'العنوان',            placeholder: 'الرياض، حي النزهة' },
    { key: 'website',            label: 'الموقع',             placeholder: 'https://example.com' },
    { key: 'ownerName',          label: 'اسم المالك',         placeholder: 'أحمد محمد' },
    { key: 'ownerEmail',         label: 'بريد المالك',        placeholder: 'owner@example.com' },
    { key: 'ownerPhone',         label: 'هاتف المالك',        placeholder: '05xxxxxxxx' },
    { key: 'taxNumber',          label: 'الرقم الضريبي',      placeholder: '300xxxxxxxxx' },
    { key: 'commercialRegister', label: 'السجل التجاري',      placeholder: '10xxxxxxxx' },
    { key: 'description',        label: 'الوصف',              placeholder: 'نبذة عن العيادة' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <p style={{ color: TEXT_MUTED }}>جاري التحميل...</p>
    </div>
  )

  return (
    <div dir="rtl" style={{
      background: '#F8FAFA', minHeight: '100vh', padding: 24,
      fontFamily: "'Cairo', sans-serif",
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 24,
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
              borderRadius: 100, padding: '4px 16px', fontSize: 11,
              fontWeight: 600, color: PRIMARY, marginBottom: 12,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY }} />
              SuperAdmin
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 32, fontWeight: 500, color: TEXT_DARK, margin: 0,
            }}>
              🏥 إدارة العيادات
            </h2>
            <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8 }}>
              {clinics.length} عيادة مسجلة
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: PRIMARY, color: '#FFFFFF', border: 'none',
              borderRadius: 12, padding: '10px 20px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            + إضافة عيادة
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: '#FDF5F5', border: `1px solid ${WARNING}`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            fontSize: 13, color: WARNING,
          }}>⚠️ {error}</div>
        )}
        {success && (
          <div style={{
            background: '#F0F8F0', border: `1px solid ${SUCCESS}`,
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            fontSize: 13, color: SUCCESS,
          }}>{success}</div>
        )}

        {/* Form */}
        {showForm && (
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 20, padding: 28, marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_DARK, marginBottom: 20 }}>
              ➕ عيادة جديدة
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16, marginBottom: 20,
              }}>
                {fields.map(f => (
                  <div key={f.key}>
                    <label style={{
                      display: 'block', fontSize: 12, fontWeight: 600,
                      color: TEXT_MUTED, marginBottom: 6,
                    }}>
                      {f.label}
                    </label>
                    <input
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      style={{
                        width: '100%', background: PRIMARY_SOFT,
                        border: `1px solid ${BORDER}`, borderRadius: 12,
                        padding: '10px 14px', fontSize: 14,
                        color: TEXT_DARK, outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: saving ? TEXT_MUTED : PRIMARY,
                    color: '#FFFFFF', border: 'none',
                    borderRadius: 12, padding: '10px 24px',
                    fontSize: 14, fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'جاري الحفظ...' : '💾 حفظ العيادة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '10px 20px', background: 'transparent',
                    border: `1px solid ${BORDER}`, borderRadius: 12,
                    fontSize: 14, color: TEXT_MUTED, cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div style={{
          background: CARD_BG, border: `1px solid ${BORDER}`,
          borderRadius: 20, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: PRIMARY_SOFT }}>
                {['العيادة', 'Subdomain', 'المالك', 'الهاتف', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'right',
                    fontSize: 12, fontWeight: 600, color: TEXT_MUTED,
                    borderBottom: `1px solid ${BORDER}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clinics.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: 48, textAlign: 'center', color: TEXT_MUTED, fontSize: 14,
                  }}>
                    لا توجد عيادات مسجلة
                  </td>
                </tr>
              ) : clinics.map(clinic => (
                <tr
                  key={clinic.id}
                  style={{ borderBottom: `1px solid ${BORDER}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = PRIMARY_SOFT)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, margin: 0 }}>
                      {clinic.name}
                    </p>
                    <p style={{ fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0' }}>
                      {new Date(clinic.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                    {clinic.subdomain}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                    {clinic.ownerName || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: TEXT_MUTED }}>
                    {clinic.phone || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                      background: clinic.isActive ? `${SUCCESS}20` : `${WARNING}20`,
                      color: clinic.isActive ? SUCCESS : WARNING,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: clinic.isActive ? SUCCESS : WARNING,
                      }} />
                      {clinic.isActive ? 'نشطة' : 'موقوفة'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => navigate(`/superadmin/clinics/${clinic.id}`)}
                        style={{
                          background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
                          borderRadius: 8, padding: '6px 12px', fontSize: 12,
                          color: PRIMARY, cursor: 'pointer',
                        }}
                      >
                        ✏️ تفاصيل
                      </button>
                      <button
                        onClick={() => handleToggle(clinic.id)}
                        style={{
                          background: clinic.isActive ? `${WARNING}20` : `${SUCCESS}20`,
                          border: 'none', borderRadius: 8, padding: '6px 12px',
                          fontSize: 12,
                          color: clinic.isActive ? WARNING : SUCCESS,
                          cursor: 'pointer',
                        }}
                      >
                        {clinic.isActive ? '🔴 إيقاف' : '🟢 تفعيل'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}