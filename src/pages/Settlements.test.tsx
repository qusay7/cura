import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settlements from './Settlements'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), defaults: { baseURL: '/api' } },
}))

const mockedApi = vi.mocked(api, true)

const duesData = {
  totalDue: 50,
  count: 1,
  items: [
    { id: 'due-1', patientName: 'Sara Ahmad', total: 100, paid: 50, balance: 50, date: '2026-01-01', appointmentId: 'appt-1', hasPaymentRecord: true, rowVersion: 'v1' },
  ],
}

// Default: no clinic lookup (no clinicId in localStorage), empty dues/doctors/
// companies/pending lists, and an empty history — all via a persistent
// implementation so switching tabs and refetching keep working without a
// once-queue. Override keys are matched longest-prefix-first so a specific
// endpoint (e.g. a doctor's pending list) always wins over the general
// '/settlements' history route.
function mockSettlementsGets(overrides: Record<string, unknown> = {}) {
  const keys = Object.keys(overrides).sort((a, b) => b.length - a.length)
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of keys) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url === '/settlements/patients-dues') return Promise.resolve({ data: { totalDue: 0, count: 0, items: [] } })
    if (url === '/doctors') return Promise.resolve({ data: [] })
    if (url === '/insurance/companies') return Promise.resolve({ data: [] })
    if (url.startsWith('/settlements/doctor/')) return Promise.resolve({ data: { totalCommission: 0, count: 0, items: [] } })
    if (url.startsWith('/settlements/insurance/')) return Promise.resolve({ data: { totalAmount: 0, count: 0, items: [] } })
    if (url.startsWith('/settlements')) return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

describe('Settlements', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('permissions', JSON.stringify(['settlements.manage', 'insurance.manage', 'payments.manage']))
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('switches between the settlement tabs', async () => {
    mockSettlementsGets()
    const user = userEvent.setup()
    render(<Settlements />)
    await screen.findByText('No data')

    await user.click(screen.getByRole('button', { name: /doctor payouts/i }))
    expect(screen.getByRole('button', { name: /select a doctor/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /insurance settlements/i }))
    expect(screen.getByRole('button', { name: /select insurance company/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /settlement history/i }))
    expect(await screen.findByText('No data')).toBeInTheDocument()
  })

  it('renders a patient due and opens the payment modal', async () => {
    mockSettlementsGets({ '/settlements/patients-dues': duesData })
    const user = userEvent.setup()
    render(<Settlements />)

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^💳 pay$/i }))

    expect(await screen.findByText('Settle Due', { exact: false })).toBeInTheDocument()
  })

  it('records a payment for a patient due', async () => {
    mockSettlementsGets({ '/settlements/patients-dues': duesData })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    render(<Settlements />)
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /^💳 pay$/i }))
    await user.type(screen.getByPlaceholderText('0.00'), '20')
    await user.click(screen.getByRole('button', { name: /^✅ pay$/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/payments/due-1', expect.objectContaining({ amountPaid: 70 }))
    )
  })

  it('filters patient dues by name', async () => {
    mockSettlementsGets({
      '/settlements/patients-dues': {
        totalDue: 110,
        count: 2,
        items: [
          duesData.items[0],
          { id: 'due-2', patientName: 'Omar Khalil', total: 60, paid: 0, balance: 60, date: '2026-01-02', appointmentId: 'appt-2', hasPaymentRecord: false },
        ],
      },
    })
    const user = userEvent.setup()
    render(<Settlements />)
    await screen.findByText('Sara Ahmad')

    await user.type(screen.getByPlaceholderText('Search patient name...'), 'Omar')

    expect(screen.getByText('Omar Khalil')).toBeInTheDocument()
    expect(screen.queryByText('Sara Ahmad')).not.toBeInTheDocument()
  })

  it("searches a doctor's pending commissions and settles the selected items", async () => {
    mockSettlementsGets({
      '/doctors': [{ id: 'doc-1', fullName: 'Dr. Ali', isActive: true }],
      '/settlements/doctor/doc-1/pending': {
        totalCommission: 30,
        count: 1,
        items: [{ id: 'appt-1', appointmentDate: '2026-01-05', patientName: 'Omar Khalil', type: 'Checkup', doctorCommissionAmount: 30 }],
      },
    })
    mockedApi.post.mockResolvedValueOnce({ data: { status: 'full' } })
    const user = userEvent.setup()
    render(<Settlements />)
    await screen.findByText('No data')

    await user.click(screen.getByRole('button', { name: /doctor payouts/i }))
    await user.click(screen.getByRole('button', { name: /select a doctor/i }))
    await user.click(await screen.findByText('Dr. Ali'))
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByText('Omar Khalil')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /register settlement/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/settlements/doctor',
        expect.objectContaining({ doctorId: 'doc-1', appointmentIds: ['appt-1'] })
      )
    )
  })

  it('submits a pending insurance claims batch', async () => {
    mockSettlementsGets({
      '/insurance/companies': [{ id: 'ins-1', name: 'Bupa' }],
      '/settlements/insurance/ins-1/claims': {
        totalAmount: 50,
        count: 1,
        items: [{ id: 'claim-1', serviceDate: '2026-01-05', claimNumber: 'CLM-1', patientName: 'Sara Ahmad', insuranceAmount: 50 }],
      },
    })
    mockedApi.post.mockResolvedValueOnce({ data: { message: 'Submitted!' } })
    const user = userEvent.setup()
    render(<Settlements />)
    await screen.findByText('No data')

    await user.click(screen.getByRole('button', { name: /insurance settlements/i }))
    await user.click(screen.getByRole('button', { name: /select insurance company/i }))
    await user.click(await screen.findByText('Bupa'))
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(await screen.findByText('CLM-1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /submit batch/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/settlements/insurance/submit-batch',
        expect.objectContaining({ insuranceCompanyId: 'ins-1' })
      )
    )
  })

  it('loads settlement history', async () => {
    mockSettlementsGets({
      '/settlements': [
        { type: 'doctor', doctorName: 'Dr. Ali', periodStart: '2026-01-01', periodEnd: '2026-01-31', totalAmount: 100, paymentMethod: 'cash', createdAt: '2026-02-01' },
      ],
    })
    const user = userEvent.setup()
    render(<Settlements />)
    await screen.findByText('No data')

    await user.click(screen.getByRole('button', { name: /settlement history/i }))

    expect(await screen.findByText('Dr. Ali')).toBeInTheDocument()
  })
})
