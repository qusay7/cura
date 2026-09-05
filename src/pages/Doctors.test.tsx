import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Doctors from './Doctors'
import api from '../api/axios'
import type { Doctor } from '../types'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
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

const doctor = (overrides: Partial<Doctor> = {}): Doctor => ({
  id: 'doc-1',
  fullName: 'Dr. Ali Hassan',
  specialty: 'cardiology',
  phone: '0501234567',
  email: 'ali@example.com',
  isActive: true,
  clinicId: 'clinic-1',
  createdAt: '2026-01-01',
  gender: 'male',
  ...overrides,
})

function renderDoctors() {
  render(
    <MemoryRouter initialEntries={['/doctors']}>
      <Routes>
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/add" element={<div>add doctor page</div>} />
        <Route path="/doctors/:id/edit" element={<div>doctor edit page</div>} />
        <Route path="/doctors/:id" element={<div>doctor detail page</div>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Doctors', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('redirects to /login when the doctors list fails to load', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('unauthorized'))
    renderDoctors()

    expect(await screen.findByText('login page', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
  })

  it('lists a doctor with translated specialty, phone and active status, and updates the header count', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: [doctor()] })
    renderDoctors()

    expect(await screen.findByText('Dr. Ali Hassan', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(screen.getByText('Cardiology')).toBeInTheDocument()
    expect(screen.getByText('0501234567')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText(/1 registered doctors/i)).toBeInTheDocument()
  })

  it('hides the Add Doctor button when the user lacks permission', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderDoctors()

    await screen.findByText('No doctors found', undefined, LOADING_TIMEOUT)
    expect(screen.queryByRole('button', { name: /add doctor/i })).not.toBeInTheDocument()
  })

  it('shows the Add Doctor button when the user has permission', async () => {
    localStorage.setItem('permissions', JSON.stringify(['doctors.create']))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderDoctors()

    await screen.findByText('No doctors found', undefined, LOADING_TIMEOUT)
    expect(screen.getByRole('button', { name: /add doctor/i })).toBeInTheDocument()
  })

  it('hides the per-doctor Edit button when the user lacks permission', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: [doctor()] })
    renderDoctors()

    await screen.findByText('Dr. Ali Hassan', undefined, LOADING_TIMEOUT)
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })

  it('navigates to the edit page — not the detail page — when Edit is clicked', async () => {
    localStorage.setItem('permissions', JSON.stringify(['doctors.edit']))
    mockedApi.get.mockResolvedValueOnce({ data: [doctor()] })
    const user = userEvent.setup()
    renderDoctors()
    await screen.findByText('Dr. Ali Hassan', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(await screen.findByText('doctor edit page')).toBeInTheDocument()
  })

  it('filters the list by specialty as the user types', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: [doctor(), doctor({ id: 'doc-2', fullName: 'Dr. Lina Odeh', specialty: 'dermatology' })],
    })
    const user = userEvent.setup()
    renderDoctors()
    await screen.findByText('Dr. Ali Hassan', undefined, LOADING_TIMEOUT)

    await user.type(screen.getByPlaceholderText(/search by name/i), 'dermatology')

    expect(screen.getByText('Dr. Lina Odeh')).toBeInTheDocument()
    expect(screen.queryByText('Dr. Ali Hassan')).not.toBeInTheDocument()
  })

  it("navigates to the doctor's detail page when the card is clicked", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [doctor()] })
    const user = userEvent.setup()
    renderDoctors()
    await screen.findByText('Dr. Ali Hassan', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByText('Dr. Ali Hassan'))

    expect(await screen.findByText('doctor detail page')).toBeInTheDocument()
  })
})
