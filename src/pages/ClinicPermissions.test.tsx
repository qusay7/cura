import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ClinicPermissions from './ClinicPermissions'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const rolesData = () => [
  { roleId: 'r1', roleName: 'Doctor', permissions: ['patients.view'] },
  { roleId: 'r2', roleName: 'Receptionist', permissions: [] },
]

const permissionsData = () => [
  { id: 'p1', name: 'patients.view', module: 'patients', displayName: 'View Patients' },
  { id: 'p2', name: 'patients.create', module: 'patients', displayName: 'Add Patient' },
]

// Default: roles and the global permission catalog resolve via a persistent
// implementation, so a refetch or additional GET (e.g. reset-to-default)
// keeps working without needing to re-queue values.
function mockClinicPermGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/roles/clinic-permissions') return Promise.resolve({ data: rolesData() })
    if (url === '/roles/all-permissions') return Promise.resolve({ data: permissionsData() })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderClinicPermissions() {
  render(
    <MemoryRouter initialEntries={['/settings/permissions']}>
      <Routes>
        <Route path="/settings/permissions" element={<ClinicPermissions />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ClinicPermissions', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.alert = vi.fn()
    window.confirm = vi.fn(() => true)
  })

  it('redirects to /login when loading fails', async () => {
    mockClinicPermGets({ '/roles/clinic-permissions': new Error('unauthorized') })
    renderClinicPermissions()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('auto-selects the first role and shows its permission count', async () => {
    mockClinicPermGets()
    renderClinicPermissions()

    await screen.findByRole('button', { name: /^doctor/i })
    expect(screen.getByText('1 permission')).toBeInTheDocument()
    expect(screen.getAllByText('View Patients').length).toBeGreaterThan(0)
  })

  it("switches roles and reflects the newly selected role's empty permissions", async () => {
    mockClinicPermGets()
    const user = userEvent.setup()
    renderClinicPermissions()
    await screen.findByRole('button', { name: /^doctor/i })

    await user.click(screen.getByText('Receptionist'))

    expect(await screen.findByText('No permissions')).toBeInTheDocument()
  })

  it("toggles a permission and updates the selected role's count", async () => {
    mockClinicPermGets()
    const user = userEvent.setup()
    renderClinicPermissions()
    await screen.findByRole('button', { name: /^doctor/i })
    expect(screen.getByText('1 permission')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add patient/i }))

    expect(await screen.findByText('2 permissions')).toBeInTheDocument()
  })

  it('selects all permissions in a module via Select All', async () => {
    mockClinicPermGets()
    const user = userEvent.setup()
    renderClinicPermissions()
    await screen.findByRole('button', { name: /^doctor/i })

    await user.click(screen.getByRole('button', { name: /select all/i }))

    expect(await screen.findByText('2 permissions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument()
  })

  it("saves the selected role's permissions", async () => {
    mockClinicPermGets()
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderClinicPermissions()
    await screen.findByRole('button', { name: /^doctor/i })

    await user.click(screen.getByRole('button', { name: /add patient/i }))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/roles/clinic-permissions/r1',
        expect.arrayContaining(['patients.view', 'patients.create'])
      )
    )
    expect(await screen.findByText('Saved ✅')).toBeInTheDocument()
  })

  it('shows an inline error toast when saving fails', async () => {
    mockClinicPermGets()
    mockedApi.put.mockRejectedValueOnce(new Error('server error'))
    const user = userEvent.setup()
    renderClinicPermissions()
    await screen.findByRole('button', { name: /^doctor/i })

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Error saving permissions'))
  })

  it('resets permissions to default after confirmation', async () => {
    mockClinicPermGets({ '/roles/default-permissions/r1': ['patients.view', 'patients.create'] })
    const user = userEvent.setup()
    renderClinicPermissions()
    await screen.findByRole('button', { name: /^doctor/i })

    await user.click(screen.getByRole('button', { name: /reset to default/i }))

    expect(window.confirm).toHaveBeenCalled()
    expect(await screen.findByText('2 permissions')).toBeInTheDocument()
  })

  it('does not reset when the confirmation is dismissed', async () => {
    window.confirm = vi.fn(() => false)
    mockClinicPermGets()
    const user = userEvent.setup()
    renderClinicPermissions()
    await screen.findByRole('button', { name: /^doctor/i })

    await user.click(screen.getByRole('button', { name: /reset to default/i }))

    expect(mockedApi.get).not.toHaveBeenCalledWith(expect.stringContaining('/roles/default-permissions'))
  })
})
