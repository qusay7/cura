import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

function renderLayout() {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Layout><div>page content</div></Layout>} />
        <Route path="/profile" element={<div>profile page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    // SuperAdmin bypasses the permission check entirely, so the sidebar
    // renders its full menu regardless of a seeded `permissions` array.
    localStorage.setItem('user', JSON.stringify({ role: 'SuperAdmin', fullName: 'Sara Ahmad' }))
    mockedApi.get.mockImplementation((url: string) =>
      Promise.resolve({ data: url.startsWith('/notifications') ? [] : {} })
    )
    mockedApi.put.mockResolvedValue({ data: {} })
  })

  it('navigates to /profile when the user menu is activated, as a real keyboard-operable button', async () => {
    const user = userEvent.setup()
    renderLayout()

    const userMenu = screen.getByRole('button', { name: /sara ahmad/i })
    await user.click(userMenu)

    expect(await screen.findByText('profile page')).toBeInTheDocument()
  })

  it('marks a notification as read when its button is activated', async () => {
    mockedApi.get.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.startsWith('/notifications')
          ? [{ id: 'n1', title: 'موعد جديد', message: 'تم إضافة موعد جديد مع د. أحمد السيد', createdAt: new Date().toISOString(), read: false, type: 'appointment' }]
          : {},
      })
    )
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    const notifButton = await screen.findByRole('button', { name: /موعد جديد/i })
    expect(notifButton).toHaveStyle({ background: 'rgb(232, 240, 240)' })

    await user.click(notifButton)

    expect(notifButton).toHaveStyle({ background: 'transparent' })
  })
})
