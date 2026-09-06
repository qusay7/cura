import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import DoctorCalendar from './DoctorCalendar'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const doctorsList = () => [{ id: 'doc-1', fullName: 'Dr. Ali', specialty: 'Cardiology' }]

const calendarData = (overrides: Partial<Record<string, unknown>> = {}) => ({
  doctorId: 'doc-1',
  doctorName: 'Dr. Ali',
  from: '2026-02-08',
  to: '2026-02-14',
  days: [
    {
      date: '2026-02-10T00:00:00',
      dayOfWeek: 2,
      isWorkingDay: true,
      isAbsent: false,
      slots: [{ start: '09:00', end: '09:30', status: 'available' }],
    },
  ],
  ...overrides,
})

// Default: one doctor and an empty calendar, via a persistent implementation
// so re-fetches when navigating the calendar (prev/next/view) keep working.
function mockCalendarGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of Object.keys(overrides)) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url === '/doctors') return Promise.resolve({ data: doctorsList() })
    if (url.startsWith('/schedules/doctor/doc-1/calendar')) return Promise.resolve({ data: calendarData({ days: [] }) })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

// Shows the incoming doctorId (if any) so a test can assert it was carried
// over in the link to the daily schedule, without inspecting router internals.
function DailyScheduleStub() {
  const [params] = useSearchParams()
  return <div>daily schedule page (doctorId={params.get('doctorId') || 'none'})</div>
}

function renderDoctorCalendar(initialEntry = '/doctor-calendar') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/doctor-calendar" element={<DoctorCalendar />} />
        <Route path="/appointments/add" element={<div>add appointment page</div>} />
        <Route path="/appointments/:id" element={<div>appointment detail page</div>} />
        <Route path="/daily" element={<DailyScheduleStub />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DoctorCalendar', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows an error when the doctors list fails to load', async () => {
    mockedApi.get.mockRejectedValue(new Error('network down'))
    renderDoctorCalendar()

    expect(await screen.findByText('Failed to load doctors')).toBeInTheDocument()
  })

  it('auto-selects the first doctor and shows the empty state when there are no slots', async () => {
    mockCalendarGets()
    renderDoctorCalendar()

    expect(await screen.findByDisplayValue(/dr\. ali/i)).toBeInTheDocument()
    expect(await screen.findByText('This doctor has no working hours in the selected period.')).toBeInTheDocument()
  })

  it('shows the calendar error with a working retry button', async () => {
    mockCalendarGets({ '/schedules/doctor/doc-1/calendar': new Error('server down') })
    const user = userEvent.setup()
    renderDoctorCalendar()

    expect(await screen.findByText('Failed to load calendar')).toBeInTheDocument()

    mockCalendarGets()
    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(await screen.findByText('This doctor has no working hours in the selected period.')).toBeInTheDocument()
  })

  it('renders an available slot and navigates to book it when clicked', async () => {
    mockCalendarGets({ '/schedules/doctor/doc-1/calendar': calendarData() })
    renderDoctorCalendar()

    // The always-present legend also reads "🟢 Available", so the real,
    // clickable cell must be looked up scoped to the table itself.
    const table = await screen.findByRole('table')
    const slot = within(table).getByText('🟢 Available')
    fireEvent.click(slot)

    expect(await screen.findByText('add appointment page')).toBeInTheDocument()
  })

  it('renders a booked slot with the patient name and opens the appointment when clicked', async () => {
    mockCalendarGets({
      '/schedules/doctor/doc-1/calendar': calendarData({
        days: [
          {
            date: '2026-02-10T00:00:00', dayOfWeek: 2, isWorkingDay: true, isAbsent: false,
            slots: [{ start: '09:00', end: '09:30', status: 'booked', appointmentId: 'appt-1', patientName: 'Sara Ahmad' }],
          },
        ],
      }),
    })
    renderDoctorCalendar()

    const slot = await screen.findByText('🔵 Sara Ahmad')
    fireEvent.click(slot)

    expect(await screen.findByText('appointment detail page')).toBeInTheDocument()
  })

  it('does not navigate when a past slot is clicked', async () => {
    mockCalendarGets({
      '/schedules/doctor/doc-1/calendar': calendarData({
        days: [
          {
            date: '2026-02-10T00:00:00', dayOfWeek: 2, isWorkingDay: true, isAbsent: false,
            slots: [{ start: '09:00', end: '09:30', status: 'past' }],
          },
        ],
      }),
    })
    renderDoctorCalendar()

    const slot = await screen.findByText('⚪ —')
    fireEvent.click(slot)

    expect(screen.queryByText('add appointment page')).not.toBeInTheDocument()
    expect(screen.queryByText('appointment detail page')).not.toBeInTheDocument()
  })

  it('links to the daily schedule, carrying over the selected doctor', async () => {
    mockCalendarGets()
    const user = userEvent.setup()
    renderDoctorCalendar()
    await screen.findByDisplayValue(/dr\. ali/i)

    await user.click(screen.getByRole('button', { name: /today's schedule/i }))

    expect(await screen.findByText('daily schedule page (doctorId=doc-1)')).toBeInTheDocument()
  })

  it('preselects the doctor passed in via the URL from the daily schedule link', async () => {
    mockCalendarGets({
      '/doctors': [...doctorsList(), { id: 'doc-2', fullName: 'Dr. Omar', specialty: 'Pediatrics' }],
    })
    renderDoctorCalendar('/doctor-calendar?doctorId=doc-2')

    const select = await screen.findByDisplayValue(/dr\. omar/i)
    expect(select).toBeInTheDocument()
  })
})
