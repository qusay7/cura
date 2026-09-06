import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Staff from './Staff'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const staffMember = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'staff-1',
  fullName: 'Sara Ahmad',
  jobTitle: 'Receptionist',
  gender: 'female',
  phone: '0501234567',
  role: 'r1',
  roleNameEn: 'Receptionist',
  roleNameAr: 'موظف استقبال',
  contractType: 'fulltime',
  departmentName: 'Front Desk',
  isActive: true,
  ...overrides,
})

const emptyStats = { total: 0, active: 0, inactive: 0, totalSalary: 0, byRole: [] }

// Default: staff/stats/departments/roles all resolve empty via a persistent
// implementation (not a once-queue), so a refetch after save/edit/delete
// keeps working without needing to re-queue values.
function mockStaffGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/staff') return Promise.resolve({ data: [] })
    if (url === '/staff/stats') return Promise.resolve({ data: emptyStats })
    if (url === '/departments') return Promise.resolve({ data: [] })
    if (url === '/roles') return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderStaff() {
  render(
    <MemoryRouter initialEntries={['/staff']}>
      <Routes>
        <Route path="/staff" element={<Staff />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Staff', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('redirects to /login when the staff list fails to load with a 401', async () => {
    const unauthorized = Object.assign(new Error('unauthorized'), { response: { status: 401 } })
    mockStaffGets({ '/staff': unauthorized })
    renderStaff()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('renders a staff card with role, department and phone, and the summary stats', async () => {
    mockStaffGets({
      '/staff': [staffMember()],
      '/staff/stats': { total: 1, active: 1, inactive: 0, totalSalary: 1200, byRole: [] },
    })
    renderStaff()

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByText('Front Desk')).toBeInTheDocument()
    expect(screen.getByText('0501234567')).toBeInTheDocument()
    expect(screen.getByText('Receptionist — Full Time', { exact: false })).toBeInTheDocument()
  })

  it('shows the empty state when there is no staff', async () => {
    mockStaffGets()
    renderStaff()

    expect(await screen.findByText('No staff members')).toBeInTheDocument()
  })

  it('shows an alert when saving without a name', async () => {
    mockStaffGets()
    const user = userEvent.setup()
    renderStaff()
    await screen.findByText('No staff members')

    await user.click(screen.getByRole('button', { name: /\+ add staff/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText('Name required', { exact: false })).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('creates a staff member and shows a success alert', async () => {
    mockStaffGets()
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderStaff()
    await screen.findByText('No staff members')

    await user.click(screen.getByRole('button', { name: /\+ add staff/i }))
    // The Full Name field's <label> isn't programmatically associated (no
    // htmlFor/id) and the page's own search box is also a plain textbox, so
    // locate the modal's field via its label's sibling input instead.
    const fullNameInput = screen.getByText('Full Name *').parentElement!.querySelector('input') as HTMLInputElement
    await user.type(fullNameInput, 'Omar Khalil')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/staff?lang=en',
        expect.objectContaining({ fullName: 'Omar Khalil' })
      )
    )
    expect(await screen.findByText('Saved successfully', { exact: false })).toBeInTheDocument()
  })

  it("edits a staff member via the card's Edit button", async () => {
    mockStaffGets({ '/staff': [staffMember()] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderStaff()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /^✏️ edit$/i }))
    const nameInput = screen.getByDisplayValue('Sara Ahmad')
    await user.clear(nameInput)
    await user.type(nameInput, 'Sara Ahmad Updated')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/staff/staff-1?lang=en',
        expect.objectContaining({ fullName: 'Sara Ahmad Updated' })
      )
    )
  })

  it("toggles a staff member's active status", async () => {
    mockStaffGets({ '/staff': [staffMember({ isActive: true })] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderStaff()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: '⏸' }))

    expect(mockedApi.put).toHaveBeenCalledWith('/staff/staff-1/toggle-active?lang=en')
  })

  it('deletes a staff member after confirmation', async () => {
    mockStaffGets({ '/staff': [staffMember()] })
    mockedApi.delete.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderStaff()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: '🗑️' }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/staff/staff-1?lang=en'))
  })

  it('does not delete when the confirmation is dismissed', async () => {
    mockStaffGets({ '/staff': [staffMember()] })
    window.confirm = vi.fn(() => false)
    const user = userEvent.setup()
    renderStaff()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: '🗑️' }))

    expect(mockedApi.delete).not.toHaveBeenCalled()
  })

  it('filters the list by name as the user types', async () => {
    mockStaffGets({
      '/staff': [staffMember(), staffMember({ id: 'staff-2', fullName: 'Omar Khalil' })],
    })
    const user = userEvent.setup()
    renderStaff()
    await screen.findByText('Sara Ahmad')

    await user.type(screen.getByPlaceholderText('Search...'), 'Omar')

    expect(screen.getByText('Omar Khalil')).toBeInTheDocument()
    expect(screen.queryByText('Sara Ahmad')).not.toBeInTheDocument()
  })
})
