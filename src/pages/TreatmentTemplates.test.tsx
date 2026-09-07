import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import TreatmentTemplates from './TreatmentTemplates'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const template = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'tpl-1',
  name: 'Checkup',
  nameEn: 'General Checkup',
  departmentId: null,
  departmentName: null,
  defaultSessionsCount: 1,
  defaultPricePerSession: null,
  defaultTotalPrice: null,
  firstVisitPrice: 20,
  followUpPrice: 10,
  ...overrides,
})

// Default: no templates and no departments, via a persistent implementation
// so refetches after save/delete keep working without a once-queue.
function mockTemplatesGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    if (url in overrides) {
      const value = overrides[url]
      return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
    }
    if (url === '/treatmentplans/templates') return Promise.resolve({ data: [] })
    if (url === '/departments') return Promise.resolve({ data: [] })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderTemplates() {
  render(
    <MemoryRouter initialEntries={['/settings/templates']}>
      <Routes>
        <Route path="/settings/templates" element={<TreatmentTemplates />} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TreatmentTemplates', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('shows a retry option instead of silently redirecting when loading fails', async () => {
    mockTemplatesGets({ '/treatmentplans/templates': new Error('network error') })
    const user = userEvent.setup()
    renderTemplates()

    expect(await screen.findByText('Failed to load templates', { exact: false })).toBeInTheDocument()
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()

    mockTemplatesGets({ '/treatmentplans/templates': [template()] })
    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(await screen.findByText('Checkup')).toBeInTheDocument()
  })

  it('redirects to the dashboard when the session has expired (401)', async () => {
    mockTemplatesGets({
      '/treatmentplans/templates': Object.assign(new Error('unauthorized'), { response: { status: 401 } }),
    })
    renderTemplates()

    expect(await screen.findByText('dashboard page')).toBeInTheDocument()
  })

  it('shows the empty state when there are no templates', async () => {
    mockTemplatesGets()
    renderTemplates()

    expect(await screen.findByText('No templates yet — click "Add Template" to start')).toBeInTheDocument()
  })

  it('renders a template card with its pricing and the general-department badge', async () => {
    mockTemplatesGets({ '/treatmentplans/templates': [template()] })
    renderTemplates()

    expect(await screen.findByText('Checkup')).toBeInTheDocument()
    expect(screen.getByText('General — all departments')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('shows the no-price-set note when neither visit nor session pricing is set', async () => {
    mockTemplatesGets({ '/treatmentplans/templates': [template({ firstVisitPrice: null, followUpPrice: null })] })
    renderTemplates()

    expect(await screen.findByText('Price not set yet', { exact: false })).toBeInTheDocument()
  })

  it('requires a name before saving a new template', async () => {
    mockTemplatesGets()
    const user = userEvent.setup()
    renderTemplates()
    await screen.findByText('No templates yet — click "Add Template" to start')

    await user.click(screen.getByRole('button', { name: /\+ add template/i }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Name is required', { exact: false })).toBeInTheDocument()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('creates a new template', async () => {
    mockTemplatesGets()
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderTemplates()
    await screen.findByText('No templates yet — click "Add Template" to start')

    await user.click(screen.getByRole('button', { name: /\+ add template/i }))
    const [nameInput] = screen.getAllByRole('textbox')
    await user.type(nameInput, 'Consultation')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/treatmentplans/templates',
        expect.objectContaining({ name: 'Consultation' })
      )
    )
    expect(await screen.findByText('Saved successfully', { exact: false })).toBeInTheDocument()
  })

  it('pre-fills the form when editing, and submits a PUT', async () => {
    mockTemplatesGets({ '/treatmentplans/templates': [template()] })
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderTemplates()
    await screen.findByText('Checkup')

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameInput = screen.getByDisplayValue('Checkup')
    await user.clear(nameInput)
    await user.type(nameInput, 'Checkup Plus')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/treatmentplans/templates/tpl-1',
        expect.objectContaining({ name: 'Checkup Plus' })
      )
    )
  })

  it('deletes a template after confirmation', async () => {
    mockTemplatesGets({ '/treatmentplans/templates': [template()] })
    mockedApi.delete.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderTemplates()
    await screen.findByText('Checkup')

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('/treatmentplans/templates/tpl-1'))
  })
})
