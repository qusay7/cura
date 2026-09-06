import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Queue from './Queue'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const queueEntry = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'q1',
  queueNumber: 1,
  status: 'waiting',
  patientName: 'Sara Ahmad',
  patientPhone: '0501234567',
  doctorName: 'Dr. Ali',
  notes: null,
  // No trailing "Z" — the component appends its own to mark it as UTC.
  createdAt: new Date().toISOString().slice(0, -1),
  ...overrides,
})

const patient = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'pat-1',
  fullName: 'Omar Khalil',
  patientNumber: 55,
  phone: '0559999999',
  gender: 'male',
  dateOfBirth: null,
  ...overrides,
})

const doctor = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'doc-1',
  fullName: 'Dr. Ali',
  isActive: true,
  specialty: 'Cardiology',
  ...overrides,
})

const statsData = { total: 1, waiting: 1, called: 0, completed: 0, nextNumber: 2 }

// Default: an empty queue, no patients/doctors, and neutral stats, all via a
// persistent implementation so refetches after actions keep working without
// needing to re-queue values.
function mockQueueGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/queue/today') return Promise.resolve({ data: [] })
    if (url === '/patients') return Promise.resolve({ data: [] })
    if (url === '/doctors') return Promise.resolve({ data: [] })
    if (url === '/queue/stats') return Promise.resolve({ data: statsData })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

describe('Queue', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('loads and renders the stats and a queue entry', async () => {
    mockQueueGets({ '/queue/today': [queueEntry()] })
    render(<Queue />)

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('👨‍⚕️ Dr. Ali')).toBeInTheDocument()
  })

  it('shows an error when the initial load fails', async () => {
    mockQueueGets({ '/queue/today': new Error('network down') })
    render(<Queue />)

    expect(await screen.findByText('Failed to load data', { exact: false })).toBeInTheDocument()
  })

  it('shows the empty state when there are no queue entries', async () => {
    mockQueueGets()
    render(<Queue />)

    expect(await screen.findByText('No patients in queue')).toBeInTheDocument()
  })

  it('filters the queue list by status', async () => {
    mockQueueGets({
      '/queue/today': [queueEntry(), queueEntry({ id: 'q2', status: 'completed', patientName: 'Omar Khalil', queueNumber: 2 })],
    })
    const user = userEvent.setup()
    render(<Queue />)
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: '✅ Completed' }))

    expect(screen.getByText('Omar Khalil')).toBeInTheDocument()
    expect(screen.queryByText('Sara Ahmad')).not.toBeInTheDocument()
  })

  it('adds an existing patient to the queue', async () => {
    mockQueueGets({ '/patients': [patient()], '/doctors': [doctor()] })
    mockedApi.post.mockResolvedValueOnce({ data: { message: 'Added!' } })
    const user = userEvent.setup()
    render(<Queue />)
    await screen.findByText('No patients in queue')

    await user.click(screen.getByRole('button', { name: /add to queue/i }))
    await user.type(screen.getByPlaceholderText(/search by name/i), 'Omar')
    await user.click(screen.getByRole('button', { name: /^search$/i }))
    await user.click(await screen.findByText('Omar Khalil'))
    await user.selectOptions(screen.getByRole('combobox'), 'doc-1')
    await user.click(screen.getByRole('button', { name: /save to queue/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/queue',
        expect.objectContaining({ patientId: 'pat-1', doctorId: 'doc-1' })
      )
    )
  })

  it('quick-adds a new patient and enqueues them', async () => {
    mockQueueGets({ '/doctors': [doctor()] })
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/patients') return Promise.resolve({ data: { id: 'pat-new', fullName: 'New Guy', patientNumber: 99 } })
      if (url === '/queue') return Promise.resolve({ data: { message: 'Added!' } })
      return Promise.reject(new Error(`unexpected POST ${url}`))
    })
    const user = userEvent.setup()
    render(<Queue />)
    await screen.findByText('No patients in queue')

    await user.click(screen.getByRole('button', { name: /add to queue/i }))
    await user.type(screen.getByPlaceholderText(/search by name/i), 'Someone Not Found')
    await user.click(screen.getByRole('button', { name: /^search$/i }))
    await user.click(await screen.findByRole('button', { name: /add new patient/i }))
    await user.type(screen.getByPlaceholderText(/full name/i), 'New Guy')
    const comboboxes = screen.getAllByRole('combobox')
    await user.selectOptions(comboboxes[comboboxes.length - 1], 'doc-1')
    await user.click(screen.getByRole('button', { name: /save to queue/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/patients', expect.objectContaining({ fullName: 'New Guy' }))
    )
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/queue',
        expect.objectContaining({ patientId: 'pat-new', doctorId: 'doc-1' })
      )
    )
  })

  it('calls a waiting patient', async () => {
    mockQueueGets({ '/queue/today': [queueEntry({ status: 'waiting' })] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    render(<Queue />)
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: '📢 Call' }))

    expect(mockedApi.put).toHaveBeenCalledWith('/queue/q1/call')
  })

  it('completes a called patient', async () => {
    mockQueueGets({ '/queue/today': [queueEntry({ status: 'called' })] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    render(<Queue />)
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /^✅ complete$/i }))

    expect(mockedApi.put).toHaveBeenCalledWith('/queue/q1/complete')
  })

  it('cancels a waiting patient', async () => {
    mockQueueGets({ '/queue/today': [queueEntry({ status: 'waiting' })] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    render(<Queue />)
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: '✕ Cancel' }))

    expect(mockedApi.put).toHaveBeenCalledWith('/queue/q1/cancel')
  })
})
