import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AppointmentDetail from './AppointmentDetail'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — irrelevant
// decoration for the brief loading screen these tests pass through.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

const mockedApi = vi.mocked(api, true)

const appointment = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'appt-1',
  patientId: 'pat-1',
  patientName: 'Sara Ahmad',
  doctorId: 'doc-1',
  doctorName: 'Dr. Ali',
  appointmentDate: '2026-01-15T09:00:00',
  type: 'Checkup',
  status: 'confirmed',
  price: 25,
  ...overrides,
})

// Default: appointment loads, but no visit note or payment exists (matching
// the component's own internal .catch() fallbacks), so every test starts
// from a clean, settled screen unless it overrides a URL.
function mockDetailGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/appointments/appt-1') return Promise.resolve({ data: appointment() })
    if (url === '/visitnotes/appointment/appt-1') return Promise.reject(new Error('no note'))
    if (url === '/payments/appointment/appt-1') return Promise.reject(new Error('no payment'))
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderDetail() {
  render(
    <MemoryRouter initialEntries={['/appointments/appt-1']}>
      <Routes>
        <Route path="/appointments/:id" element={<AppointmentDetail />} />
        <Route path="/appointments/:id/edit" element={<div>edit appointment page</div>} />
        <Route path="/appointments" element={<div>appointments list page</div>} />
        <Route path="/patients/:id" element={<div>patient detail page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AppointmentDetail', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows the not-found state and returns to the appointments list', async () => {
    mockDetailGets({ '/appointments/appt-1': new Error('not found') })
    const user = userEvent.setup()
    renderDetail()

    expect(await screen.findByText('Appointment not found')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(await screen.findByText('appointments list page')).toBeInTheDocument()
  })

  it("renders the appointment's patient, doctor, price and status", async () => {
    mockDetailGets()
    renderDetail()

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByText('Dr. Ali')).toBeInTheDocument()
    expect(screen.getByText('25 JD')).toBeInTheDocument()
    expect(screen.getByText('Confirmed', { exact: false })).toBeInTheDocument()
  })

  it('shows empty states when there is no visit note or payment', async () => {
    mockDetailGets()
    renderDetail()

    expect(await screen.findByText('No visit note recorded for this appointment')).toBeInTheDocument()
    expect(screen.getByText('No payment recorded for this appointment')).toBeInTheDocument()
  })

  it('renders the visit note when one exists', async () => {
    mockDetailGets({
      '/visitnotes/appointment/appt-1': {
        id: 'note-1', diagnosis: 'Flu', prescription: 'Rest and fluids', tests: 'Blood test', notes: 'Follow up in a week',
      },
    })
    renderDetail()

    await screen.findByText('Sara Ahmad')
    expect(screen.getByText('Flu')).toBeInTheDocument()
    expect(screen.getByText('Rest and fluids')).toBeInTheDocument()
    expect(screen.getByText('Blood test')).toBeInTheDocument()
  })

  it('renders payment details and the fully-paid badge', async () => {
    mockDetailGets({
      '/payments/appointment/appt-1': {
        hasPayment: true, totalAmount: 30, amountPaid: 20, paymentMethod: 'cash', isPaid: true,
      },
    })
    renderDetail()

    await screen.findByText('Sara Ahmad')
    expect(screen.getByText('30 JD')).toBeInTheDocument()
    expect(screen.getByText('20 JD')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getByText('Fully Paid', { exact: false })).toBeInTheDocument()
  })

  it('navigates to the edit page from quick actions', async () => {
    mockDetailGets()
    const user = userEvent.setup()
    renderDetail()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /edit appointment/i }))

    expect(await screen.findByText('edit appointment page')).toBeInTheDocument()
  })

  it("navigates to the patient's file from quick actions", async () => {
    mockDetailGets()
    const user = userEvent.setup()
    renderDetail()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /patient file/i }))

    expect(await screen.findByText('patient detail page')).toBeInTheDocument()
  })
})
