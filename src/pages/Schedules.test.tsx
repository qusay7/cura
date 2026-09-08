import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Schedules from './Schedules'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

// Default: clinic schedule, doctor list and absences all resolve empty, so
// every test starts from a clean, settled screen unless it overrides a URL.
function mockGetsResolved(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/schedules/clinic') return Promise.resolve({ data: [] })
    if (url === '/doctors') return Promise.resolve({ data: [] })
    if (url === '/absences') return Promise.resolve({ data: [] })
    if (url.startsWith('/schedules/doctor/')) return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

describe('Schedules', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('permissions', JSON.stringify([
      'schedules.clinic.add', 'schedules.clinic.edit', 'schedules.clinic.delete',
      'schedules.doctor.add', 'schedules.doctor.edit', 'schedules.doctor.delete',
      'schedules.absence.add', 'schedules.absence.delete',
    ]))
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('loads clinic schedule, doctors and absences on mount, and shows the clinic tab by default', async () => {
    mockGetsResolved()
    render(<Schedules />)

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/schedules/clinic')
      expect(mockedApi.get).toHaveBeenCalledWith('/doctors')
      expect(mockedApi.get).toHaveBeenCalledWith('/absences')
    })
    expect(await screen.findByText('No schedule configured yet')).toBeInTheDocument()
  })

  // These three protect the exact fix made earlier this session: these load
  // failures used to be swallowed with only a console.error, leaving the
  // page silently empty. Now each one surfaces the shared error alert.
  it('shows the load-error alert when the clinic schedule fails to load', async () => {
    mockGetsResolved({ '/schedules/clinic': new Error('network down') })
    render(<Schedules />)

    expect(await screen.findByText('Error loading data')).toBeInTheDocument()
  })

  it('shows the load-error alert when the doctors list fails to load', async () => {
    mockGetsResolved({ '/doctors': new Error('network down') })
    render(<Schedules />)

    expect(await screen.findByText('Error loading data')).toBeInTheDocument()
  })

  it('shows the load-error alert when absences fail to load', async () => {
    mockGetsResolved({ '/absences': new Error('network down') })
    render(<Schedules />)

    expect(await screen.findByText('Error loading data')).toBeInTheDocument()
  })

  it('blocks adding a clinic day with no day selected, without calling the API', async () => {
    mockGetsResolved()
    const user = userEvent.setup()
    render(<Schedules />)
    await screen.findByText('No schedule configured yet')

    await user.click(screen.getByRole('button', { name: /add day/i }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Select at least one day')).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('adds a clinic day and shows the saved confirmation', async () => {
    mockGetsResolved()
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    render(<Schedules />)
    await screen.findByText('No schedule configured yet')

    await user.click(screen.getByRole('button', { name: /add day/i }))
    await user.click(screen.getByRole('button', { name: 'Sun' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved successfully', { exact: false })).toBeInTheDocument()
    expect(mockedApi.post).toHaveBeenCalledWith('/schedules/clinic', {
      dayOfWeek: 0,
      openTime: '08:00:00',
      closeTime: '20:00:00',
    })
  })

  it('surfaces the server error message when adding a clinic day fails', async () => {
    mockGetsResolved()
    mockedApi.post.mockRejectedValueOnce({ response: { data: { message: 'Day already exists' } } })
    const user = userEvent.setup()
    render(<Schedules />)
    await screen.findByText('No schedule configured yet')

    await user.click(screen.getByRole('button', { name: /add day/i }))
    await user.click(screen.getByRole('button', { name: 'Sun' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Day already exists')).toBeInTheDocument()
  })

  it('lets you pick a doctor on the Doctor Hours tab, which fetches their schedule', async () => {
    mockGetsResolved({ '/doctors': [{ id: 'doc-1', fullName: 'Dr. Ali', isActive: true }] })
    const user = userEvent.setup()
    render(<Schedules />)
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/doctors'))

    await user.click(screen.getByRole('button', { name: /doctor hours/i }))
    await user.click(await screen.findByText('Dr. Ali'))

    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith(
        '/schedules/doctor/doc-1',
        expect.objectContaining({ signal: expect.anything() })
      )
    )
  })

  it('requires both dates before adding an absence', async () => {
    mockGetsResolved()
    const user = userEvent.setup()
    render(<Schedules />)
    await screen.findByText('No schedule configured yet')

    await user.click(screen.getByRole('button', { name: /absences/i }))
    await user.click(screen.getByRole('button', { name: /add absence/i }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Select dates')).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })
})
