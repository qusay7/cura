import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
import api from '../api/axios'
import type { DashboardData } from '../types'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — irrelevant
// decoration for the brief loading screen these tests pass through.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

const mockedApi = vi.mocked(api, true)

// The non-SuperAdmin dashboard pads "loading" to at least 1200ms regardless
// of how fast the API resolves, so the loading screen needs a generous wait.
const LOADING_TIMEOUT = { timeout: 2500 }

const baseDashboardData: DashboardData = {
  type: 'clinic',
  totalPatients: 120,
  totalDoctors: 4,
  totalStaff: 6,
  totalAppointments: 300,
  todayAppointments: 8,
  upcomingAppointments: 15,
  subscription: null,
}

function mockDashboardGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/dashboard') return Promise.resolve({ data: baseDashboardData })
    if (url === '/appointments/today-by-doctor') return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderDashboard() {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/superadmin/clinics" element={<div>superadmin clinics page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('redirects to /login when the dashboard summary fails to load', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin', fullName: 'Sara' }))
    mockDashboardGets({ '/dashboard': new Error('unauthorized') })
    renderDashboard()

    expect(await screen.findByText('login page', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
  })

  it('shows patient and appointment stats, hiding quick actions the user lacks permission for', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin', fullName: 'Sara' }))
    localStorage.setItem('permissions', JSON.stringify([]))
    mockDashboardGets()
    renderDashboard()

    expect(await screen.findByText('120', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add patient/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Staff')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /quick visit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /book appointment/i })).not.toBeInTheDocument()
  })

  it('shows the staff card and quick-action buttons when the user has the right permissions', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin', fullName: 'Sara' }))
    localStorage.setItem('permissions', JSON.stringify(['patients.create', 'staff.view', 'appointments.create']))
    mockDashboardGets()
    renderDashboard()

    await screen.findByText('120', undefined, LOADING_TIMEOUT)
    expect(screen.getByRole('button', { name: /add patient/i })).toBeInTheDocument()
    expect(screen.getByText('Staff')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add staff/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quick visit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /book appointment/i })).toBeInTheDocument()
  })

  it('renders the subscription section with remaining days and usage bars', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin', fullName: 'Sara' }))
    localStorage.setItem('permissions', JSON.stringify([]))
    mockDashboardGets({
      '/dashboard': {
        ...baseDashboardData,
        subscription: {
          planName: 'Standard',
          billingCycle: 'monthly',
          endDate: '2026-12-01',
          daysRemaining: 5,
          maxPatients: 1000,
          maxDoctors: 5,
          maxUsers: 10,
          currentPatients: 300,
          currentDoctors: 2,
        },
      },
    })
    renderDashboard()

    await screen.findByText('Standard', undefined, LOADING_TIMEOUT)
    expect(screen.getByText(/remaining/i)).toBeInTheDocument()
    expect(screen.getByText('Days Left')).toBeInTheDocument()
  })

  it('renders platform-wide stats and clinic/plan summaries for a SuperAdmin user', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'SuperAdmin', fullName: 'Admin' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/clinics') {
        return Promise.resolve({
          data: [
            { id: 'c1', name: 'Clinic One', isActive: true, ownerName: 'Owner', phone: '123' },
            { id: 'c2', name: 'Clinic Two', isActive: false, ownerName: 'Owner2', phone: '456' },
          ],
        })
      }
      if (url === '/plans') {
        return Promise.resolve({
          data: [{ id: 'p1', name: 'Basic', isActive: true, monthlyPrice: 20, yearlyPrice: 199, maxDoctors: 2, maxPatients: 300 }],
        })
      }
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderDashboard()

    expect(await screen.findByText('Clinic One')).toBeInTheDocument()
    expect(screen.getByText('Clinic Two')).toBeInTheDocument()
    expect(screen.getByText('Total Clinics')).toBeInTheDocument()
    expect(screen.getByText(/basic/i)).toBeInTheDocument()
  })

  it('redirects a SuperAdmin to /login when clinics or plans fail to load', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'SuperAdmin', fullName: 'Admin' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/clinics') return Promise.reject(new Error('server error'))
      if (url === '/plans') return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderDashboard()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('navigates to the clinics management page when its nav button is clicked', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'SuperAdmin', fullName: 'Admin' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/clinics') return Promise.resolve({ data: [] })
      if (url === '/plans') return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    const user = userEvent.setup()
    renderDashboard()

    await user.click(await screen.findByRole('button', { name: /clinics/i }))

    expect(await screen.findByText('superadmin clinics page')).toBeInTheDocument()
  })
})
