import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { hasPermission } from '../utils/permissions'
import { useColumnVisibility, ColumnToggleButton } from '../components/ColumnToggle'
import type { ColumnDef } from '../components/ColumnToggle'
import { PRIMARY, PRIMARY_SOFT, TEXT_DARK, TEXT_MUTED, BORDER, CARD_BG } from '../styles/theme'

const getStoredLang = (): 'ar' | 'en' =>
  (localStorage.getItem('cura-lang') as 'ar' | 'en') || 'en'

const SUCCESS = '#4A7679'
const WARNING = '#79674D'

const globalCss = `
@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.departments-shell { animation: fade-up 0.4s cubic-bezier(0.2,0.9,0.4,1.1) both; }
.dept-card {
  animation: fade-up 0.4s ease both;
  transition: all 0.2s ease;
}
.dept-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px -8px rgba(0,0,0,0.08);
}
.departments-shell * { box-sizing: border-box; }
@media(max-width: 768px) {
  .dept-grid { grid-template-columns: 1fr !important; }
}
@media print {
  .no-print { display: none !important; }
  body { margin: 0; padding: 10px; }
}
`

const T = {
  ar: {
    title: 'الأقسام',
    addDept: 'إضافة قسم',
    search: 'ابحث بالاسم...',
    noDepts: 'لا يوجد أقسام',
    total: 'إجمالي الأقسام',
    active: 'نشط',
    inactive: 'غير نشط',
    doctors: 'أطباء',
    edit: 'تعديل',
    delete: 'حذف',
    deleteConfirm: 'هل أنت متأكد من حذف هذا القسم؟',
    print: 'طباعة',
    exportPdf: 'تصدير PDF',
    exportExcel: 'تصدير Excel',
    types: {
      0: 'عام',
      1: 'طوارئ',
      2: 'صيدلية',
      3: 'أشعة',
      4: 'مختبر',
      5: 'حسابات',
      99: 'أخرى',
    },
    typeIcons: {
      0: '🏥', 1: '🚨', 2: '💊', 3: '🔬', 4: '🧪', 5: '💰', 99: '📋',
    },
  },
  en: {
    title: 'Departments',
    addDept: 'Add Department',
    search: 'Search by name...',
    noDepts: 'No departments found',
    total: 'Total Departments',
    active: 'Active',
    inactive: 'Inactive',
    doctors: 'Doctors',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this department?',
    print: 'Print',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
    types: {
      0: 'General',
      1: 'Emergency',
      2: 'Pharmacy',
      3: 'Radiology',
      4: 'Laboratory',
      5: 'Accounting',
      99: 'Other',
    },
    typeIcons: {
      0: '🏥', 1: '🚨', 2: '💊', 3: '🔬', 4: '🧪', 5: '💰', 99: '📋',
    },
  },
}

interface Department {
  id: string
  name: string
  type: number
  settingsJson?: string
  isActive: boolean
  createdAt: string
  doctorsCount?: number
}

const DepartmentModal = ({
  isOpen, onClose, onSave, initial, lang
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; type: number; settingsJson?: string }) => Promise<void>
  initial?: Department | null
  lang: 'ar' | 'en'
}) => {
  const [name, setName] = useState(initial?.name || '')
  const [type, setType] = useState(initial?.type ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isAr = lang === 'ar'
  const t = T[lang]

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setType(initial.type)
    } else {
      setName('')
      setType(0)
    }
    setError('')
  }, [initial, isOpen])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!name.trim()) {
      setError(isAr ? 'اسم القسم مطلوب' : 'Department name is required')
      return
    }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), type })
      onClose()
    } catch (err: any) {
      setError(err.response?.data || (isAr ? 'حدث خطأ' : 'An error occurred'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: CARD_BG, borderRadius: 20, padding: 28,
        width: '100%', maxWidth: 480, margin: 16,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
      }} dir={isAr ? 'rtl' : 'ltr'}>

        <h3 style={{ fontSize: 18, fontWeight: 600, color: TEXT_DARK, marginBottom: 20 }}>
          {initial
            ? (isAr ? '✏️ تعديل قسم' : '✏️ Edit Department')
            : (isAr ? '➕ إضافة قسم' : '➕ Add Department')}
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>
            {isAr ? 'اسم القسم *' : 'Department Name *'}
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isAr ? 'مثال: عيادة الأطفال' : 'e.g. Pediatrics'}
            style={{
              width: '100%', background: PRIMARY_SOFT,
              border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: '10px 14px', fontSize: 14, color: TEXT_DARK, outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>
            {isAr ? 'نوع القسم *' : 'Department Type *'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {Object.entries(t.types).map(([val, label]) => {
              const icon = t.typeIcons[Number(val) as keyof typeof t.typeIcons]
              const selected = type === Number(val)
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setType(Number(val))}
                  style={{
                    padding: '10px 8px', borderRadius: 12,
                    border: selected ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
                    background: selected ? PRIMARY_SOFT : CARD_BG,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 11, fontWeight: selected ? 600 : 400, color: selected ? PRIMARY : TEXT_MUTED }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div style={{
            background: '#FDF5F5', border: `1px solid ${WARNING}40`,
            borderRadius: 10, padding: '10px 14px',
            fontSize: 12, color: WARNING, marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, background: PRIMARY, color: '#FFFFFF',
              border: 'none', borderRadius: 12, padding: '11px',
              fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '...' : (isAr ? 'حفظ' : 'Save')}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '11px 20px', background: 'transparent',
              border: `1px solid ${BORDER}`, borderRadius: 12,
              fontSize: 14, color: TEXT_MUTED, cursor: 'pointer',
            }}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

const DeptCard = ({
  dept, lang, onEdit, onDelete, onToggle
}: {
  dept: Department
  lang: 'ar' | 'en'
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) => {
  const t = T[lang]
  const isAr = lang === 'ar'
  const icon = t.typeIcons[dept.type as keyof typeof t.typeIcons] || '📋'
  const typeName = t.types[dept.type as keyof typeof t.types] || ''

  return (
    <div className="dept-card" style={{
      background: CARD_BG, border: `1px solid ${BORDER}`,
      borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${PRIMARY}, #8BAFB1)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: PRIMARY_SOFT, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_DARK, margin: 0, marginBottom: 4 }}>
              {dept.name}
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: `${PRIMARY}15`, borderRadius: 100,
              padding: '2px 8px', fontSize: 11, color: PRIMARY, fontWeight: 500,
            }}>
              {typeName}
            </span>
          </div>
        </div>

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 500,
          background: dept.isActive ? `${SUCCESS}15` : `${WARNING}15`,
          color: dept.isActive ? SUCCESS : WARNING,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: dept.isActive ? SUCCESS : WARNING }} />
          {dept.isActive ? T[lang].active : T[lang].inactive}
        </span>
      </div>

      {dept.doctorsCount !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: PRIMARY_SOFT,
          borderRadius: 10, marginBottom: 16,
        }}>
          <span style={{ fontSize: 14 }}>👨‍⚕️</span>
          <span style={{ fontSize: 13, color: TEXT_MUTED }}>
            {dept.doctorsCount} {t.doctors}
          </span>
        </div>
      )}

      {hasPermission('departments.manage') && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1, background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: '7px', fontSize: 12,
              fontWeight: 500, color: PRIMARY, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = PRIMARY
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = PRIMARY_SOFT
              e.currentTarget.style.color = PRIMARY
            }}
          >
            ✏️ {t.edit}
          </button>
          <button
            onClick={onToggle}
            style={{
              flex: 1, background: dept.isActive ? `${WARNING}10` : `${SUCCESS}10`,
              border: `1px solid ${dept.isActive ? WARNING : SUCCESS}40`,
              borderRadius: 10, padding: '7px', fontSize: 12,
              fontWeight: 500, color: dept.isActive ? WARNING : SUCCESS,
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            {dept.isActive ? (T[lang].active === 'نشط' ? '⏸ تعطيل' : '⏸ Disable') : (T[lang].active === 'نشط' ? '▶ تفعيل' : '▶ Enable')}
          </button>
          <button
            onClick={onDelete}
            style={{
              background: '#FDF5F5', border: `1px solid ${WARNING}40`,
              borderRadius: 10, padding: '7px 12px', fontSize: 12,
              color: WARNING, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  )
}

export default function Departments() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lang, setLang] = useState<'ar' | 'en'>(getStoredLang())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null)
  const [toastError, setToastError] = useState('')
  const [hasMultipleDepartments, setHasMultipleDepartments] = useState(true)

  useEffect(() => {
    if (!toastError) return
    const timer = setTimeout(() => setToastError(''), 4000)
    return () => clearTimeout(timer)
  }, [toastError])

  // ✅ Column definitions للطباعة والتصدير
  const columnDefs: ColumnDef[] = [
    { key: 'name', label: T[lang].title, locked: true },
    { key: 'type', label: T[lang].types[0] },
    { key: 'doctors', label: T[lang].doctors },
    { key: 'status', label: T[lang].active },
  ]
  const { visibleKeys, toggle } = useColumnVisibility('departments-columns', columnDefs)

  useEffect(() => {
    const styleId = 'cura-departments-css'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = globalCss
      document.head.appendChild(style)
    }
    const handleLang = (e: Event) => setLang((e as CustomEvent).detail)
    window.addEventListener('cura-lang-change', handleLang)
    return () => window.removeEventListener('cura-lang-change', handleLang)
  }, [])

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments')
      setDepartments(res.data)
    } catch {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDepartments() }, [])

  // ✅ خطة العيادة قد تحصر عدد الأقسام بواحد — نجيب هذا فقط لتعطيل زر الإضافة
  // بالواجهة (الباك اند هو المصدر الأصلي للتحقق، هذا فقط لتجربة استخدام أوضح)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.clinicId) return
    api.get(`/subscriptions/clinic/${user.clinicId}`)
      .then(res => setHasMultipleDepartments(!!res.data.hasMultipleDepartments))
      .catch(() => {})
  }, [])

  const handleSave = async (data: { name: string; type: number }) => {
    if (editingDept) {
      await api.put(`/departments/${editingDept.id}`, data)
    } else {
      await api.post('/departments', data)
    }
    await fetchDepartments()
  }

  const handleDelete = async (id: string) => {
    const t = T[lang]
    if (!confirm(t.deleteConfirm)) return
    try {
      await api.delete(`/departments/${id}`)
      setDepartments(prev => prev.filter(d => d.id !== id))
    } catch {
      setToastError(lang === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting department')
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/departments/${id}/toggle`)
      setDepartments(prev => prev.map(d =>
        d.id === id ? { ...d, isActive: !d.isActive } : d
      ))
    } catch {
      setToastError(lang === 'ar' ? 'حدث خطأ' : 'An error occurred')
    }
  }

  // ✅ تصدير
  const handleExport = async (format: 'pdf' | 'excel') => {
    setDownloading(format)
    try {
      const rows = filtered.map(d => ({
        name: d.name,
     type: (T[lang].types as any)[d.type] || '—',
        doctors: d.doctorsCount || 0,
        status: d.isActive ? T[lang].active : T[lang].inactive,
      }))

      const response = await api.post(
        `/export/${format}`,
        {
          title: T[lang].title,
          columns: columnDefs.filter(c => visibleKeys.has(c.key)).map(c => c.label),
          rows: rows.map(r =>
            columnDefs.filter(c => visibleKeys.has(c.key)).map(c => String(r[c.key as keyof typeof r] || '—'))
          ),
          isRtl: lang === 'ar',
        },
        { responseType: 'blob' }
      )

      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `departments.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setToastError(lang === 'ar' ? 'فشل التصدير' : 'Export failed')
    } finally {
      setDownloading(null)
    }
  }

  const t = T[lang]
  const isAr = lang === 'ar'

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
          <p style={{ color: TEXT_MUTED }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="departments-shell" dir={isAr ? 'rtl' : 'ltr'} style={{
      background: '#F8FAFA', minHeight: '100vh', padding: 24,
      fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
    }}>
      {toastError && (
        <div role="alert" style={{ position:'fixed', top:20, [isAr?'left':'right']:20, zIndex:2000, background:'#FFF5F5', border:'1px solid #FCA5A5', borderRadius:12, padding:'12px 18px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 6px 20px rgba(0,0,0,0.12)', maxWidth:340 }}>
          <span>⚠️</span><span style={{ fontSize:13, color:'#EF4444' }}>{toastError}</span>
        </div>
      )}
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24,
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: PRIMARY_SOFT, border: `1px solid ${BORDER}`,
              borderRadius: 100, padding: '4px 16px', fontSize: 11,
              fontWeight: 600, color: PRIMARY, marginBottom: 12,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, animation: 'soft-pulse 2s infinite' }} />
              {isAr ? 'هيكل العيادة' : 'Clinic Structure'}
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display','Georgia',serif",
              fontSize: 32, fontWeight: 500, color: TEXT_DARK, margin: 0,
            }}>
              {t.title}
            </h2>
            <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8 }}>
              🏥 {filtered.length} {t.total}
            </p>
          </div>

          {hasPermission('departments.manage') && (() => {
            const locked = !hasMultipleDepartments && departments.length >= 1
            return (
              <button
                onClick={() => {
                  if (locked) {
                    setToastError(isAr ? 'خطتك الحالية تسمح بقسم واحد فقط — يرجى ترقية الخطة لإضافة أقسام متعددة' : 'Your current plan allows only one department — please upgrade to add more')
                    return
                  }
                  setEditingDept(null); setModalOpen(true)
                }}
                title={locked ? (isAr ? 'يتطلب ترقية الخطة 🔒' : 'Requires a plan upgrade 🔒') : undefined}
                style={{
                  background: locked ? '#DCE5E5' : PRIMARY, color: locked ? TEXT_MUTED : '#FFFFFF', border: 'none',
                  borderRadius: 12, padding: '10px 20px', fontSize: 13,
                  fontWeight: 500, cursor: locked ? 'not-allowed' : 'pointer', display: 'flex',
                  alignItems: 'center', gap: 8,
                  boxShadow: locked ? 'none' : '0 2px 8px rgba(91,140,143,0.2)',
                }}
              >
                <span style={{ fontSize: 16 }}>{locked ? '🔒' : '+'}</span>
                {t.addDept}
              </button>
            )
          })()}
        </div>

        {/* ✅ أزرار الطباعة والتصدير والأعمدة */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }} className="no-print">
          <button onClick={() => window.print()}
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: 'pointer' }}>
            🖨️ {t.print}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={downloading !== null}
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'excel' ? 0.5 : 1 }}>
            {downloading === 'pdf' ? '⏳' : '📄'} {t.exportPdf}
          </button>
          <button onClick={() => handleExport('excel')} disabled={downloading !== null}
            style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: TEXT_DARK, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading === 'pdf' ? 0.5 : 1 }}>
            {downloading === 'excel' ? '⏳' : '📊'} {t.exportExcel}
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <ColumnToggleButton columns={columnDefs} visibleKeys={visibleKeys} onToggle={toggle} isRtl={isAr} />
          </div>
        </div>

        <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.search}
            style={{
              width: '100%', background: CARD_BG,
              border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: '10px 16px 10px 40px', fontSize: 13,
              color: TEXT_DARK, outline: 'none',
            }}
          />
          <span style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: 14, fontSize: 14, color: TEXT_MUTED,
          }}>🔍</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 20, padding: '48px 24px', textAlign: 'center',
          }}>
            <span style={{ fontSize: 48, opacity: 0.5 }}>🏥</span>
            <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 16 }}>{t.noDepts}</p>
            {hasPermission('departments.manage') && (
              <button
                onClick={() => { setEditingDept(null); setModalOpen(true) }}
                style={{
                  marginTop: 12, background: PRIMARY, color: '#FFFFFF',
                  border: 'none', borderRadius: 10, padding: '8px 20px',
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                + {t.addDept}
              </button>
            )}
          </div>
        ) : (
          <div className="dept-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {filtered.map(dept => (
              <DeptCard
                key={dept.id}
                dept={dept}
                lang={lang}
                onEdit={() => { setEditingDept(dept); setModalOpen(true) }}
                onDelete={() => handleDelete(dept.id)}
                onToggle={() => handleToggle(dept.id)}
              />
            ))}
          </div>
        )}
      </div>

      <DepartmentModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingDept(null) }}
        onSave={handleSave}
        initial={editingDept}
        lang={lang}
      />
    </div>
  )
}