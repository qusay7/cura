import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Login from './Login'
import api, { authService } from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  authService: {
    setTokens: vi.fn(),
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — irrelevant
// decoration for these login-flow tests, so replace it with a no-op stub.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

const mockedApi = vi.mocked(api, true)
const mockedAuthService = vi.mocked(authService, true)

function renderLogin(initialPath = '/login') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login/:subdomain?" element={<Login />} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
        <Route path="/daily" element={<div>doctor daily page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

const authResponse = {
  token: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  fullName: 'Test User',
  email: 'test@example.com',
  role: 'ClinicAdmin',
  clinicId: 'clinic-1',
  clinicName: 'Test Clinic',
  expiresAt: '',
  refreshTokenExpiresAt: '',
  permissions: ['patients.view'],
}

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows the subdomain step first, with the submit button disabled until something is typed', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('clinic-name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('goes straight to the admin login step for the "admin" subdomain, without calling the API', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('clinic-name'), 'admin')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByPlaceholderText('email or username')).toBeInTheDocument()
    expect(mockedApi.get).not.toHaveBeenCalled()
  })

  it('resolves a real subdomain via the API and moves to the login step', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { name: 'Huor Clinic', isAdmin: false } })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('clinic-name'), 'huor')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText('Huor Clinic')).toBeInTheDocument()
    expect(mockedApi.get).toHaveBeenCalledWith('/clinics/by-subdomain/huor')
  })

  it('shows an error and stays on the subdomain step when the subdomain does not resolve', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('not found'))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('clinic-name'), 'doesnotexist')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText('Clinic not found or inactive', { exact: false })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('clinic-name')).toBeInTheDocument()
  })

  it('logs a non-doctor user in and lands on the dashboard', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: authResponse })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('clinic-name'), 'admin')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    await user.type(await screen.findByPlaceholderText('email or username'), 'staff@clinic.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('dashboard page')).toBeInTheDocument())
    expect(mockedAuthService.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token', 3600)
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject({ role: 'ClinicAdmin' })
  })

  it('routes a doctor to /daily instead of /dashboard', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { ...authResponse, role: 'Doctor' } })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('clinic-name'), 'admin')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.type(await screen.findByPlaceholderText('email or username'), 'doc@clinic.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('doctor daily page')).toBeInTheDocument())
  })

  it('shows an error and does not navigate when credentials are rejected', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('invalid credentials'))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('clinic-name'), 'admin')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.type(await screen.findByPlaceholderText('email or username'), 'staff@clinic.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    expect(mockedAuthService.setTokens).not.toHaveBeenCalled()
  })
})
