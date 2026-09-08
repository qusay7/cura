import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Insurance from './Insurance'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const company = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'ins-1',
  name: 'Bupa',
  nameEn: 'Bupa Insurance',
  coverageRate: 80,
  contactName: 'John',
  phone: '0791234567',
  patientsCount: 5,
  isActive: true,
  ...overrides,
})

const claim = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'claim-1',
  claimNumber: 'CLM-001',
  patientName: 'Sara Ahmad',
  companyName: 'Bupa',
  totalAmount: 100,
  insuranceAmount: 80,
  patientAmount: 20,
  serviceDate: '2026-01-01',
  status: 'pending',
  approvalNumber: null,
  rejectionReason: null,
  notes: null,
  ...overrides,
})

const statsData = { total: 1, pending: 1, approved: 0, paidAmount: 0, pendingAmount: 20 }

// Default: an empty companies list, empty claim stats, and no claims — all
// via a persistent implementation so refetches after save/delete keep
// working without needing to re-queue values.
function mockInsuranceGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of Object.keys(overrides)) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url === '/insurance/companies') return Promise.resolve({ data: [] })
    if (url === '/insurance/claims/stats') return Promise.resolve({ data: statsData })
    if (url.startsWith('/insurance/claims?')) return Promise.resolve({ data: { claims: [], total: 0, pages: 1 } })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderInsurance() {
  render(
    <MemoryRouter initialEntries={['/insurance']}>
      <Routes>
        <Route path="/insurance" element={<Insurance />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Insurance', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('permissions', JSON.stringify(['insurance.manage']))
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('redirects to /login when loading fails with a 401', async () => {
    const unauthorized = Object.assign(new Error('unauthorized'), { response: { status: 401 } })
    mockInsuranceGets({ '/insurance/companies': unauthorized })
    renderInsurance()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('shows the empty state when there are no companies', async () => {
    mockInsuranceGets()
    renderInsurance()

    expect(await screen.findByText('No data available')).toBeInTheDocument()
  })

  it('renders a company row with coverage, contact and active status', async () => {
    mockInsuranceGets({ '/insurance/companies': [company()] })
    renderInsurance()

    expect(await screen.findByText('Bupa')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Active', { selector: 'span.badge' })).toBeInTheDocument()
  })

  it('adds a new insurance company', async () => {
    mockInsuranceGets()
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderInsurance()
    await screen.findByText('No data available')

    await user.click(screen.getByRole('button', { name: /add company/i }))
    await user.type(screen.getByPlaceholderText('Company Name'), 'Bupa')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/insurance/companies?lang=en',
        expect.objectContaining({ name: 'Bupa', coverageRate: 80 })
      )
    )
  })

  it('pre-fills the form when editing a company, and submits a PUT', async () => {
    mockInsuranceGets({ '/insurance/companies': [company()] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderInsurance()
    await screen.findByText('Bupa')

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = screen.getByDisplayValue('Bupa')
    await user.clear(nameInput)
    await user.type(nameInput, 'Bupa Health')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/insurance/companies/ins-1?lang=en',
        expect.objectContaining({ name: 'Bupa Health' })
      )
    )
  })

  it('deletes a company after confirmation', async () => {
    mockInsuranceGets({ '/insurance/companies': [company()] })
    mockedApi.delete.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderInsurance()
    await screen.findByText('Bupa')

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/insurance/companies/ins-1?lang=en'))
  })

  it('switches to the Claims tab and renders a claim row', async () => {
    mockInsuranceGets({ '/insurance/claims?': { claims: [claim()], total: 1, pages: 1 } })
    const user = userEvent.setup()
    renderInsurance()
    await screen.findByText('No data available')

    await user.click(screen.getByRole('button', { name: /claims/i }))

    expect(await screen.findByText('CLM-001')).toBeInTheDocument()
    expect(screen.getByText('Sara Ahmad')).toBeInTheDocument()
  })

  it('updates a claim status via the modal', async () => {
    mockInsuranceGets({ '/insurance/claims?': { claims: [claim()], total: 1, pages: 1 } })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderInsurance()
    await screen.findByText('No data available')
    await user.click(screen.getByRole('button', { name: /claims/i }))
    await screen.findByText('CLM-001')

    await user.click(screen.getByRole('button', { name: /update status/i }))
    // Two <select>s exist once the modal is open (the tab's status filter and
    // the modal's own status field) — the modal's is the last in DOM order.
    const comboboxes = screen.getAllByRole('combobox')
    await user.selectOptions(comboboxes[comboboxes.length - 1], 'approved')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/insurance/claims/claim-1/status?lang=en',
        expect.objectContaining({ status: 'approved' })
      )
    )
  })
})
