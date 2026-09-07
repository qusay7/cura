import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EditPatient from './EditPatient'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — irrelevant
// decoration for the brief loading screen these tests pass through.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

const mockedApi = vi.mocked(api, true)

// The component pads the "loading" state to at least 800ms regardless of how
// fast the API resolves, so the loading screen needs a generous wait.
const LOADING_TIMEOUT = { timeout: 2000 }

const patientRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
  fullName: 'Sara Ahmad',
  phone: '0501234567',
  gender: 'female',
  dateOfBirth: '1990-01-01T00:00:00',
  email: 'sara@example.com',
  ...overrides,
})

function renderEditPatient() {
  render(
    <MemoryRouter initialEntries={['/patients/pat-1/edit']}>
      <Routes>
        <Route path="/patients/:id/edit" element={<EditPatient />} />
        <Route path="/patients/:id" element={<div>patient detail page</div>} />
        <Route path="/patients" element={<div>patients list page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('EditPatient', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('warns before closing the tab only after editing a field, not on the initial data load', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    const user = userEvent.setup()
    renderEditPatient()
    const nameInput = await screen.findByDisplayValue('Sara Ahmad', {}, LOADING_TIMEOUT)

    let event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)

    await user.type(nameInput, ' Hassan')

    event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('loads and pre-fills the patient data', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    renderEditPatient()

    expect(await screen.findByDisplayValue('Sara Ahmad', {}, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(screen.getByDisplayValue('0501234567')).toBeInTheDocument()
    expect(screen.getByDisplayValue('sara@example.com')).toBeInTheDocument()
  })

  it('redirects to the patients list when loading fails', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('not found'))
    renderEditPatient()

    expect(await screen.findByText('patients list page', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
  })

  it('requires a full name before saving', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    const user = userEvent.setup()
    renderEditPatient()
    const nameInput = await screen.findByDisplayValue('Sara Ahmad', {}, LOADING_TIMEOUT)

    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/required/i)).toBeInTheDocument()
    expect(mockedApi.put).not.toHaveBeenCalled()
  })

  it('saves the changes and navigates to the patient detail page', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderEditPatient()
    const nameInput = await screen.findByDisplayValue('Sara Ahmad', {}, LOADING_TIMEOUT)

    await user.clear(nameInput)
    await user.type(nameInput, 'Sara Ahmad Updated')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/patients/pat-1',
        expect.objectContaining({ fullName: 'Sara Ahmad Updated' })
      )
    )
    expect(await screen.findByText('patient detail page')).toBeInTheDocument()
  })

  it('shows the server error message when saving fails', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    mockedApi.put.mockRejectedValueOnce({ response: { data: 'Duplicate national ID' } })
    const user = userEvent.setup()
    renderEditPatient()
    await screen.findByDisplayValue('Sara Ahmad', {}, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Duplicate national ID')).toBeInTheDocument()
  })

  it('cancels without saving and returns to the patient detail page', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    const user = userEvent.setup()
    renderEditPatient()
    await screen.findByDisplayValue('Sara Ahmad', {}, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(await screen.findByText('patient detail page')).toBeInTheDocument()
    expect(mockedApi.put).not.toHaveBeenCalled()
  })
})
