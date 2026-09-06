import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const plan = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'plan-1',
  name: 'Standard',
  description: 'For growing clinics',
  monthlyPrice: 30,
  yearlyPrice: 300,
  maxUsers: 10,
  maxDoctors: 5,
  maxPatients: 1000,
  isActive: true,
  isFeatured: false,
  features: ['Feature A', 'Feature B'],
  ...overrides,
})

function renderLandingPage() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.open = vi.fn()
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('shows a loading state before the plans resolve', () => {
    mockedApi.get.mockReturnValue(new Promise(() => {}))
    renderLandingPage()

    expect(screen.getByText('Loading plans...')).toBeInTheDocument()
  })

  it('renders plan cards once loaded', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [plan()] })
    renderLandingPage()

    expect(await screen.findByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('For growing clinics')).toBeInTheDocument()
    expect(screen.getByText('Feature A')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('shows an error message when plans fail to load', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('server error'))
    renderLandingPage()

    expect(await screen.findByText('Could not load plans right now, please try again later')).toBeInTheDocument()
  })

  it('shows an empty message when there are no plans', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderLandingPage()

    expect(await screen.findByText('No plans available right now')).toBeInTheDocument()
  })

  it('highlights the featured plan with its own CTA label', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [plan({ isFeatured: true })] })
    renderLandingPage()

    await screen.findByText('Standard')
    expect(screen.getByText('⭐ Most Popular')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request free trial' })).toBeInTheDocument()
  })

  it('switches the displayed price when Yearly billing is selected', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [plan()] })
    const user = userEvent.setup()
    renderLandingPage()
    await screen.findByText('Standard')
    expect(screen.getByText('30')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /yearly/i }))

    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('navigates to the login page from the nav bar', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    const user = userEvent.setup()
    renderLandingPage()
    await screen.findByText('No plans available right now')

    // "Sign In" also appears as a login shortcut in the footer, so pick the
    // first match (the nav bar's).
    await user.click(screen.getAllByText('Sign In')[0])

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('switches to Arabic when the language toggle is clicked', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    const user = userEvent.setup()
    renderLandingPage()
    await screen.findByText('No plans available right now')

    await user.click(screen.getAllByRole('button', { name: 'ع' })[0])

    expect((await screen.findAllByText('تسجيل الدخول')).length).toBeGreaterThan(0)
  })

  it('opens WhatsApp with a prefilled message when contacting sales', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    const user = userEvent.setup()
    renderLandingPage()
    await screen.findByText('No plans available right now')

    await user.click(screen.getByRole('button', { name: /get started/i }))

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/962796139705'),
      '_blank'
    )
  })
})
