import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppointmentCalendar from './AppointmentCalendar'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const slotsFor = (dateStr: string) => ({
  available: true,
  date: dateStr,
  doctorName: 'Dr. Ali',
  workStart: '09:00',
  workEnd: '13:00',
  slotDuration: 30,
  firstVisitPrice: 30,
  followUpPrice: 20,
  totalSlots: 2,
  availableSlots: 2,
  slots: [
    { time: '09:00', dateTime: `${dateStr}T09:00:00`, isBooked: false, isAvailable: true },
    { time: '09:30', dateTime: `${dateStr}T09:30:00`, isBooked: false, isAvailable: true },
  ],
})

describe('AppointmentCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches today's slots by default when no initial date/time is given", async () => {
    const today = ymd(new Date())
    mockedApi.get.mockResolvedValue({ data: slotsFor(today) })
    render(<AppointmentCalendar doctorId="doc-1" onSelectSlot={vi.fn()} />)

    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining(`date=${today}`))
    )
  })

  it('opens on the correct day and highlights the matching slot when initialDateTime is given', async () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const futureStr = ymd(future)
    mockedApi.get.mockResolvedValue({ data: slotsFor(futureStr) })

    render(
      <AppointmentCalendar
        doctorId="doc-1"
        onSelectSlot={vi.fn()}
        initialDateTime={`${futureStr}T09:30:00`}
      />
    )

    // Fetched the future day, not today.
    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining(`date=${futureStr}`))
    )

    // The 09:30 slot (the one that was clicked on the doctor calendar) is
    // pre-highlighted, so the user doesn't have to find and re-pick it.
    const slotButton = await screen.findByRole('button', { name: '09:30' })
    await waitFor(() => expect(slotButton).toHaveStyle({ background: 'rgb(91, 140, 143)' }))

    const otherSlot = screen.getByRole('button', { name: '09:00' })
    expect(otherSlot).not.toHaveStyle({ background: 'rgb(91, 140, 143)' })
  })

  it('lets the user pick a different slot after the initial one was pre-highlighted', async () => {
    const today = ymd(new Date())
    mockedApi.get.mockResolvedValue({ data: slotsFor(today) })
    const onSelectSlot = vi.fn()
    const user = userEvent.setup()

    render(
      <AppointmentCalendar
        doctorId="doc-1"
        onSelectSlot={onSelectSlot}
        initialDateTime={`${today}T09:00:00`}
      />
    )
    await screen.findByRole('button', { name: '09:00' })

    await user.click(screen.getByRole('button', { name: '09:30' }))

    expect(onSelectSlot).toHaveBeenCalledWith(`${today} 09:30`, 30)
  })

  it('does not crash and pre-selects nothing when initialDateTime matches no slot', async () => {
    const today = ymd(new Date())
    mockedApi.get.mockResolvedValue({ data: slotsFor(today) })

    render(
      <AppointmentCalendar
        doctorId="doc-1"
        onSelectSlot={vi.fn()}
        initialDateTime={`${today}T11:00:00`}
      />
    )

    const slot900 = await screen.findByRole('button', { name: '09:00' })
    expect(slot900).not.toHaveStyle({ background: 'rgb(91, 140, 143)' })
  })
})
