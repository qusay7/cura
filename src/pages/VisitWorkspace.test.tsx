import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import VisitWorkspace from './VisitWorkspace'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

vi.mock('../components/SearchableSelect', () => ({
  default: ({ value, onChange, options }: any) => (
    <select data-testid="visit-type-select" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">--</option>
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}))

vi.mock('../components/PatientAttachmentsTab', () => ({
  default: () => <div>attachments tab</div>,
}))

const mockedApi = vi.mocked(api, true)

const appointment = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'appt-1',
  patientId: 'pat-1',
  patientName: 'Sara Ahmad',
  doctorId: 'doc-1',
  appointmentDate: '2026-01-15T09:00:00',
  templateId: 'tpl-1',
  checkInTime: null,
  checkOutTime: null,
  ...overrides,
})

// Default: no upcoming appointment, empty history, one template, no existing
// note. A persistent implementation so refetches (check-in, save) keep
// working without a once-queue.
function mockWorkspaceGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/appointments/appt-1') return Promise.resolve({ data: appointment() })
    if (url === '/appointments') return Promise.resolve({ data: [] })
    if (url === '/visitnotes/patient/pat-1') return Promise.resolve({ data: [] })
    if (url === '/treatmentplans/templates') return Promise.resolve({ data: [{ id: 'tpl-1', name: 'Checkup', nameEn: 'Checkup', defaultSessionsCount: 1 }] })
    if (url === '/visitnotes/appointment/appt-1') return Promise.reject(new Error('no note'))
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderWorkspace() {
  render(
    <MemoryRouter initialEntries={['/visit/appt-1']}>
      <Routes>
        <Route path="/visit/:appointmentId" element={<VisitWorkspace />} />
        <Route path="/daily" element={<div>daily page</div>} />
        <Route path="/appointments" element={<div>appointments page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('VisitWorkspace', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('redirects to /daily when loading fails', async () => {
    mockWorkspaceGets({ '/appointments/appt-1': new Error('not found') })
    renderWorkspace()

    expect(await screen.findByText('daily page')).toBeInTheDocument()
  })

  it('shows the patient name and a check-in prompt before check-in', async () => {
    mockWorkspaceGets()
    renderWorkspace()

    expect(await screen.findByText('Sara Ahmad', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Check In Now', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Check the patient in first to enter visit details', { exact: false })).toBeInTheDocument()
  })

  it('shows the empty history state when there are no previous visits', async () => {
    mockWorkspaceGets()
    renderWorkspace()

    expect(await screen.findByText('No previous visit history for this patient')).toBeInTheDocument()
  })

  it('renders previous visit history rows', async () => {
    mockWorkspaceGets({
      '/visitnotes/patient/pat-1': [
        {
          id: 'note-1', appointmentId: 'other-appt', diagnosis: 'Flu', prescription: 'Rest',
          tests: null, notes: null, createdAt: '2026-01-01', doctorName: 'Dr. Ali',
          appointmentDate: '2026-01-01T09:00:00', visitType: 'Checkup', attachments: [],
        },
      ],
    })
    renderWorkspace()

    expect(await screen.findByText('Flu')).toBeInTheDocument()
    expect(screen.getByText('Dr. Ali')).toBeInTheDocument()
  })

  it('checks the patient in', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    mockWorkspaceGets()
    const user = userEvent.setup()
    renderWorkspace()
    await screen.findByText('Check In Now', { exact: false })

    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/appointments/appt-1') return Promise.resolve({ data: appointment({ checkInTime: '2026-01-15T09:05:00' }) })
      if (url === '/appointments') return Promise.resolve({ data: [] })
      if (url === '/visitnotes/patient/pat-1') return Promise.resolve({ data: [] })
      if (url === '/treatmentplans/templates') return Promise.resolve({ data: [{ id: 'tpl-1', name: 'Checkup', nameEn: 'Checkup', defaultSessionsCount: 1 }] })
      if (url === '/visitnotes/appointment/appt-1') return Promise.reject(new Error('no note'))
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })

    await user.click(screen.getByRole('button', { name: /check in now/i }))

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith('/appointments/appt-1/checkin'))
    expect(await screen.findByText('Checked In', { exact: false })).toBeInTheDocument()
  })

  it('blocks saving before check-in', async () => {
    mockWorkspaceGets()
    renderWorkspace()
    await screen.findByText('Sara Ahmad', { exact: false })

    expect(screen.getByRole('button', { name: /save visit/i })).toBeDisabled()
  })

  it('saves a new visit note once checked in', async () => {
    mockWorkspaceGets({ '/appointments/appt-1': appointment({ checkInTime: '2026-01-15T09:05:00' }) })
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'note-1' } })
    renderWorkspace()
    await screen.findByText('Sara Ahmad', { exact: false })

    fireEvent.change(screen.getAllByRole('textbox').find(el => (el as HTMLTextAreaElement).rows === 3) as HTMLElement, { target: { value: 'Flu' } })
    fireEvent.click(screen.getByRole('button', { name: /save visit/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/visitnotes',
        expect.objectContaining({ patientId: 'pat-1', appointmentId: 'appt-1', doctorId: 'doc-1', diagnosis: 'Flu' })
      )
    )
    expect(await screen.findByText('Visit saved successfully', { exact: false })).toBeInTheDocument()
  })

  it('shows the upcoming appointment card instead of the next-visit-date input when one exists', async () => {
    mockWorkspaceGets({
      '/appointments/appt-1': appointment({ checkInTime: '2026-01-15T09:05:00' }),
      '/appointments': [
        { id: 'other-appt', status: 'scheduled', appointmentDate: '2026-02-01T10:00:00' },
      ],
    })
    renderWorkspace()

    expect(await screen.findByText("Patient's Next Appointment", { exact: false })).toBeInTheDocument()
    expect(screen.queryByText('Next Visit Date (optional)')).not.toBeInTheDocument()
  })

  it('shows the finish-visit button after check-in but before check-out', async () => {
    mockWorkspaceGets({ '/appointments/appt-1': appointment({ checkInTime: '2026-01-15T09:05:00' }) })
    const user = userEvent.setup()
    renderWorkspace()
    await screen.findByText('Sara Ahmad', { exact: false })

    await user.click(screen.getByRole('button', { name: /finish visit/i }))

    expect(await screen.findByText('appointments page')).toBeInTheDocument()
  })
})
