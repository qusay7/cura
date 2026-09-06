import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Reports from './Reports'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const reportsData = {
  totalPatients: 100, newPatientsThisMonth: 5, patientsGrowth: 10,
  totalAppointments: 50, appointmentsThisMonth: 8,
  totalDoctors: 3,
  totalRevenue: 5000, revenueThisMonth: 500, revenueGrowth: 4,
  completionRate: 80, cancellationRate: 5,
  avgWaitMinutes: 12, avgVisitMinutes: 20,
  returningPatients: 30, returningRate: 30,
  completedCount: 40, scheduledCount: 8, cancelledCount: 2,
  monthlyTrend: [], byDayOfWeek: [], byHour: [],
  visitTypes: [], genderDist: [],
  topPatients: [{ patientName: 'Sara Ahmad', visits: 4, totalSpent: 200, lastVisit: '2026-01-01T00:00:00' }],
  doctorPerformance: [
    { doctorName: 'Dr. Ali', specialty: 'Dermatology', totalAppts: 20, completedAppts: 18, cancelledAppts: 1, completionRate: 90, revenue: 1000, thisMonthAppts: 3 },
  ],
}

const doctorsData = [{ id: 'doc-1', fullName: 'Dr. Ali', isActive: true }]

function mockReportsGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of Object.keys(overrides)) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url === '/reports') return Promise.resolve({ data: reportsData })
    if (url === '/doctors') return Promise.resolve({ data: doctorsData })
    if (url === '/reports/patients') return Promise.reject(new Error('no patients report'))
    if (url === '/reports/appointments') return Promise.reject(new Error('no appointments report'))
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderReports() {
  render(
    <MemoryRouter initialEntries={['/reports']}>
      <Routes>
        <Route path="/reports" element={<Reports />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Reports', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.print = vi.fn()
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  it('redirects to /login when the main report fails with a 401', async () => {
    const unauthorized = Object.assign(new Error('unauthorized'), { response: { status: 401 } })
    mockReportsGets({ '/reports': unauthorized })
    renderReports()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('renders the overview stats', async () => {
    mockReportsGets()
    renderReports()

    expect(await screen.findByText('Total Patients')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('5,000 JD')).toBeInTheDocument()
  })

  it('renders the top patients table', async () => {
    mockReportsGets()
    renderReports()

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByText('200 JD')).toBeInTheDocument()
  })

  it('switches to the Doctors tab and shows doctor performance', async () => {
    mockReportsGets()
    const user = userEvent.setup()
    renderReports()
    await screen.findByText('Total Patients')

    await user.click(screen.getByRole('button', { name: /doctors/i }))

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Dr. Ali')).toBeInTheDocument()
    expect(within(table).getByText('Dermatology')).toBeInTheDocument()
  })

  it('filters doctor performance by the selected doctor', async () => {
    mockReportsGets()
    const user = userEvent.setup()
    renderReports()
    await screen.findByText('Total Patients')

    const [doctorSelect] = screen.getAllByRole('combobox')
    await user.selectOptions(doctorSelect, 'doc-1')
    await user.click(screen.getByRole('button', { name: /doctors/i }))

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Dr. Ali')).toBeInTheDocument()
  })

  it('switches to the Patients tab when patient report data is available', async () => {
    mockReportsGets({
      '/reports/patients': { total: 100, newThisMonth: 5, returning: 30, active: 80, monthly: [], genderDist: [], ageDist: [] },
    })
    const user = userEvent.setup()
    renderReports()
    await screen.findByText('Total Patients')

    await user.click(screen.getByRole('button', { name: /patients/i }))

    expect(await screen.findByText('Active Patients')).toBeInTheDocument()
  })

  it('switches to the Appointments tab when appointment report data is available', async () => {
    mockReportsGets({
      '/reports/appointments': { total: 50, completed: 40, cancelled: 2, avgVisitMinutes: 20, byStatus: [], byType: [], byDayOfWeek: [], byHour: [] },
    })
    const user = userEvent.setup()
    renderReports()
    await screen.findByText('Total Patients')

    await user.click(screen.getByRole('button', { name: /appointments/i }))

    expect(await screen.findByText('Avg. Visit Duration', { exact: false })).toBeInTheDocument()
  })

  it('fetches and shows detail rows in the Detail tab', async () => {
    mockReportsGets({
      '/reports/detail': {
        summary: { total: 1, completed: 1, cancelled: 0, totalRevenue: 30 },
        items: [{ patientNumber: 1, patientName: 'Sara Ahmad', doctorName: 'Dr. Ali', date: '2026-01-01', time: '09:00', status: 'completed', type: 'Checkup', price: 30 }],
        pages: 1,
      },
    })
    const user = userEvent.setup()
    renderReports()
    await screen.findByText('Total Patients')

    await user.click(screen.getByRole('button', { name: /^📋 detail$/i }))
    await user.click(screen.getByRole('button', { name: /apply/i }))

    expect(await screen.findByText('Sara Ahmad', { exact: false })).toBeInTheDocument()
  })

  it('applies a custom date range and shows the range summary', async () => {
    mockReportsGets({
      '/reports/range': { totalAppointments: 10, completed: 8, cancelled: 1, revenue: 300, byDay: [], doctorPerformance: [] },
    })
    const user = userEvent.setup()
    renderReports()
    await screen.findByText('Total Patients')

    await user.click(screen.getByRole('button', { name: /custom range/i }))
    const [fromInput, toInput] = screen.getAllByDisplayValue('')
    fireEvent.change(fromInput, { target: { value: '2026-01-01' } })
    fireEvent.change(toInput, { target: { value: '2026-01-31' } })
    await user.click(screen.getByRole('button', { name: /^apply$/i }))

    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('/reports/range?from=2026-01-01&to=2026-01-31'))
    )
  })

  it('triggers the print dialog from the export bar', async () => {
    mockReportsGets()
    const user = userEvent.setup()
    renderReports()
    await screen.findByText('Total Patients')

    await user.click(screen.getByRole('button', { name: /print \/ pdf/i }))

    expect(window.print).toHaveBeenCalled()
  })
})
