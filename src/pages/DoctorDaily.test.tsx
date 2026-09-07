import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import DoctorDaily from './DoctorDaily'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

function todayAt(hour: number, minute: number) {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
}

const appointment = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'appt-1',
  patientName: 'Sara Ahmad',
  appointmentDate: todayAt(9, 0),
  type: 'Checkup',
  status: 'scheduled',
  ...overrides,
})

// Shows the incoming doctorId (if any) so a test can assert it was carried
// over in the link to the weekly calendar, without inspecting router internals.
function DoctorCalendarStub() {
  const [params] = useSearchParams()
  return <div>doctor calendar page (doctorId={params.get('doctorId') || 'none'})</div>
}

function renderDoctorDaily(initialEntry = '/daily') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/daily" element={<DoctorDaily />} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
        <Route path="/visit/:id" element={<div>visit workspace page</div>} />
        <Route path="/appointments/:id" element={<div>appointment detail page</div>} />
        <Route path="/doctor-calendar" element={<DoctorCalendarStub />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DoctorDaily', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('prompts to select a doctor when the user is not a doctor and none is selected', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Receptionist' }))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderDoctorDaily()

    expect(await screen.findByText('Select a doctor to view their schedule')).toBeInTheDocument()
    expect(mockedApi.get).not.toHaveBeenCalledWith(expect.stringContaining('/appointments?'))
  })

  it("fetches and shows the selected doctor's schedule", async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Receptionist' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/doctors') return Promise.resolve({ data: [{ id: 'doc-1', fullName: 'Dr. Ali', isActive: true }] })
      if (url.startsWith('/appointments?')) return Promise.resolve({ data: [appointment()] })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    const user = userEvent.setup()
    renderDoctorDaily()

    await user.click(await screen.findByText('Select a doctor'))
    await user.click(await screen.findByText('Dr. Ali'))

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('doctorId=doc-1'))
  })

  it("auto-loads the logged-in doctor's own schedule without a selector", async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Doctor' }))
    mockedApi.get.mockResolvedValueOnce({ data: [appointment()] })
    renderDoctorDaily()

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.queryByText('Select a doctor')).not.toBeInTheDocument()
  })

  it('shows the empty state when there are no appointments today', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Doctor' }))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderDoctorDaily()

    expect(await screen.findByText('No appointments today 🎉')).toBeInTheDocument()
  })

  it('computes the total/completed/remaining stats', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Doctor' }))
    mockedApi.get.mockResolvedValueOnce({
      data: [
        appointment({ id: 'a1', status: 'completed', checkInTime: todayAt(8, 0), checkOutTime: todayAt(8, 20) }),
        appointment({ id: 'a2', patientName: 'Omar Khalil', status: 'scheduled' }),
      ],
    })
    renderDoctorDaily()

    await screen.findByText('Sara Ahmad')
    expect(screen.getByText('2')).toBeInTheDocument() // total
    expect(screen.getAllByText('1').length).toBeGreaterThan(0) // completed and remaining
  })

  it('navigates to the visit workspace when Check In is clicked', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Doctor' }))
    mockedApi.get.mockResolvedValueOnce({ data: [appointment()] })
    const user = userEvent.setup()
    renderDoctorDaily()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /check in/i }))

    expect(await screen.findByText('visit workspace page')).toBeInTheDocument()
  })

  it("navigates to the appointment's detail page when the card itself is clicked", async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Doctor' }))
    mockedApi.get.mockResolvedValueOnce({ data: [appointment()] })
    const user = userEvent.setup()
    renderDoctorDaily()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByText('Sara Ahmad'))

    expect(await screen.findByText('appointment detail page')).toBeInTheDocument()
  })

  it('shows a retry option instead of silently navigating away when loading fails', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Doctor' }))
    mockedApi.get.mockRejectedValueOnce(new Error('server error'))
    const user = userEvent.setup()
    renderDoctorDaily()

    expect(await screen.findByText("Failed to load today's schedule", { exact: false })).toBeInTheDocument()
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()

    mockedApi.get.mockResolvedValueOnce({ data: [appointment()] })
    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
  })

  it('redirects to the dashboard when the session has expired (401)', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Doctor' }))
    mockedApi.get.mockRejectedValueOnce(Object.assign(new Error('unauthorized'), { response: { status: 401 } }))
    renderDoctorDaily()

    expect(await screen.findByText('dashboard page')).toBeInTheDocument()
  })

  it('links to the weekly calendar, carrying over the selected doctor', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Receptionist' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/doctors') return Promise.resolve({ data: [{ id: 'doc-1', fullName: 'Dr. Ali', isActive: true }] })
      if (url.startsWith('/appointments?')) return Promise.resolve({ data: [appointment()] })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    const user = userEvent.setup()
    renderDoctorDaily()
    await user.click(await screen.findByText('Select a doctor'))
    await user.click(await screen.findByText('Dr. Ali'))
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /weekly calendar/i }))

    expect(await screen.findByText('doctor calendar page (doctorId=doc-1)')).toBeInTheDocument()
  })

  it('preselects the doctor passed in via the URL from the weekly calendar link', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Receptionist' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/doctors') return Promise.resolve({ data: [{ id: 'doc-1', fullName: 'Dr. Ali', isActive: true }] })
      if (url.startsWith('/appointments?')) return Promise.resolve({ data: [appointment()] })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderDoctorDaily('/daily?doctorId=doc-1')

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('doctorId=doc-1'))
  })
})
