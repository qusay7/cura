import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AddAppointment from './AddAppointment'
import api from '../api/axios'
import type { Patient, Doctor } from '../types'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — irrelevant
// decoration for the brief loading screen these tests pass through.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

// AppointmentCalendar fetches and renders its own slot grid — out of scope
// here. Replaced with a single button that fires the same onSelectSlot
// callback AddAppointment actually depends on.
// The component's own validation rejects any date that isn't in the future,
// so the mock slot must be computed relative to "now" rather than hardcoded.
const MOCK_SLOT_DATE = (() => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00:00`
})()

vi.mock('../components/AppointmentCalendar', () => ({
  default: ({ onSelectSlot }: { onSelectSlot: (dateTime: string, price?: number) => void }) => (
    <button onClick={() => onSelectSlot(MOCK_SLOT_DATE, 30)}>pick mock slot</button>
  ),
}))

const mockedApi = vi.mocked(api, true)

const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'pat-1',
  patientNumber: 101,
  fullName: 'Sara Ahmad',
  phone: '0501234567',
  gender: 'female',
  dateOfBirth: null,
  createdAt: '2026-01-01',
  ...overrides,
})

const doctor = (overrides: Partial<Doctor> = {}): Doctor => ({
  id: 'doc-1',
  fullName: 'Dr. Ali',
  specialty: 'Cardiology',
  isActive: true,
  clinicId: 'clinic-1',
  createdAt: '2026-01-01',
  workType: 'appointments',
  ...overrides,
} as Doctor)

// Default: empty patients/doctors/templates, and every doctor-specific probe
// (status, financial settings, insurance, absence) resolves to a neutral,
// non-blocking value — so every test starts from a clean, settled screen
// unless it overrides a URL (matched by exact value or prefix).
function mockAddAppointmentGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of Object.keys(overrides)) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url === '/patients') return Promise.resolve({ data: [] })
    if (url === '/doctors') return Promise.resolve({ data: [] })
    if (url === '/treatmentplans/templates') return Promise.resolve({ data: [] })
    if (url.startsWith('/appointments/doctor-status/')) return Promise.resolve({ data: { isBusy: false, queueCount: 0 } })
    if (url.startsWith('/doctors/') && url.endsWith('/financial-settings')) return Promise.resolve({ data: [] })
    if (url.startsWith('/insurance/calculate')) return Promise.resolve({ data: { hasInsurance: false } })
    if (url.startsWith('/absences/check')) return Promise.resolve({ data: { available: true } })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

// Patient/doctor are SearchableSelect (a button that reveals a searchable
// list), not a native <select> — so picking a value means opening it and
// clicking the option's text. The trigger's accessible name is the label
// text with a trailing "▼" glyph concatenated (no separating space).
async function pickFromSearchable(user: ReturnType<typeof userEvent.setup>, triggerName: RegExp, optionText: string) {
  await user.click(screen.getByRole('button', { name: triggerName }))
  await user.click(await screen.findByText(optionText))
}

function renderAddAppointment() {
  render(
    <MemoryRouter initialEntries={['/appointments/add']}>
      <Routes>
        <Route path="/appointments/add" element={<AddAppointment />} />
        <Route path="/appointments" element={<div>appointments page</div>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AddAppointment', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('redirects to /login when the booking data fails to load', async () => {
    mockedApi.get.mockRejectedValue(new Error('unauthorized'))
    renderAddAppointment()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('shows a warning when there are no active doctors', async () => {
    mockAddAppointmentGets()
    renderAddAppointment()

    expect(await screen.findByText(/no active doctors/i)).toBeInTheDocument()
  })

  it('books an appointment using the selected calendar slot, showing the insurance breakdown', async () => {
    mockAddAppointmentGets({
      '/patients': [patient()],
      '/doctors': [doctor()],
      '/insurance/calculate': { hasInsurance: true, coverageRate: 20, companyName: 'Bupa', policyNumber: 'POL-1', expiryDate: '2026-12-31' },
    })
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'appt-1' } })
    const user = userEvent.setup()
    renderAddAppointment()
    await screen.findByText('Book New Appointment')

    await pickFromSearchable(user, /select a patient/i, '#101 — Sara Ahmad')
    await pickFromSearchable(user, /no doctor/i, '📅 Dr. Ali — Cardiology')
    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))

    expect(await screen.findByText('Active Insurance — Bupa')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^book appointment$/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({
          patientId: 'pat-1',
          doctorId: 'doc-1',
          appointmentDate: MOCK_SLOT_DATE,
          status: 'scheduled',
          price: 30,
        })
      )
    )
    expect(await screen.findByText('appointments page')).toBeInTheDocument()
  })

  it('books a queue appointment for a Queue-only doctor without requiring a date', async () => {
    mockAddAppointmentGets({
      '/patients': [patient()],
      '/doctors': [doctor({ id: 'doc-2', workType: 'queue' })],
    })
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'appt-2' } })
    const user = userEvent.setup()
    renderAddAppointment()
    await screen.findByText('Book New Appointment')

    await pickFromSearchable(user, /select a patient/i, '#101 — Sara Ahmad')
    await pickFromSearchable(user, /no doctor/i, '🔢 Dr. Ali — Cardiology')

    expect(await screen.findByText(/queue booking/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /book queue/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({ patientId: 'pat-1', doctorId: 'doc-2', status: 'scheduled' })
      )
    )
    expect(await screen.findByText('appointments page')).toBeInTheDocument()
  })

  it('shows the server error message when booking fails', async () => {
    mockAddAppointmentGets({ '/patients': [patient()], '/doctors': [doctor()] })
    mockedApi.post.mockRejectedValueOnce({ response: { data: 'Doctor unavailable at this time' } })
    const user = userEvent.setup()
    renderAddAppointment()
    await screen.findByText('Book New Appointment')

    await pickFromSearchable(user, /select a patient/i, '#101 — Sara Ahmad')
    await pickFromSearchable(user, /no doctor/i, '📅 Dr. Ali — Cardiology')
    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))
    await user.click(screen.getByRole('button', { name: /^book appointment$/i }))

    expect(await screen.findByText('Doctor unavailable at this time')).toBeInTheDocument()
  })
})
