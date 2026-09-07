import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EditAppointment from './EditAppointment'
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
// callback EditAppointment actually depends on.
const MOCK_SLOT_DATE = (() => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T11:00:00`
})()

vi.mock('../components/AppointmentCalendar', () => ({
  default: ({ onSelectSlot }: { onSelectSlot: (dateTime: string, price?: number) => void }) => (
    <button type="button" onClick={() => onSelectSlot(MOCK_SLOT_DATE, 40)}>pick mock slot</button>
  ),
}))

const mockedApi = vi.mocked(api, true)

// The component pads the "loading" state to at least 800ms regardless of how
// fast the API resolves, so the loading screen needs a generous wait.
const LOADING_TIMEOUT = { timeout: 2000 }

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

const appointmentRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
  patientId: 'pat-1',
  doctorId: 'doc-1',
  appointmentDate: '2026-01-20T10:00:00',
  type: 'كشف',
  price: 25,
  status: 'scheduled',
  notes: 'Regular checkup',
  ...overrides,
})

// Default: the appointment, an empty patients/doctors list, and a no-conflict
// answer for any doctor's schedule, all via a persistent implementation.
function mockEditAppointmentGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of Object.keys(overrides)) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url === '/appointments/appt-1') return Promise.resolve({ data: appointmentRecord() })
    if (url === '/patients') return Promise.resolve({ data: [] })
    if (url === '/doctors') return Promise.resolve({ data: [] })
    if (url.startsWith('/appointments?doctorId=')) return Promise.resolve({ data: [] })
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

function renderEditAppointment() {
  render(
    <MemoryRouter initialEntries={['/appointments/appt-1/edit']}>
      <Routes>
        <Route path="/appointments/:id/edit" element={<EditAppointment />} />
        <Route path="/appointments" element={<div>appointments page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('EditAppointment', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('loads the existing appointment and re-submits its values unchanged', async () => {
    mockEditAppointmentGets({ '/patients': [patient()], '/doctors': [doctor()] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderEditAppointment()

    expect(await screen.findByDisplayValue('Regular checkup', {}, LOADING_TIMEOUT)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/appointments/appt-1',
        expect.objectContaining({ patientId: 'pat-1', doctorId: 'doc-1', status: 'scheduled', price: 25 })
      )
    )
    expect(await screen.findByText('Changes saved successfully')).toBeInTheDocument()
    // Navigation is intentionally delayed so the success banner is visible
    // for a moment first, rather than an instant, unconfirmed redirect.
    expect(await screen.findByText('appointments page', undefined, { timeout: 2000 })).toBeInTheDocument()
  })

  it('redirects to the appointments list when loading fails', async () => {
    mockEditAppointmentGets({ '/appointments/appt-1': new Error('not found') })
    renderEditAppointment()

    expect(await screen.findByText('appointments page', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
  })

  it('shows the server error message when saving fails', async () => {
    mockEditAppointmentGets({ '/patients': [patient()], '/doctors': [doctor()] })
    mockedApi.put.mockRejectedValueOnce({ response: { data: 'Doctor unavailable at this time' } })
    const user = userEvent.setup()
    renderEditAppointment()
    await screen.findByDisplayValue('Regular checkup', {}, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    // The same `error` state also feeds the inline error under the date
    // field, so the message legitimately renders twice.
    expect((await screen.findAllByText('Doctor unavailable at this time')).length).toBeGreaterThan(0)
  })

  it('shows the queue-booking panel instead of the calendar for a Queue-only doctor', async () => {
    mockEditAppointmentGets({
      '/patients': [patient()],
      '/doctors': [doctor({ id: 'doc-2', workType: 'queue' })],
      '/appointments/appt-1': appointmentRecord({ doctorId: 'doc-2' }),
    })
    renderEditAppointment()
    await screen.findByDisplayValue('Regular checkup', {}, LOADING_TIMEOUT)

    expect(await screen.findByText(/queue booking/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pick mock slot/i })).not.toBeInTheDocument()
  })

  it('updates the appointment date and price when a new calendar slot is picked', async () => {
    mockEditAppointmentGets({ '/patients': [patient()], '/doctors': [doctor()] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderEditAppointment()
    await screen.findByDisplayValue('Regular checkup', {}, LOADING_TIMEOUT)

    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))
    expect(screen.getByDisplayValue('40')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/appointments/appt-1',
        expect.objectContaining({ appointmentDate: new Date(MOCK_SLOT_DATE).toISOString(), price: 40 })
      )
    )
  })

  it('blocks saving and shows a conflict error when the picked slot is too close to another appointment for that doctor', async () => {
    mockEditAppointmentGets({
      '/patients': [patient()],
      '/doctors': [doctor()],
      '/appointments?doctorId=doc-1': [{ id: 'other-appt', appointmentDate: MOCK_SLOT_DATE }],
    })
    const user = userEvent.setup()
    renderEditAppointment()
    await screen.findByDisplayValue('Regular checkup', {}, LOADING_TIMEOUT)

    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    // The same `error` state also feeds the inline error under the date
    // field, so the message legitimately renders twice.
    expect((await screen.findAllByText(/doctor has an appointment at/i)).length).toBeGreaterThan(0)
    expect(mockedApi.put).not.toHaveBeenCalled()
  })

  it('re-checks for a conflict against the newly selected doctor at save time', async () => {
    mockEditAppointmentGets({
      '/patients': [patient()],
      '/doctors': [doctor(), doctor({ id: 'doc-2', fullName: 'Dr. Omar' })],
      '/appointments?doctorId=doc-2': [{ id: 'other-appt', appointmentDate: MOCK_SLOT_DATE }],
    })
    const user = userEvent.setup()
    renderEditAppointment()
    await screen.findByDisplayValue('Regular checkup', {}, LOADING_TIMEOUT)

    // Pick a slot while Doctor Ali is selected (no conflict for doc-1), then
    // switch to Dr. Omar, who does conflict at that same time.
    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))
    await pickFromSearchable(user, /dr\. ali — cardiology/i, 'Dr. Omar — Cardiology')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect((await screen.findAllByText(/doctor has an appointment at/i)).length).toBeGreaterThan(0)
    expect(mockedApi.put).not.toHaveBeenCalled()
  })

  it('blocks saving when the conflict check itself fails, rather than assuming no conflict', async () => {
    mockEditAppointmentGets({
      '/patients': [patient()],
      '/doctors': [doctor()],
      '/appointments?doctorId=doc-1': new Error('network error'),
    })
    const user = userEvent.setup()
    renderEditAppointment()
    await screen.findByDisplayValue('Regular checkup', {}, LOADING_TIMEOUT)

    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect((await screen.findAllByText(/could not verify scheduling conflicts/i)).length).toBeGreaterThan(0)
    expect(mockedApi.put).not.toHaveBeenCalled()
  })

  it('cancels without saving and returns to the appointments list', async () => {
    mockEditAppointmentGets({ '/patients': [patient()], '/doctors': [doctor()] })
    const user = userEvent.setup()
    renderEditAppointment()
    await screen.findByDisplayValue('Regular checkup', {}, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(await screen.findByText('appointments page')).toBeInTheDocument()
    expect(mockedApi.put).not.toHaveBeenCalled()
  })
})
