import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AddDoctor from './AddDoctor'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

function renderAddDoctor() {
  render(
    <MemoryRouter initialEntries={['/doctors/add']}>
      <Routes>
        <Route path="/doctors/add" element={<AddDoctor />} />
        <Route path="/doctors" element={<div>doctors page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AddDoctor', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockedApi.get.mockResolvedValue({ data: [] })
  })

  it('requires a full name before submitting', async () => {
    const user = userEvent.setup()
    renderAddDoctor()

    await user.click(screen.getByRole('button', { name: /save doctor/i }))

    expect(await screen.findByText('This field is required')).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('shows a validation error for an invalid email and does not submit', async () => {
    const user = userEvent.setup()
    renderAddDoctor()

    await user.type(screen.getByPlaceholderText(/enter doctor's full name/i), 'Dr. Ali')
    // Has an "@" (passes the browser's native type="email" constraint) but no
    // dot, so it reaches the component's own regex check.
    await user.type(screen.getByPlaceholderText('doctor@clinic.com'), 'ali@localhost')
    await user.click(screen.getByRole('button', { name: /save doctor/i }))

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('creates the doctor with Appointments as the default work type and navigates back', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderAddDoctor()

    await user.type(screen.getByPlaceholderText(/enter doctor's full name/i), 'Dr. Ali')
    await user.click(screen.getByRole('button', { name: /save doctor/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/doctors',
        expect.objectContaining({ fullName: 'Dr. Ali', workType: 'appointments' })
      )
    )
    expect(await screen.findByText('Doctor saved successfully')).toBeInTheDocument()
    // Navigation is intentionally delayed so the success banner is visible
    // for a moment first, rather than an instant, unconfirmed redirect.
    expect(await screen.findByText('doctors page', undefined, { timeout: 2000 })).toBeInTheDocument()
  })

  it('shows the server error message when creating the doctor fails', async () => {
    mockedApi.post.mockRejectedValueOnce({ response: { data: 'Duplicate email' } })
    const user = userEvent.setup()
    renderAddDoctor()

    await user.type(screen.getByPlaceholderText(/enter doctor's full name/i), 'Dr. Ali')
    await user.click(screen.getByRole('button', { name: /save doctor/i }))

    expect(await screen.findByText('Duplicate email')).toBeInTheDocument()
  })

  it('shows a warning instead of the department picker when there are no departments', async () => {
    renderAddDoctor()

    expect(await screen.findByText(/no departments/i)).toBeInTheDocument()
  })

  it('lets you pick a department from the search dropdown', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [{ id: 'dep-1', name: 'Cardiology Dept', isActive: true }] })
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderAddDoctor()
    await user.type(screen.getByPlaceholderText(/enter doctor's full name/i), 'Dr. Ali')

    await user.click(await screen.findByText(/select department/i))
    await user.click(await screen.findByText('Cardiology Dept'))
    await user.click(screen.getByRole('button', { name: /save doctor/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/doctors', expect.objectContaining({ departmentId: 'dep-1' }))
    )
  })

  it('switches the work type to Queue Only when selected', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderAddDoctor()
    await user.type(screen.getByPlaceholderText(/enter doctor's full name/i), 'Dr. Ali')

    await user.click(screen.getByRole('button', { name: /queue only/i }))
    await user.click(screen.getByRole('button', { name: /save doctor/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/doctors', expect.objectContaining({ workType: 'queue' }))
    )
  })
})
