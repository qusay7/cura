import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuickVisit from './QuickVisit'
import api from '../api/axios'
import type { Patient, Doctor } from '../types'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

// AppointmentCalendar fetches and renders its own slot grid — out of scope
// here. Replaced with a single button that fires the same onSelectSlot
// callback QuickVisit actually depends on. The component's own validation
// rejects any date that isn't in the future, so the mock slot is computed
// relative to "now" rather than hardcoded.
const MOCK_SLOT_DATE = (() => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00:00`
})()

vi.mock('../components/AppointmentCalendar', () => ({
  default: ({ onSelectSlot }: { onSelectSlot: (dateTime: string, price?: number) => void }) => (
    <button type="button" onClick={() => onSelectSlot(MOCK_SLOT_DATE, 30)}>pick mock slot</button>
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

// Default: no patients or doctors, and no conflicting appointments for the
// availability check. A persistent implementation so refetches keep working.
function mockQuickVisitGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of Object.keys(overrides)) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url === '/patients') return Promise.resolve({ data: [] })
    if (url === '/doctors') return Promise.resolve({ data: [] })
    if (url.startsWith('/appointments?doctorId=')) return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderQuickVisit() {
  return render(
    <MemoryRouter initialEntries={['/quick-visit']}>
      <Routes>
        <Route path="/quick-visit" element={<QuickVisit />} />
        <Route path="/appointments" element={<div>appointments page</div>} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// The doctor label isn't associated with its <select> via htmlFor/id, and a
// second (visit-type) <select> is visible at the same time — so the doctor
// select is looked up by its `name` attribute instead of an accessible name.
const getDoctorSelect = (container: HTMLElement) =>
  container.querySelector('select[name="doctorId"]') as HTMLSelectElement

describe('QuickVisit', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows an inline error when the initial data fails to load', async () => {
    mockedApi.get.mockRejectedValue(new Error('network error'))
    const { container } = renderQuickVisit()

    expect(await screen.findByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('searches patients and selects one, showing their info card', async () => {
    mockQuickVisitGets({ '/patients': [patient()] })
    const user = userEvent.setup()
    const { container } = renderQuickVisit()
    await screen.findByText('Step 1: Search Patient')

    await user.type(screen.getByPlaceholderText('Search by name or patient ID...'), 'Sara')
    await user.click(await screen.findByText('Sara Ahmad'))

    const infoCard = document.querySelector('.patient-info-card') as HTMLElement
    expect(within(infoCard).getByText('#101')).toBeInTheDocument()
    expect(within(infoCard).getByText('0501234567')).toBeInTheDocument()
  })

  it('offers to add a new patient when the search finds nothing', async () => {
    mockQuickVisitGets({ '/patients': [patient()] })
    const user = userEvent.setup()
    const { container } = renderQuickVisit()
    await screen.findByText('Step 1: Search Patient')

    await user.type(screen.getByPlaceholderText('Search by name or patient ID...'), 'Zzz')

    const addButton = await screen.findByText('+ Add New Patient')
    await user.click(addButton)

    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument()
  })

  it('shows the calendar once a doctor is selected and records the picked slot', async () => {
    mockQuickVisitGets({ '/patients': [patient()], '/doctors': [doctor()] })
    const user = userEvent.setup()
    const { container } = renderQuickVisit()
    await screen.findByText('Step 1: Search Patient')
    await user.type(screen.getByPlaceholderText('Search by name or patient ID...'), 'Sara')
    await user.click(await screen.findByText('Sara Ahmad'))

    expect(screen.getByText('Select Doctor First')).toBeInTheDocument()

    await user.selectOptions(getDoctorSelect(container), 'doc-1')

    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))

    expect(await screen.findByText('Selected Appointment')).toBeInTheDocument()
    expect(screen.getByText('30 JD', { exact: false })).toBeInTheDocument()
  })

  it('clears the picked slot when Change is clicked', async () => {
    mockQuickVisitGets({ '/patients': [patient()], '/doctors': [doctor()] })
    const user = userEvent.setup()
    const { container } = renderQuickVisit()
    await screen.findByText('Step 1: Search Patient')
    await user.type(screen.getByPlaceholderText('Search by name or patient ID...'), 'Sara')
    await user.click(await screen.findByText('Sara Ahmad'))
    await user.selectOptions(getDoctorSelect(container), 'doc-1')
    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))
    await screen.findByText('Selected Appointment')

    await user.click(screen.getByRole('button', { name: /change/i }))

    expect(screen.queryByText('Selected Appointment')).not.toBeInTheDocument()
  })

  it('books a visit for an existing patient and navigates to the dashboard', async () => {
    mockQuickVisitGets({ '/patients': [patient()], '/doctors': [doctor()] })
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'appt-1' } })
    const user = userEvent.setup()
    const { container } = renderQuickVisit()
    await screen.findByText('Step 1: Search Patient')
    await user.type(screen.getByPlaceholderText('Search by name or patient ID...'), 'Sara')
    await user.click(await screen.findByText('Sara Ahmad'))
    await user.selectOptions(getDoctorSelect(container), 'doc-1')
    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))

    await user.click(screen.getByRole('button', { name: /save visit/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({ patientId: 'pat-1', doctorId: 'doc-1', appointmentDate: MOCK_SLOT_DATE, price: 30 })
      )
    )
    expect(await screen.findByText('dashboard page')).toBeInTheDocument()
  })

  it('creates a new patient and books their first visit', async () => {
    mockQuickVisitGets({ '/patients': [], '/doctors': [doctor()] })
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/patients') return Promise.resolve({ data: { id: 'pat-new' } })
      if (url === '/appointments') return Promise.resolve({ data: { id: 'appt-new' } })
      return Promise.reject(new Error(`unexpected POST ${url}`))
    })
    const user = userEvent.setup()
    const { container } = renderQuickVisit()
    await screen.findByText('Step 1: Search Patient')

    await user.type(screen.getByPlaceholderText('Search by name or patient ID...'), 'Omar')
    await user.click(await screen.findByText('+ Add New Patient'))
    await user.type(screen.getByPlaceholderText('Full Name'), 'Omar Khalil')
    await user.selectOptions(getDoctorSelect(container), 'doc-1')
    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))

    await user.click(screen.getByRole('button', { name: /save visit/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/patients', expect.objectContaining({ fullName: 'Omar Khalil' }))
    )
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({ patientId: 'pat-new', doctorId: 'doc-1' })
      )
    )
  })

  it('shows a conflict error and does not submit when the doctor is unavailable', async () => {
    mockQuickVisitGets({
      '/patients': [patient()],
      '/doctors': [doctor()],
      '/appointments?doctorId=doc-1': [{ appointmentDate: MOCK_SLOT_DATE }],
    })
    const user = userEvent.setup()
    const { container } = renderQuickVisit()
    await screen.findByText('Step 1: Search Patient')
    await user.type(screen.getByPlaceholderText('Search by name or patient ID...'), 'Sara')
    await user.click(await screen.findByText('Sara Ahmad'))
    await user.selectOptions(getDoctorSelect(container), 'doc-1')
    await user.click(await screen.findByRole('button', { name: /pick mock slot/i }))

    await user.click(screen.getByRole('button', { name: /save visit/i }))

    expect(await screen.findByText(/minimum gap is 20 minutes/i)).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalledWith('/appointments', expect.anything())
  })

  it('navigates back to appointments from the header back button', async () => {
    mockQuickVisitGets()
    const user = userEvent.setup()
    const { container } = renderQuickVisit()
    await screen.findByText('Step 1: Search Patient')

    await user.click(screen.getByRole('button', { name: /^← back$/i }))

    expect(await screen.findByText('appointments page')).toBeInTheDocument()
  })
})
