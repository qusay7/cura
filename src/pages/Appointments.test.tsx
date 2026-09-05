import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Appointments from './Appointments'
import api from '../api/axios'
import type { Appointment } from '../types'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — irrelevant
// decoration for the brief loading screen these tests pass through.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

const mockedApi = vi.mocked(api, true)

// The component pads the "loading" state to at least 800ms regardless of how
// fast the API resolves, so the loading screen needs a generous wait.
const LOADING_TIMEOUT = { timeout: 2000 }

function todayAt(hour: number, minute: number) {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const scheduledAppointment: Appointment = {
  id: 'appt-1',
  patientId: 'pat-1',
  patientName: 'Sara Ahmad',
  patientNumber: 42,
  doctorId: 'doc-1',
  doctorName: 'Dr. Ali',
  appointmentDate: todayAt(9, 0),
  type: 'Checkup',
  price: 20,
  status: 'scheduled',
  notes: null,
  createdAt: '2026-01-01',
}

function renderAppointments() {
  render(
    <MemoryRouter initialEntries={['/appointments']}>
      <Routes>
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/:id" element={<div>appointment detail page</div>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Appointments', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.alert = vi.fn()
  })

  it('redirects to /login when the appointments list fails to load', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('unauthorized'))
    renderAppointments()

    expect(await screen.findByText('login page', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
  })

  it("lists today's scheduled appointment with a working Check In and Confirm action", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [scheduledAppointment] })
    renderAppointments()

    expect(await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /check in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm(?!ed)/i })).toBeInTheDocument()
  })

  it('checks a patient in and reflects the confirmed status', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [scheduledAppointment] })
    mockedApi.post.mockResolvedValueOnce({ data: { checkInTime: todayAt(9, 1) } })
    const user = userEvent.setup()
    renderAppointments()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /check in/i }))

    expect(mockedApi.post).toHaveBeenCalledWith('/appointments/appt-1/checkin')
    await waitFor(() => expect(screen.getByText(/checked in/i)).toBeInTheDocument())
    expect(window.alert).not.toHaveBeenCalled()
  })

  // Protects the fix made earlier this session: this failure used to be
  // swallowed with only a console.error, leaving staff unaware check-in failed.
  it('alerts the user when check-in fails, and leaves the appointment scheduled', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [scheduledAppointment] })
    mockedApi.post.mockRejectedValueOnce(new Error('server error'))
    const user = userEvent.setup()
    renderAppointments()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /check in/i }))

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to check in'))
    expect(screen.getByRole('button', { name: /check in/i })).toBeInTheDocument()
  })

  it('confirms a scheduled appointment', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [scheduledAppointment] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderAppointments()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /confirm(?!ed)/i }))

    expect(mockedApi.put).toHaveBeenCalledWith('/appointments/appt-1', {
      patientId: 'pat-1',
      status: 'confirmed',
    })
    // "Confirmed" also appears as a static filter-chip label regardless of any
    // appointment's actual status, so assert on the resulting action buttons
    // instead (Complete/Cancel only show for a confirmed appointment).
    await waitFor(() => expect(screen.getByRole('button', { name: /complete(?!d)/i })).toBeInTheDocument())
    expect(window.alert).not.toHaveBeenCalled()
  })

  // Same fix, the other silently-swallowed call site.
  it('alerts the user when a status change fails', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [scheduledAppointment] })
    mockedApi.put.mockRejectedValueOnce(new Error('server error'))
    const user = userEvent.setup()
    renderAppointments()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /confirm(?!ed)/i }))

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to update appointment status'))
    expect(screen.getByRole('button', { name: /confirm(?!ed)/i })).toBeInTheDocument()
  })
})
