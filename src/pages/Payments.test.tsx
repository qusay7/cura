import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Payments from './Payments'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const payment = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'pay-1',
  appointmentId: 'appt-1',
  patientName: 'Sara Ahmad',
  totalAmount: 250,
  insuranceAmount: 20,
  patientAmount: 80,
  amountPaid: 80,
  patientBalance: 0,
  paymentMethod: 'cash',
  claimStatus: null,
  createdAt: '2026-01-01',
  ...overrides,
})

const statsData = {
  totalRevenue: 1000, totalCollected: 800, pendingInsurance: 100, patientOwes: 50,
  monthRevenue: 200, monthCollected: 150, paidCount: 5, unpaidCount: 2, byMethod: [],
}

// Default: neutral stats and an empty payments page, via a persistent
// implementation so refetches (filters, pagination, row expansion) keep
// working without needing a once-queue.
function mockPaymentsGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of Object.keys(overrides)) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url === '/payments/stats') return Promise.resolve({ data: statsData })
    if (url.startsWith('/payments?')) return Promise.resolve({ data: { payments: [], pages: 1 } })
    if (url.startsWith('/appointments/appt-1/visit-types')) return Promise.resolve({ data: [] })
    if (url.startsWith('/visitnotes/appointment/')) return Promise.reject(new Error('no note'))
    if (url.startsWith('/appointments/')) return Promise.resolve({ data: { doctorName: 'Dr. Ali', type: 'Checkup' } })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderPayments() {
  render(
    <MemoryRouter initialEntries={['/payments']}>
      <Routes>
        <Route path="/payments" element={<Payments />} />
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/appointments/:id" element={<div>appointment detail page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Payments', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('redirects to /login when loading fails with a 401', async () => {
    const unauthorized = Object.assign(new Error('unauthorized'), { response: { status: 401 } })
    mockPaymentsGets({ '/payments?': unauthorized })
    renderPayments()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('renders the summary stats', async () => {
    mockPaymentsGets()
    renderPayments()

    expect(await screen.findByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('1,000.00 JD')).toBeInTheDocument()
  })

  it('shows the empty state when there are no payments', async () => {
    mockPaymentsGets()
    renderPayments()

    expect(await screen.findByText('No data available')).toBeInTheDocument()
  })

  it('renders a payment row', async () => {
    mockPaymentsGets({ '/payments?': { payments: [payment()], pages: 1 } })
    renderPayments()

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByText('250.00 JD')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
  })

  it('expands a row to load and show visit details', async () => {
    mockPaymentsGets({ '/payments?': { payments: [payment()], pages: 1 } })
    const user = userEvent.setup()
    renderPayments()
    const nameCell = await screen.findByText('Sara Ahmad')

    await user.click(nameCell)

    expect(await screen.findByText('Dr. Ali')).toBeInTheDocument()
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/appointments/appt-1'))
  })

  it('navigates to the appointment without expanding the row', async () => {
    mockPaymentsGets({ '/payments?': { payments: [payment()], pages: 1 } })
    const user = userEvent.setup()
    renderPayments()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: '📅' }))

    expect(await screen.findByText('appointment detail page')).toBeInTheDocument()
  })

  it('re-fetches with the paid filter applied', async () => {
    mockPaymentsGets({ '/payments?': { payments: [payment()], pages: 1 } })
    const user = userEvent.setup()
    renderPayments()
    await screen.findByText('Sara Ahmad')

    await user.selectOptions(screen.getByRole('combobox'), 'paid')
    await user.click(screen.getByRole('button', { name: /^apply$/i }))

    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('isPaid=true'))
    )
  })
})
