import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Patients from './Patients'
import api from '../api/axios'
import type { Patient } from '../types'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
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

const patient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'pat-1',
  patientNumber: 101,
  fullName: 'Sara Ahmad',
  phone: '0501234567',
  gender: 'female',
  dateOfBirth: '1990-01-01',
  createdAt: '2026-01-01',
  ...overrides,
})

function renderPatients() {
  render(
    <MemoryRouter initialEntries={['/patients']}>
      <Routes>
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<div>patient detail page</div>} />
        <Route path="/patients/add" element={<div>add patient page</div>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Patients', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('redirects to /login when the patients list fails to load', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('unauthorized'))
    renderPatients()

    expect(await screen.findByText('login page', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
  })

  it('lists patients with their number, name and gender badge', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: [patient()] })
    renderPatients()

    const name = await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)
    expect(screen.getByText('#101')).toBeInTheDocument()
    const row = name.closest('tr') as HTMLElement
    expect(within(row).getByText(/female/i)).toBeInTheDocument()
  })

  it('hides the Add Patient button when the user lacks permission', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderPatients()

    await screen.findByText('No patients found', undefined, LOADING_TIMEOUT)
    expect(screen.queryByRole('button', { name: /add patient/i })).not.toBeInTheDocument()
  })

  it('shows the Add Patient button when the user has permission', async () => {
    localStorage.setItem('permissions', JSON.stringify(['patients.create']))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderPatients()

    await screen.findByText('No patients found', undefined, LOADING_TIMEOUT)
    expect(screen.getByRole('button', { name: /add patient/i })).toBeInTheDocument()
  })

  it('filters the list by name as the user types in the search box', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: [patient(), patient({ id: 'pat-2', patientNumber: 202, fullName: 'Omar Khalil' })],
    })
    const user = userEvent.setup()
    renderPatients()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.type(screen.getByPlaceholderText(/search by name/i), 'Omar')

    expect(screen.getByText('Omar Khalil')).toBeInTheDocument()
    expect(screen.queryByText('Sara Ahmad')).not.toBeInTheDocument()
  })

  it("navigates to the patient's detail page when a row is clicked", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [patient()] })
    const user = userEvent.setup()
    renderPatients()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByText('Sara Ahmad'))

    expect(await screen.findByText('patient detail page')).toBeInTheDocument()
  })

  it('updates the total-patient count in the header based on the loaded list', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: [patient(), patient({ id: 'pat-2', patientNumber: 202, fullName: 'Omar Khalil' })],
    })
    renderPatients()

    expect(await screen.findByText(/2\s*Total Patients/i, undefined, LOADING_TIMEOUT)).toBeInTheDocument()
  })
})
