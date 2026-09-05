import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from './Settings'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const baseClinic = {
  name: 'Al Amal Clinic',
  phone: '0501234567',
  address: 'Amman',
  email: 'clinic@example.com',
  website: 'https://example.com',
  description: 'Desc',
  ownerName: 'Ahmed',
  ownerPhone: '0507654321',
  ownerEmail: 'owner@example.com',
  taxNumber: '30012345',
  logo: null,
}

// Default: clinic info loads with the base clinic and no active subscription,
// so every test starts from a clean, settled screen unless it overrides a URL.
function mockSettingsGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/clinics/clinic-1') return Promise.resolve({ data: baseClinic })
    if (url === '/subscriptions/clinic/clinic-1') return Promise.resolve({ data: null })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderSettings() {
  return render(<Settings />)
}

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('loads clinic info and pre-fills the form', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1', fullName: 'Sara' }))
    mockSettingsGets()
    renderSettings()

    expect(await screen.findByDisplayValue('Al Amal Clinic')).toBeInTheDocument()
    expect(mockedApi.get).toHaveBeenCalledWith('/clinics/clinic-1')
    expect(mockedApi.get).toHaveBeenCalledWith('/subscriptions/clinic/clinic-1')
  })

  // Protects the fix made earlier this session: this failure used to be
  // swallowed with only a console.error, leaving the page silently empty.
  it('shows an inline error when clinic data fails to load', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1', fullName: 'Sara' }))
    mockSettingsGets({ '/clinics/clinic-1': new Error('network down') })
    renderSettings()

    expect(await screen.findByText('An unexpected error occurred', { exact: false })).toBeInTheDocument()
  })

  it('switches to the Account tab and shows the current full name', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1', fullName: 'Sara' }))
    mockSettingsGets()
    const user = userEvent.setup()
    renderSettings()
    await screen.findByDisplayValue('Al Amal Clinic')

    await user.click(screen.getByRole('button', { name: /account info/i }))

    expect(screen.getByDisplayValue('Sara')).toBeInTheDocument()
  })

  it('blocks saving the account when the new password confirmation does not match', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1', fullName: 'Sara' }))
    mockSettingsGets()
    const user = userEvent.setup()
    const { container } = renderSettings()
    await screen.findByDisplayValue('Al Amal Clinic')
    await user.click(screen.getByRole('button', { name: /account info/i }))

    const newPasswordInput = container.querySelector('input[name="newPassword"]') as HTMLInputElement
    const confirmPasswordInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement
    await user.type(newPasswordInput, 'newpass123')
    await user.type(confirmPasswordInput, 'different')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/does not match/i)).toBeInTheDocument()
    expect(mockedApi.patch).not.toHaveBeenCalled()
  })

  it('saves account changes and updates the stored user', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1', fullName: 'Sara' }))
    mockSettingsGets()
    mockedApi.patch.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderSettings()
    await screen.findByDisplayValue('Al Amal Clinic')
    await user.click(screen.getByRole('button', { name: /account info/i }))

    const fullNameInput = screen.getByDisplayValue('Sara')
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Sara Ahmad')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith(
        '/users/profile',
        expect.objectContaining({ fullName: 'Sara Ahmad' })
      )
    )
    expect(await screen.findByText('Saved successfully', { exact: false })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject({ fullName: 'Sara Ahmad' })
  })

  it('saves clinic info', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1', fullName: 'Sara' }))
    mockSettingsGets()
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderSettings()
    const nameInput = await screen.findByDisplayValue('Al Amal Clinic')
    await user.clear(nameInput)
    await user.type(nameInput, 'Al Amal Medical Center')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/clinics/clinic-1',
        expect.objectContaining({ name: 'Al Amal Medical Center' })
      )
    )
    expect(await screen.findByText('Saved successfully', { exact: false })).toBeInTheDocument()
  })

  it('shows subscription plan details and usage bars on the Subscription tab', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1', fullName: 'Sara' }))
    mockSettingsGets({
      '/subscriptions/clinic/clinic-1': {
        planName: 'Standard',
        billingCycle: 'monthly',
        endDate: '2026-12-01',
        daysRemaining: 20,
        maxPatients: 1000,
        maxDoctors: 5,
        maxUsers: 10,
        currentPatients: 300,
        currentDoctors: 2,
        currentUsers: 4,
      },
    })
    const user = userEvent.setup()
    renderSettings()
    await screen.findByDisplayValue('Al Amal Clinic')

    await user.click(screen.getByRole('button', { name: /subscription/i }))

    expect(screen.getByText('Standard', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('300 / 1000')).toBeInTheDocument()
  })

  it('shows the no-subscription empty state', async () => {
    localStorage.setItem('user', JSON.stringify({ clinicId: 'clinic-1', fullName: 'Sara' }))
    mockSettingsGets({ '/subscriptions/clinic/clinic-1': null })
    const user = userEvent.setup()
    renderSettings()
    await screen.findByDisplayValue('Al Amal Clinic')

    await user.click(screen.getByRole('button', { name: /subscription/i }))

    expect(screen.getByText('No active subscription')).toBeInTheDocument()
  })
})
