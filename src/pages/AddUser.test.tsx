import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AddUser from './AddUser'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

function renderAddUser() {
  render(
    <MemoryRouter initialEntries={['/users/add']}>
      <Routes>
        <Route path="/users/add" element={<AddUser />} />
        <Route path="/users" element={<div>users page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AddUser', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows a warning instead of the role selector when there is no clinic selected', async () => {
    renderAddUser()

    expect(screen.getByText(/cannot load roles/i)).toBeInTheDocument()
    expect(mockedApi.get).not.toHaveBeenCalledWith('/roles', expect.anything())
  })

  it('fetches departments and roles scoped to the clinic', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/departments') return Promise.resolve({ data: [] })
      if (url === '/roles') return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    renderAddUser()

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/departments'))
    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith('/roles', { params: { clinicId: 'clinic-1' } })
    )
  })

  it('requires a full name before submitting', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1' }))
    mockedApi.get.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderAddUser()

    await user.click(screen.getByRole('button', { name: /add user/i }))

    expect(await screen.findByText('Name is required', { exact: false })).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('strips non-alphanumeric characters from the username as the user types', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1' }))
    mockedApi.get.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderAddUser()

    await user.type(screen.getByPlaceholderText(/english letters & numbers only/i), 'abc-123!')

    expect(await screen.findByDisplayValue('abc123@CURA.COM')).toBeInTheDocument()
  })

  it('requires a role before submitting', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1' }))
    mockedApi.get.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    renderAddUser()

    await user.type(screen.getByPlaceholderText(/enter full name/i), 'Sara Ahmad')
    await user.type(screen.getByPlaceholderText(/english letters & numbers only/i), 'saraahmad')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /add user/i }))

    expect(await screen.findByText('Role is required', { exact: false })).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('requires a specialty when the Doctor role is selected', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/departments') return Promise.resolve({ data: [] })
      if (url === '/roles') return Promise.resolve({ data: [{ id: 'r1', name: 'Doctor', nameEn: 'Doctor', description: 'طبيب' }] })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    const user = userEvent.setup()
    renderAddUser()
    await user.type(screen.getByPlaceholderText(/enter full name/i), 'Dr. Ali')
    await user.type(screen.getByPlaceholderText(/english letters & numbers only/i), 'draligp')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /select role/i }))
    await user.click(await screen.findByText('Doctor'))

    await user.click(screen.getByRole('button', { name: /add user/i }))

    // Shown both inline under the field and in the submit-error banner.
    expect((await screen.findAllByText('Specialty is required for Doctor', { exact: false })).length).toBeGreaterThan(0)
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('creates the user with a generated email and navigates to /users', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/departments') return Promise.resolve({ data: [] })
      if (url === '/roles') {
        return Promise.resolve({
          data: [{ id: 'r1', name: 'Receptionist', nameEn: 'Receptionist', description: 'موظف استقبال' }],
        })
      }
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderAddUser()
    await user.type(screen.getByPlaceholderText(/enter full name/i), 'Sara Ahmad')
    await user.type(screen.getByPlaceholderText(/english letters & numbers only/i), 'saraahmad')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /select role/i }))
    await user.click(await screen.findByText('Receptionist'))

    await user.click(screen.getByRole('button', { name: /add user/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          fullName: 'Sara Ahmad',
          username: 'saraahmad',
          email: 'saraahmad@CURA.COM',
          role: 'Receptionist',
        })
      )
    )
    expect(await screen.findByText(/user created successfully/i)).toBeInTheDocument()
    expect(await screen.findByText('users page', undefined, { timeout: 3000 })).toBeInTheDocument()
  })

  it('shows the server error message when creating the user fails', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1' }))
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/departments') return Promise.resolve({ data: [] })
      if (url === '/roles') {
        return Promise.resolve({
          data: [{ id: 'r1', name: 'Receptionist', nameEn: 'Receptionist', description: 'موظف استقبال' }],
        })
      }
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    mockedApi.post.mockRejectedValueOnce({ response: { data: 'Username already taken' } })
    const user = userEvent.setup()
    renderAddUser()
    await user.type(screen.getByPlaceholderText(/enter full name/i), 'Sara Ahmad')
    await user.type(screen.getByPlaceholderText(/english letters & numbers only/i), 'saraahmad')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /select role/i }))
    await user.click(await screen.findByText('Receptionist'))
    await user.click(screen.getByRole('button', { name: /add user/i }))

    expect(await screen.findByText('Username already taken', { exact: false })).toBeInTheDocument()
  })
})
