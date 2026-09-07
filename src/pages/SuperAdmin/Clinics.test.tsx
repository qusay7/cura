import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SuperAdminClinics from './Clinics'
import api from '../../api/axios'

vi.mock('../../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const clinic = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'clinic-1',
  name: 'Al Amal Clinic',
  subdomain: 'alamal',
  phone: '0501234567',
  email: 'clinic@example.com',
  ownerName: 'Ahmed',
  isActive: true,
  createdAt: '2026-01-01',
  ...overrides,
})

const activePlan = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'plan-1',
  name: 'Basic',
  monthlyPrice: 20,
  yearlyPrice: 199,
  maxDoctors: 2,
  maxPatients: 300,
  maxUsers: 3,
  isActive: true,
  ...overrides,
})

function futureDateISO(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString()
}

// Default: clinics, plans and subscriptions all resolve empty, so every test
// starts from a clean, settled screen unless it overrides a URL.
function mockClinicsGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/clinics') return Promise.resolve({ data: [] })
    if (url === '/plans') return Promise.resolve({ data: [] })
    if (url === '/subscriptions') return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderClinics() {
  render(
    <MemoryRouter initialEntries={['/superadmin/clinics']}>
      <Routes>
        <Route path="/superadmin/clinics" element={<SuperAdminClinics />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SuperAdminClinics', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.alert = vi.fn()
  })

  it('redirects to /login when the clinics list fails to load', async () => {
    mockClinicsGets({ '/clinics': new Error('unauthorized') })
    renderClinics()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('shows the empty state when there are no clinics', async () => {
    mockClinicsGets()
    renderClinics()

    expect(await screen.findByText('No clinics registered')).toBeInTheDocument()
  })

  it("renders a clinic row with its owner, subscription and active status", async () => {
    mockClinicsGets({
      '/clinics': [clinic()],
      '/subscriptions': [{
        id: 'sub-1',
        clinicId: 'clinic-1',
        planName: 'Standard',
        billingCycle: 'monthly',
        pricePaid: 29,
        startDate: '2026-01-01',
        endDate: futureDateISO(30),
        isActive: true,
      }],
    })
    renderClinics()

    expect(await screen.findByText('Al Amal Clinic')).toBeInTheDocument()
    expect(screen.getByText('alamal')).toBeInTheDocument()
    expect(screen.getByText('Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('disables the save button until a subscription plan is selected', async () => {
    mockClinicsGets({ '/plans': [activePlan()] })
    const user = userEvent.setup()
    renderClinics()
    await screen.findByText('No clinics registered')

    await user.click(screen.getByRole('button', { name: /add clinic/i }))
    await user.type(screen.getByPlaceholderText('Al Amal Clinic'), 'Test Clinic')
    await user.type(screen.getByPlaceholderText('alamal'), 'testclinic')

    expect(screen.getByRole('button', { name: /save clinic/i })).toBeDisabled()

    await user.click(await screen.findByText('Basic', { exact: false }))

    expect(screen.getByRole('button', { name: /save clinic/i })).not.toBeDisabled()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('creates a clinic, admin, subscription and default roles, then shows the generated credentials', async () => {
    mockClinicsGets({ '/plans': [activePlan()] })
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/clinics') return Promise.resolve({ data: { id: 'new-clinic-id' } })
      return Promise.resolve({ data: {} })
    })
    const user = userEvent.setup()
    renderClinics()
    await screen.findByText('No clinics registered')

    await user.click(screen.getByRole('button', { name: /add clinic/i }))
    await user.type(screen.getByPlaceholderText('Al Amal Clinic'), 'Test Clinic')
    await user.type(screen.getByPlaceholderText('alamal'), 'testclinic')
    await user.click(await screen.findByText('Basic', { exact: false }))
    await user.click(screen.getByRole('button', { name: /save clinic/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/clinics',
        expect.objectContaining({ name: 'Test Clinic', subDomain: 'testclinic' })
      )
    )
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({ username: 'testclinic', role: 'ClinicAdmin' })
    )
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/subscriptions',
      expect.objectContaining({ clinicId: 'new-clinic-id', planId: 'plan-1' })
    )
    expect(mockedApi.post).toHaveBeenCalledWith('/roles/seed-defaults/new-clinic-id')
    expect(mockedApi.post).toHaveBeenCalledWith('/departments/seed-defaults/new-clinic-id')
    expect(await screen.findByText(/testclinic/i)).toBeInTheDocument()
  })

  it('toggles a clinic active/inactive', async () => {
    mockClinicsGets({ '/clinics': [clinic({ isActive: true })] })
    mockedApi.patch.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderClinics()
    await screen.findByText('Al Amal Clinic')

    await user.click(screen.getByRole('button', { name: /deactivate/i }))

    expect(mockedApi.patch).toHaveBeenCalledWith('/clinics/clinic-1/toggle')
    expect(await screen.findByRole('button', { name: /activate/i })).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('shows an inline error banner when toggling a clinic fails', async () => {
    mockClinicsGets({ '/clinics': [clinic()] })
    mockedApi.patch.mockRejectedValueOnce(new Error('server error'))
    const user = userEvent.setup()
    renderClinics()
    await screen.findByText('Al Amal Clinic')

    await user.click(screen.getByRole('button', { name: /deactivate/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
