import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Users from './Users'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
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

const userItem = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'user-1',
  fullName: 'Sara Ahmad',
  email: 'sara@example.com',
  role: 'ClinicAdmin',
  isActive: true,
  createdAt: '2026-01-01',
  ...overrides,
})

function renderUsers() {
  render(
    <MemoryRouter initialEntries={['/users']}>
      <Routes>
        <Route path="/users" element={<Users />} />
        <Route path="/users/add" element={<div>add user page</div>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Users', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.alert = vi.fn()
  })

  it('fetches clinic-scoped users when the logged-in user has a clinicId', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1' }))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderUsers()

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/users/clinic/clinic-1'))
  })

  it('fetches all users when the logged-in user has no clinicId', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderUsers()

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/users'))
  })

  it('redirects to /login when the users list fails to load', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('unauthorized'))
    renderUsers()

    expect(await screen.findByText('login page', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
  })

  it('lists a user with their role label and active status, hiding Add User without permission', async () => {
    localStorage.setItem('permissions', JSON.stringify([]))
    mockedApi.get.mockResolvedValueOnce({ data: [userItem()] })
    renderUsers()

    const name = await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)
    const row = name.closest('tr') as HTMLElement
    expect(screen.getByText('sara@example.com')).toBeInTheDocument()
    expect(within(row).getByText('Clinic Admin')).toBeInTheDocument()
    expect(within(row).getByText('Active')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add user/i })).not.toBeInTheDocument()
  })

  it('shows the Add User button when the user has permission', async () => {
    localStorage.setItem('permissions', JSON.stringify(['users.create']))
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderUsers()

    await screen.findByText('No users found', undefined, LOADING_TIMEOUT)
    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
  })

  it('hides the per-user toggle button for roles the backend would reject', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'Doctor' }))
    mockedApi.get.mockResolvedValueOnce({ data: [userItem()] })
    renderUsers()

    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)
    expect(screen.queryByRole('button', { name: /disable|enable/i })).not.toBeInTheDocument()
  })

  it("toggles a user's active status", async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin' }))
    mockedApi.get.mockResolvedValueOnce({ data: [userItem({ isActive: true })] })
    mockedApi.patch.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /disable/i }))

    expect(mockedApi.patch).toHaveBeenCalledWith('/users/user-1/toggle')
    expect(await screen.findByRole('button', { name: /enable/i })).toBeInTheDocument()
  })

  it('shows an inline error toast when toggling a user fails', async () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin' }))
    mockedApi.get.mockResolvedValueOnce({ data: [userItem()] })
    mockedApi.patch.mockRejectedValueOnce(new Error('server error'))
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /disable/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('filters the list by name or email as the user types', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: [userItem(), userItem({ id: 'user-2', fullName: 'Omar Khalil', email: 'omar@example.com' })],
    })
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    await user.type(screen.getByPlaceholderText(/search by name/i), 'omar')

    expect(screen.getByText('Omar Khalil')).toBeInTheDocument()
    expect(screen.queryByText('Sara Ahmad')).not.toBeInTheDocument()
  })

  it('filters the list by role', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: [userItem(), userItem({ id: 'user-2', fullName: 'Omar Khalil', role: 'Doctor' })],
    })
    const user = userEvent.setup()
    renderUsers()
    await screen.findByText('Sara Ahmad', undefined, LOADING_TIMEOUT)

    const [roleSelect] = screen.getAllByRole('combobox')
    await user.selectOptions(roleSelect, 'Doctor')

    expect(screen.getByText('Omar Khalil')).toBeInTheDocument()
    expect(screen.queryByText('Sara Ahmad')).not.toBeInTheDocument()
  })
})
