import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AddPatient from './AddPatient'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — never
// actually rendered by this component (no loading screen is shown), but
// mocked for safety/consistency with the other page tests.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

const mockedApi = vi.mocked(api, true)

function renderAddPatient() {
  render(
    <MemoryRouter initialEntries={['/patients/add']}>
      <Routes>
        <Route path="/patients/add" element={<AddPatient />} />
        <Route path="/patients" element={<div>patients page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AddPatient', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockedApi.get.mockResolvedValue({ data: [] })
  })

  it('requires a full name before submitting', async () => {
    const user = userEvent.setup()
    renderAddPatient()

    await user.click(screen.getByRole('button', { name: /save patient/i }))

    expect(await screen.findByText('This field is required')).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('shows a validation error for an invalid email and does not submit', async () => {
    const user = userEvent.setup()
    renderAddPatient()

    await user.type(screen.getByPlaceholderText(/enter patient's full name/i), 'Sara Ahmad')
    // Has an "@" (passes the browser's native type="email" constraint) but no
    // dot, so it reaches the component's own regex check.
    await user.type(screen.getByPlaceholderText('patient@example.com'), 'sara@localhost')
    await user.click(screen.getByRole('button', { name: /save patient/i }))

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('creates the patient and advances to the insurance step', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'pat-1' } })
    const user = userEvent.setup()
    renderAddPatient()

    await user.type(screen.getByPlaceholderText(/enter patient's full name/i), 'Sara Ahmad')
    await user.click(screen.getByRole('button', { name: /save patient/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/patients', expect.objectContaining({ fullName: 'Sara Ahmad' }))
    )
    expect(await screen.findByText(/patient saved successfully/i)).toBeInTheDocument()
  })

  it('shows the server error message when creating the patient fails', async () => {
    mockedApi.post.mockRejectedValueOnce({ response: { data: 'Duplicate national ID' } })
    const user = userEvent.setup()
    renderAddPatient()

    await user.type(screen.getByPlaceholderText(/enter patient's full name/i), 'Sara Ahmad')
    await user.click(screen.getByRole('button', { name: /save patient/i }))

    expect(await screen.findByText('Duplicate national ID')).toBeInTheDocument()
  })

  it('skips insurance and returns to the patients list without calling the insurance endpoint', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'pat-1' } })
    const user = userEvent.setup()
    renderAddPatient()
    await user.type(screen.getByPlaceholderText(/enter patient's full name/i), 'Sara Ahmad')
    await user.click(screen.getByRole('button', { name: /save patient/i }))
    await screen.findByText(/patient saved successfully/i)

    await user.click(screen.getByRole('button', { name: /skip/i }))

    expect(await screen.findByText('patients page')).toBeInTheDocument()
    expect(mockedApi.post).toHaveBeenCalledTimes(1)
  })

  it('disables Add Insurance Now until the required fields are filled, then saves it', async () => {
    mockedApi.get.mockResolvedValue({ data: [{ id: 'ins-1', name: 'Bupa', coverageRate: 80 }] })
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/patients') return Promise.resolve({ data: { id: 'pat-1' } })
      return Promise.resolve({ data: {} })
    })
    const user = userEvent.setup()
    renderAddPatient()
    await user.type(screen.getByPlaceholderText(/enter patient's full name/i), 'Sara Ahmad')
    await user.click(screen.getByRole('button', { name: /save patient/i }))
    await screen.findByText(/patient saved successfully/i)

    expect(screen.getByRole('button', { name: /add insurance now/i })).toBeDisabled()

    const [companySelect] = screen.getAllByRole('combobox')
    await user.selectOptions(companySelect, 'ins-1')
    await user.type(screen.getByPlaceholderText('INS-2026-XXXX'), 'POL-123')
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-12-31' } })

    expect(screen.getByRole('button', { name: /add insurance now/i })).not.toBeDisabled()

    await user.click(screen.getByRole('button', { name: /add insurance now/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/insurance/patient?lang=en',
        expect.objectContaining({ patientId: 'pat-1', insuranceCompanyId: 'ins-1', policyNumber: 'POL-123' })
      )
    )
    expect(await screen.findByText('patients page')).toBeInTheDocument()
  })
})
