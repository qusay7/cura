import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PatientVisitNotes from './PatientVisitNotes'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — irrelevant
// decoration for the brief loading screen these tests pass through.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

const mockedApi = vi.mocked(api, true)

const visitNote = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'note-1',
  diagnosis: 'Flu',
  prescription: 'Rest and fluids',
  tests: 'Blood test',
  notes: 'Follow up in a week',
  nextVisitDate: '2026-02-01',
  cost: 30,
  doctorName: 'Dr. Ali',
  appointmentDate: '2026-01-15T09:00:00',
  source: 'appointment',
  createdAt: '2026-01-15T09:00:00',
  ...overrides,
})

function renderVisitNotes() {
  render(
    <MemoryRouter initialEntries={['/patients/pat-1/visit-notes']}>
      <Routes>
        <Route path="/patients/:patientId/visit-notes" element={<PatientVisitNotes />} />
        <Route path="/patients" element={<div>patients list page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PatientVisitNotes', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  it('shows a failure message before redirecting to the patients list when loading fails', async () => {
    mockedApi.get.mockRejectedValue(new Error('not found'))
    renderVisitNotes()

    expect(await screen.findByText('Failed to load visit history')).toBeInTheDocument()
    expect(await screen.findByText('patients list page', undefined, { timeout: 3000 })).toBeInTheDocument()
  })

  it('shows the empty state when there are no visit notes', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/visitnotes/patient/pat-1') return Promise.resolve({ data: [] })
      if (url === '/patients/pat-1') return Promise.resolve({ data: { fullName: 'Sara Ahmad' } })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderVisitNotes()

    expect(await screen.findByText('No visits recorded yet')).toBeInTheDocument()
    expect(screen.getByText('Sara Ahmad')).toBeInTheDocument()
  })

  it('renders a visit note card with its diagnosis, prescription, tests and notes', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/visitnotes/patient/pat-1') return Promise.resolve({ data: [visitNote()] })
      if (url === '/patients/pat-1') return Promise.resolve({ data: { fullName: 'Sara Ahmad' } })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderVisitNotes()

    expect(await screen.findByText('Flu')).toBeInTheDocument()
    expect(screen.getByText('Rest and fluids')).toBeInTheDocument()
    expect(screen.getByText('Blood test')).toBeInTheDocument()
    expect(screen.getByText('Follow up in a week')).toBeInTheDocument()
    expect(screen.getAllByText('Dr. Ali', { exact: false }).length).toBeGreaterThan(0)
  })

  it('shows the appointment-source badge for an appointment-based visit', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/visitnotes/patient/pat-1') return Promise.resolve({ data: [visitNote({ source: 'appointment' })] })
      if (url === '/patients/pat-1') return Promise.resolve({ data: { fullName: 'Sara Ahmad' } })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderVisitNotes()

    expect(await screen.findByText('Appointment', { exact: false })).toBeInTheDocument()
  })

  it('shows the queue-source badge for a queue-based visit', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/visitnotes/patient/pat-1') return Promise.resolve({ data: [visitNote({ source: 'queue' })] })
      if (url === '/patients/pat-1') return Promise.resolve({ data: { fullName: 'Sara Ahmad' } })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderVisitNotes()

    expect(await screen.findByText('Queue', { exact: false })).toBeInTheDocument()
  })

  it('shows the next visit date and cost when present', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/visitnotes/patient/pat-1') return Promise.resolve({ data: [visitNote()] })
      if (url === '/patients/pat-1') return Promise.resolve({ data: { fullName: 'Sara Ahmad' } })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderVisitNotes()

    await screen.findByText('Flu')
    expect(screen.getByText('30 JD')).toBeInTheDocument()
  })

  it('shows a note\'s attachments and opens a preview when clicked', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/visitnotes/patient/pat-1') {
        return Promise.resolve({
          data: [visitNote({ attachments: [{ id: 'att-1', fileName: 'xray.png', category: 'xray', isImage: true }] })],
        })
      }
      if (url === '/patients/pat-1') return Promise.resolve({ data: { fullName: 'Sara Ahmad' } })
      if (url === '/attachments/att-1/file') return Promise.resolve({ data: new Blob(['fake']) })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderVisitNotes()

    const attachmentButton = await screen.findByText('xray.png')
    fireEvent.click(attachmentButton)

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/attachments/att-1/file', { responseType: 'blob' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('filters the visit list by doctor', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/visitnotes/patient/pat-1') {
        return Promise.resolve({
          data: [
            visitNote({ id: 'note-1', doctorName: 'Dr. Ali', diagnosis: 'Flu' }),
            visitNote({ id: 'note-2', doctorName: 'Dr. Sami', diagnosis: 'Migraine' }),
          ],
        })
      }
      if (url === '/patients/pat-1') return Promise.resolve({ data: { fullName: 'Sara Ahmad' } })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderVisitNotes()

    await screen.findByText('Flu')
    expect(screen.getByText('Migraine')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('All Doctors'), { target: { value: 'Dr. Sami' } })

    expect(screen.queryByText('Flu')).not.toBeInTheDocument()
    expect(screen.getByText('Migraine')).toBeInTheDocument()
  })
})
