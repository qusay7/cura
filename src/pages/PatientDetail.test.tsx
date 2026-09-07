import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PatientDetail from './PatientDetail'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
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
// The not-found redirect is delayed an extra 2000ms on top of that.
const REDIRECT_TIMEOUT = { timeout: 4000 }

const patientRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'pat-1',
  patientNumber: 101,
  fullName: 'Sara Ahmad',
  phone: '0501234567',
  phone2: null,
  gender: 'female',
  dateOfBirth: '1990-01-01',
  nationalId: null,
  bloodType: null,
  address: null,
  email: null,
  emergencyContact: null,
  emergencyPhone: null,
  allergies: null,
  chronicDiseases: null,
  occupation: null,
  maritalStatus: null,
  notes: null,
  stopped: false,
  createdAt: '2026-01-01',
  ...overrides,
})

function renderPatientDetail() {
  render(
    <MemoryRouter initialEntries={['/patients/pat-1']}>
      <Routes>
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/patients/:id/edit" element={<div>edit patient page</div>} />
        <Route path="/patients" element={<div>patients list page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PatientDetail', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.alert = vi.fn()
    window.confirm = vi.fn(() => true)
  })

  it("displays the patient's info, age and active status", async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    renderPatientDetail()

    expect(await screen.findByRole('heading', { name: 'Sara Ahmad' }, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(screen.getAllByText('#101').length).toBeGreaterThan(0)
    expect(screen.getByText('0501234567')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows the not-found state and then redirects to the patients list', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('not found'))
    renderPatientDetail()

    expect(await screen.findByText('Patient not found', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(await screen.findByText('patients list page', undefined, REDIRECT_TIMEOUT)).toBeInTheDocument()
  })

  it('hides the Edit and Delete buttons when the user lacks permission', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    renderPatientDetail()
    await screen.findByRole('heading', { name: 'Sara Ahmad' }, LOADING_TIMEOUT)

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('navigates to the edit page when Edit is clicked', async () => {
    localStorage.setItem('permissions', JSON.stringify(['patients.edit']))
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    const user = userEvent.setup()
    renderPatientDetail()
    await screen.findByRole('heading', { name: 'Sara Ahmad' }, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(await screen.findByText('edit patient page')).toBeInTheDocument()
  })

  it('deletes the patient after confirmation and returns to the list', async () => {
    localStorage.setItem('permissions', JSON.stringify(['patients.delete']))
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    mockedApi.delete.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderPatientDetail()
    await screen.findByRole('heading', { name: 'Sara Ahmad' }, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(window.confirm).toHaveBeenCalled()
    expect(await screen.findByText('patients list page')).toBeInTheDocument()
    expect(mockedApi.delete).toHaveBeenCalledWith('/patients/pat-1')
  })

  it('shows an inline error toast when deleting the patient fails', async () => {
    localStorage.setItem('permissions', JSON.stringify(['patients.delete']))
    mockedApi.get.mockResolvedValueOnce({ data: patientRecord() })
    mockedApi.delete.mockRejectedValueOnce(new Error('server error'))
    const user = userEvent.setup()
    renderPatientDetail()
    await screen.findByRole('heading', { name: 'Sara Ahmad' }, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('An error occurred while deleting'))
  })
})
