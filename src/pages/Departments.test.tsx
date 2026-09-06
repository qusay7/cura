import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Departments from './Departments'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const department = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'dept-1',
  name: 'Cardiology',
  type: 0,
  isActive: true,
  createdAt: '2026-01-01',
  doctorsCount: 3,
  ...overrides,
})

function renderDepartments() {
  render(
    <MemoryRouter initialEntries={['/departments']}>
      <Routes>
        <Route path="/departments" element={<Departments />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Departments', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.alert = vi.fn()
    window.confirm = vi.fn(() => true)
  })

  it('redirects to /login when the departments list fails to load', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('unauthorized'))
    renderDepartments()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('shows the empty state and hides Add Department without permission', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderDepartments()

    expect(await screen.findByText('No departments found')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add department/i })).not.toBeInTheDocument()
  })

  it('renders a department card with its type, status and doctor count', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: [department()] })
    renderDepartments()

    expect(await screen.findByText('Cardiology')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('3 Doctors')).toBeInTheDocument()
  })

  it('requires a name before saving a new department', async () => {
    localStorage.setItem('permissions', JSON.stringify(['departments.manage']))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    const user = userEvent.setup()
    renderDepartments()
    await screen.findByText('No departments found')

    await user.click(screen.getAllByRole('button', { name: /add department/i })[0])
    await user.click(await screen.findByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Department name is required', { exact: false })).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('creates a new department and refreshes the list', async () => {
    localStorage.setItem('permissions', JSON.stringify(['departments.manage']))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    mockedApi.get.mockResolvedValueOnce({ data: [department({ name: 'Radiology', type: 3 })] })
    const user = userEvent.setup()
    renderDepartments()
    await screen.findByText('No departments found')

    await user.click(screen.getAllByRole('button', { name: /add department/i })[0])
    await user.type(screen.getByPlaceholderText('e.g. Pediatrics'), 'Radiology')
    await user.click(screen.getByText('Radiology', { selector: 'span' }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/departments', { name: 'Radiology', type: 3 })
    )
    expect(await screen.findByText('3 Doctors')).toBeInTheDocument()
  })

  it('pre-fills the modal when editing, and submits a PUT', async () => {
    localStorage.setItem('permissions', JSON.stringify(['departments.manage']))
    mockedApi.get.mockResolvedValueOnce({ data: [department()] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    mockedApi.get.mockResolvedValueOnce({ data: [department({ name: 'Cardiology Unit' })] })
    const user = userEvent.setup()
    renderDepartments()
    await screen.findByText('Cardiology')

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = screen.getByDisplayValue('Cardiology')
    await user.clear(nameInput)
    await user.type(nameInput, 'Cardiology Unit')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/departments/dept-1', { name: 'Cardiology Unit', type: 0 })
    )
  })

  it('toggles a department active/inactive', async () => {
    localStorage.setItem('permissions', JSON.stringify(['departments.manage']))
    mockedApi.get.mockResolvedValueOnce({ data: [department({ isActive: true })] })
    mockedApi.patch.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderDepartments()
    await screen.findByText('Cardiology')

    await user.click(screen.getByRole('button', { name: /disable/i }))

    expect(mockedApi.patch).toHaveBeenCalledWith('/departments/dept-1/toggle')
    expect(await screen.findByRole('button', { name: /enable/i })).toBeInTheDocument()
  })

  it('deletes a department after confirmation', async () => {
    localStorage.setItem('permissions', JSON.stringify(['departments.manage']))
    mockedApi.get.mockResolvedValueOnce({ data: [department()] })
    mockedApi.delete.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderDepartments()
    await screen.findByText('Cardiology')

    await user.click(screen.getByRole('button', { name: '🗑️' }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/departments/dept-1'))
    expect(screen.queryByText('Cardiology')).not.toBeInTheDocument()
  })

  it('does not delete when the confirmation is dismissed', async () => {
    localStorage.setItem('permissions', JSON.stringify(['departments.manage']))
    window.confirm = vi.fn(() => false)
    mockedApi.get.mockResolvedValueOnce({ data: [department()] })
    const user = userEvent.setup()
    renderDepartments()
    await screen.findByText('Cardiology')

    await user.click(screen.getByRole('button', { name: '🗑️' }))

    expect(mockedApi.delete).not.toHaveBeenCalled()
  })

  it('filters the list by name as the user types', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({
      data: [department(), department({ id: 'dept-2', name: 'Radiology Wing', type: 3 })],
    })
    const user = userEvent.setup()
    renderDepartments()
    await screen.findByText('Cardiology')

    await user.type(screen.getByPlaceholderText(/search by name/i), 'Radiology Wing')

    expect(screen.getByText('Radiology Wing')).toBeInTheDocument()
    expect(screen.queryByText('Cardiology')).not.toBeInTheDocument()
  })
})
