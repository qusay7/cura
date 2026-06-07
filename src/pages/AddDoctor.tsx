import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function AddDoctor() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName:  '',
    specialty: '',
    phone:     '',
    email:     '',
    notes:     '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== '')
      )
      await api.post('/doctors', payload)
      navigate('/doctors')
    } catch (err: any) {
      const errData = err.response?.data
      if (typeof errData === 'string') {
        setError(errData)
      } else {
        setError('حدث خطأ غير متوقع')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/doctors')}
          className="text-gray-500 hover:text-gray-700"
        >
          ← رجوع
        </button>
        <h2 className="text-2xl font-bold text-gray-800">إضافة طبيب جديد</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow p-6 max-w-lg space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الاسم الكامل *
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              التخصص
            </label>
            <input
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="طب عام، طب أسنان، ..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الهاتف
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'جارٍ الحفظ...' : 'حفظ الطبيب'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctors')}
              className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              إلغاء
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}