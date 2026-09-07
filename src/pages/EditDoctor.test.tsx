import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EditDoctor from './EditDoctor'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

// ECGAnimation draws to a <canvas>, which jsdom doesn't implement — irrelevant
// decoration for the brief loading screen these tests pass through.
vi.mock('../components/ECGAnimation', () => ({
  ECGAnimation: () => null,
}))

const mockedApi = vi.mocked(api, true)

// The component pads the "loading" state to at least 800ms regardless of how
// fast the API resolves, so the loading screen needs a generous wait.
const LOADING_TIMEOUT = { timeout: 2000 }

const doctorRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
  fullName: 'Dr. Ali',
  specialty: 'Cardiology',
  phone: '0501234567',
  email: 'ali@example.com',
  notes: '',
  isActive: true,
  departmentId: '',
  workType: 'appointments',
  ...overrides,
})

// Default: doctor loads, and every side panel (departments, templates,
// financial settings) resolves empty via a persistent implementation, so
// repeated fetches (e.g. after saving) keep working without a once-queue.
function mockEditDoctorGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/doctors/doc-1') return Promise.resolve({ data: doctorRecord() })
    if (url === '/departments') return Promise.resolve({ data: [] })
    if (url === '/treatmentplans/templates') return Promise.resolve({ data: [] })
    if (url === '/doctors/doc-1/financial-settings') return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderEditDoctor() {
  render(
    <MemoryRouter initialEntries={['/doctors/doc-1/edit']}>
      <Routes>
        <Route path="/doctors/:id/edit" element={<EditDoctor />} />
        <Route path="/doctors" element={<div>doctors page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('EditDoctor', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('loads and pre-fills the doctor info', async () => {
    mockEditDoctorGets()
    renderEditDoctor()

    expect(await screen.findByDisplayValue('Dr. Ali', {}, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cardiology')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0501234567')).toBeInTheDocument()
  })

  it('shows a failure message before redirecting to the doctors list when loading fails', async () => {
    mockEditDoctorGets({ '/doctors/doc-1': new Error('not found') })
    renderEditDoctor()

    expect(await screen.findByText('Failed to load doctor data', {}, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(await screen.findByText('doctors page', undefined, { timeout: 3000 })).toBeInTheDocument()
  })

  it('redirects to the doctors list immediately when the session has expired (401)', async () => {
    mockEditDoctorGets({
      '/doctors/doc-1': Object.assign(new Error('unauthorized'), { response: { status: 401 } }),
    })
    renderEditDoctor()

    expect(await screen.findByText('doctors page', undefined, LOADING_TIMEOUT)).toBeInTheDocument()
    expect(screen.queryByText('Failed to load doctor data')).not.toBeInTheDocument()
  })

  it('saves the doctor info and navigates back to the list', async () => {
    mockEditDoctorGets()
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderEditDoctor()
    const nameInput = await screen.findByDisplayValue('Dr. Ali', {}, LOADING_TIMEOUT)

    await user.clear(nameInput)
    await user.type(nameInput, 'Dr. Ali Hassan')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/doctors/doc-1',
        expect.objectContaining({ fullName: 'Dr. Ali Hassan' })
      )
    )
    expect(await screen.findByText('Saved successfully')).toBeInTheDocument()
    // Navigation is intentionally delayed so the success banner is visible
    // for a moment first, rather than an instant, unconfirmed redirect.
    expect(await screen.findByText('doctors page', undefined, { timeout: 2000 })).toBeInTheDocument()
  })

  it('shows the server error message when saving fails', async () => {
    mockEditDoctorGets()
    mockedApi.put.mockRejectedValueOnce({ response: { data: 'Duplicate email' } })
    const user = userEvent.setup()
    renderEditDoctor()
    await screen.findByDisplayValue('Dr. Ali', {}, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Duplicate email')).toBeInTheDocument()
  })

  it('loads and pre-fills the general financial settings on the Financial tab', async () => {
    mockEditDoctorGets({
      '/doctors/doc-1/financial-settings': [
        {
          id: 'fin-1', templateId: null, templateName: null, isGeneral: true,
          firstVisitPrice: 25, followUpPrice: 15, commissionType: 'percentage',
          firstVisitCommissionRate: 30, followUpCommissionRate: 20, isActive: true,
        },
      ],
    })
    const user = userEvent.setup()
    renderEditDoctor()
    await screen.findByDisplayValue('Dr. Ali', {}, LOADING_TIMEOUT)

    await user.click(screen.getByRole('button', { name: /financial settings/i }))

    expect(await screen.findByDisplayValue('25')).toBeInTheDocument()
    expect(screen.getByDisplayValue('15')).toBeInTheDocument()
  })

  it('saves the general financial settings', async () => {
    mockEditDoctorGets()
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderEditDoctor()
    await screen.findByDisplayValue('Dr. Ali', {}, LOADING_TIMEOUT)
    await user.click(screen.getByRole('button', { name: /financial settings/i }))
    await screen.findByText('General Settings')

    const [firstVisitPriceInput] = screen.getAllByPlaceholderText('Use template price')
    await user.type(firstVisitPriceInput, '40')
    await user.click(screen.getByRole('button', { name: /save general settings/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/doctors/doc-1/financial-settings/general',
        expect.objectContaining({ firstVisitPrice: 40 })
      )
    )
    expect(await screen.findByText('Saved successfully', { exact: false })).toBeInTheDocument()
  })

  it('requires selecting a template before saving an exception', async () => {
    mockEditDoctorGets()
    const user = userEvent.setup()
    renderEditDoctor()
    await screen.findByDisplayValue('Dr. Ali', {}, LOADING_TIMEOUT)
    await user.click(screen.getByRole('button', { name: /financial settings/i }))
    await screen.findByText('Template-Specific Exceptions')

    await user.click(screen.getByRole('button', { name: /\+ add exception/i }))
    await user.click(screen.getByRole('button', { name: /save exception/i }))

    expect(await screen.findByText(/select a template first/i)).toBeInTheDocument()
    expect(mockedApi.put).not.toHaveBeenCalled()
  })

  it('deletes a financial exception after confirmation', async () => {
    mockEditDoctorGets({
      '/doctors/doc-1/financial-settings': [
        {
          id: 'fin-2', templateId: 'tpl-1', templateName: 'Checkup', isGeneral: false,
          firstVisitPrice: null, followUpPrice: null, commissionType: 'percentage',
          firstVisitCommissionRate: 10, followUpCommissionRate: 5, isActive: true,
        },
      ],
    })
    mockedApi.delete.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderEditDoctor()
    await screen.findByDisplayValue('Dr. Ali', {}, LOADING_TIMEOUT)
    await user.click(screen.getByRole('button', { name: /financial settings/i }))
    await screen.findByText('Checkup')

    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() =>
      expect(mockedApi.delete).toHaveBeenCalledWith('/doctors/doc-1/financial-settings/fin-2')
    )
  })
})
