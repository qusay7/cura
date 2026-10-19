import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'

function renderLandingPage() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/pricing" element={<div>pricing page</div>} />
        <Route path="/features" element={<div>features page</div>} />
        <Route path="/faq" element={<div>faq page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    window.open = vi.fn()
    window.scrollTo = vi.fn()
  })

  it('navigates to the login page from the nav bar', async () => {
    const user = userEvent.setup()
    renderLandingPage()

    // "Sign In" also appears as a login shortcut in the footer, so pick the
    // first match (the nav bar's).
    await user.click(screen.getAllByText('Sign In')[0])

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('switches to Arabic when the language toggle is clicked', async () => {
    const user = userEvent.setup()
    renderLandingPage()

    await user.click(screen.getAllByRole('button', { name: 'ع' })[0])

    expect((await screen.findAllByText('تسجيل الدخول')).length).toBeGreaterThan(0)
  })

  it('opens WhatsApp with a prefilled message when contacting sales', async () => {
    const user = userEvent.setup()
    renderLandingPage()

    await user.click(screen.getByRole('button', { name: /get started/i }))

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/962796139705'),
      '_blank'
    )
  })

  it('links the pricing teaser to the dedicated pricing page', async () => {
    const user = userEvent.setup()
    renderLandingPage()

    await user.click(screen.getByRole('button', { name: /see all plans and pricing/i }))

    expect(await screen.findByText('pricing page')).toBeInTheDocument()
  })

  it('links the features teaser to the dedicated features page', async () => {
    const user = userEvent.setup()
    renderLandingPage()

    await user.click(screen.getByRole('button', { name: /see all features in detail/i }))

    expect(await screen.findByText('features page')).toBeInTheDocument()
  })

  it('links the FAQ teaser to the dedicated FAQ page', async () => {
    const user = userEvent.setup()
    renderLandingPage()

    await user.click(screen.getByRole('button', { name: /see all faqs/i }))

    expect(await screen.findByText('faq page')).toBeInTheDocument()
  })
})
