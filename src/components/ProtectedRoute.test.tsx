import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

function renderProtected(props: { permission?: string; role?: string }) {
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute {...props}>
              <div>secret content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects to /login when there is no auth token', () => {
    renderProtected({})
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('redirects a wrong-role user to /dashboard, without exposing the SuperAdmin route content', () => {
    localStorage.setItem('_auth_tokens', 'fake-token')
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicAdmin' }))

    renderProtected({ role: 'SuperAdmin' })

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
  })

  it('renders the route content for a matching-role user', () => {
    localStorage.setItem('_auth_tokens', 'fake-token')
    localStorage.setItem('user', JSON.stringify({ role: 'SuperAdmin' }))

    renderProtected({ role: 'SuperAdmin' })

    expect(screen.getByText('secret content')).toBeInTheDocument()
  })

  it('redirects to /dashboard when the user lacks the required permission', () => {
    localStorage.setItem('_auth_tokens', 'fake-token')
    localStorage.setItem('user', JSON.stringify({ role: 'ClinicStaff' }))
    localStorage.setItem('permissions', JSON.stringify([]))

    renderProtected({ permission: 'patients.view' })

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })

  it('renders the route content when no role or permission is required, as long as a token exists', () => {
    localStorage.setItem('_auth_tokens', 'fake-token')

    renderProtected({})

    expect(screen.getByText('secret content')).toBeInTheDocument()
  })
})
