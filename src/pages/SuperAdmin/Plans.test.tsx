import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SuperAdminPlans from './Plans'
import api from '../../api/axios'

vi.mock('../../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const plan = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'plan-1',
  name: 'Basic',
  description: 'For small clinics',
  monthlyPrice: 20,
  yearlyPrice: 199,
  maxUsers: 3,
  maxDoctors: 2,
  maxPatients: 300,
  maxDailyMessages: 20,
  isActive: true,
  isFeatured: false,
  features: ['Appointment scheduling'],
  createdAt: '2026-01-01',
  ...overrides,
})

function renderPlans() {
  render(
    <MemoryRouter initialEntries={['/superadmin/plans']}>
      <Routes>
        <Route path="/superadmin/plans" element={<SuperAdminPlans />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SuperAdminPlans', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.alert = vi.fn()
  })

  it('redirects to /login when the plans list fails to load', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('unauthorized'))
    renderPlans()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('shows the empty state and a seed button when there are no plans', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    renderPlans()

    expect(await screen.findByText(/no plans/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create default plans/i })).toBeInTheDocument()
  })

  it('renders a plan card with its price, limits and features', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [plan()] })
    renderPlans()

    expect(await screen.findByText('Basic', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('For small clinics')).toBeInTheDocument()
    expect(screen.getByText('Appointment scheduling')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows "Unlimited" for a -1 limit instead of the raw number', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [plan({ maxUsers: -1 })] })
    renderPlans()

    await screen.findByText('Basic', { exact: false })
    expect(screen.getByText(/unlimited/i)).toBeInTheDocument()
  })

  it('seeds the three default plans when none exist yet', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    mockedApi.post.mockResolvedValue({ data: {} })
    mockedApi.get.mockResolvedValueOnce({ data: [plan(), plan({ id: 'plan-2', name: 'Standard' }), plan({ id: 'plan-3', name: 'Premium' })] })
    const user = userEvent.setup()
    renderPlans()

    await user.click(await screen.findByRole('button', { name: /create default plans/i }))

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(3))
    expect(mockedApi.post).toHaveBeenCalledWith('/plans', expect.objectContaining({ name: 'Basic' }))
    expect(mockedApi.post).toHaveBeenCalledWith('/plans', expect.objectContaining({ name: 'Standard' }))
    expect(mockedApi.post).toHaveBeenCalledWith('/plans', expect.objectContaining({ name: 'Premium' }))
  })

  it('adds a new plan through the form', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    mockedApi.get.mockResolvedValueOnce({ data: [plan()] })
    const user = userEvent.setup()
    renderPlans()
    await screen.findByText(/no plans/i)

    await user.click(screen.getByRole('button', { name: /add plan/i }))
    await user.type(screen.getByPlaceholderText('Basic'), 'Gold')
    await user.type(screen.getByPlaceholderText('20'), '30')
    await user.type(screen.getByPlaceholderText('199'), '300')
    const unlimitedInputs = screen.getAllByPlaceholderText('-1 = Unlimited')
    for (const input of unlimitedInputs) await user.type(input, '5')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/plans',
        expect.objectContaining({ name: 'Gold', monthlyPrice: 30, yearlyPrice: 300 })
      )
    )
    expect(await screen.findByText('Plan added ✅', { exact: false })).toBeInTheDocument()
  })

  it('pre-fills the form when editing an existing plan, and submits a PUT', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [plan()] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    mockedApi.get.mockResolvedValueOnce({ data: [plan({ name: 'Basic Plus' })] })
    const user = userEvent.setup()
    renderPlans()
    await screen.findByText('Basic', { exact: false })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = screen.getByDisplayValue('Basic')
    await user.clear(nameInput)
    await user.type(nameInput, 'Basic Plus')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/plans/plan-1', expect.objectContaining({ name: 'Basic Plus' }))
    )
    expect(await screen.findByText('Plan updated ✅', { exact: false })).toBeInTheDocument()
  })

  it('toggles a plan active/inactive without refetching the whole list', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [plan({ isActive: true })] })
    mockedApi.patch.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderPlans()
    await screen.findByText('Basic', { exact: false })

    await user.click(screen.getByRole('button', { name: /deactivate/i }))

    expect(mockedApi.patch).toHaveBeenCalledWith('/plans/plan-1/toggle')
    expect(await screen.findByRole('button', { name: /activate/i })).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('shows an inline error banner when toggling a plan fails', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [plan()] })
    mockedApi.patch.mockRejectedValueOnce(new Error('server error'))
    const user = userEvent.setup()
    renderPlans()
    await screen.findByText('Basic', { exact: false })

    await user.click(screen.getByRole('button', { name: /deactivate/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
