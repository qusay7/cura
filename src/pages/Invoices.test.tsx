import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Invoices from './Invoices'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), defaults: { baseURL: '/api' } },
}))

const mockedApi = vi.mocked(api, true)

const invoice = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'inv-1',
  invoiceNumber: 'INV-001',
  documentType: '388',
  patientName: 'Sara Ahmad',
  issueDate: '2026-01-01',
  totalAmount: 100,
  taxAmount: 5,
  payableAmount: 105,
  isSubmitted: false,
  invoiceXml: null,
  taxResponse: null,
  qrCode: null,
  ...overrides,
})

const invoiceDetail = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'inv-1',
  invoiceNumber: 'INV-001',
  documentType: '388',
  patientName: 'Sara Ahmad',
  issueDate: '2026-01-01',
  taxMethod: '2',
  totalAmount: 100,
  discountAmount: 0,
  taxAmount: 5,
  taxRate: 5,
  payableAmount: 105,
  items: [{ id: 'item-1', name: 'Checkup', quantity: 1, unitPrice: 100, discount: 0, taxAmount: 5 }],
  ...overrides,
})

// Default: no clinic in localStorage (PrintHeader stays hidden), an empty
// invoices page. A persistent implementation so refetches after filtering,
// paging, submitting, and creating keep working without a once-queue.
function mockInvoicesGets(overrides: Record<string, unknown> = {}) {
  mockedApi.get.mockImplementation((url: string) => {
    for (const key of Object.keys(overrides)) {
      if (url === key || url.startsWith(key)) {
        const value = overrides[key]
        return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value })
      }
    }
    if (url.startsWith('/invoices?')) return Promise.resolve({ data: { invoices: [], pages: 1 } })
    if (url === '/invoices/uninvoiced-payments') return Promise.resolve({ data: [] })
    if (url.startsWith('/invoices/inv-1')) return Promise.resolve({ data: invoiceDetail() })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

function renderInvoices() {
  render(
    <MemoryRouter initialEntries={['/invoices']}>
      <Routes>
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Invoices', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.alert = vi.fn()
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  it('redirects to /login when loading fails with a 401', async () => {
    const unauthorized = Object.assign(new Error('unauthorized'), { response: { status: 401 } })
    mockInvoicesGets({ '/invoices?': unauthorized })
    renderInvoices()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('shows the empty state when there are no invoices', async () => {
    mockInvoicesGets()
    renderInvoices()

    expect(await screen.findByText('No invoices found')).toBeInTheDocument()
  })

  it('renders an invoice row with its type and submission badges', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice()], pages: 1 } })
    renderInvoices()

    expect(await screen.findByText('Sara Ahmad')).toBeInTheDocument()
    const row = screen.getByText('Sara Ahmad').closest('tr') as HTMLElement
    expect(within(row).getByText('Sales Invoice')).toBeInTheDocument()
    expect(within(row).getByText('Not submitted', { exact: false })).toBeInTheDocument()
  })

  it('re-fetches with the selected document-type and submission filters', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice()], pages: 1 } })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('Sara Ahmad')

    const [docTypeSelect, submitSelect] = screen.getAllByRole('combobox')
    await user.selectOptions(docTypeSelect, '381')
    await user.selectOptions(submitSelect, 'yes')
    await user.click(screen.getByRole('button', { name: /^apply$/i }))

    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('documentType=381'))
    )
    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('isSubmitted=true'))
    )
  })

  it('opens the invoice view modal and shows its line items', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice()], pages: 1 } })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /view/i }))

    expect(await screen.findByText('Checkup')).toBeInTheDocument()
    expect(screen.getAllByText('INV-001').length).toBeGreaterThan(1)
  })

  it('closes the invoice modal on Escape and returns focus to the View button', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice()], pages: 1 } })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('Sara Ahmad')
    const viewButton = screen.getByRole('button', { name: /view/i })

    await user.click(viewButton)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName(/sales invoice/i)

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(viewButton).toHaveFocus()
  })

  it('submits an invoice and refetches the list', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice()], pages: 1 } })
    mockedApi.post.mockResolvedValueOnce({ data: { message: 'Submitted!' } })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /^📤 submit$/i }))

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith('/invoices/inv-1/submit'))
    expect(window.alert).toHaveBeenCalledWith('Submitted!')
  })

  it('does not show a submit button for an already-submitted invoice', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice({ isSubmitted: true })], pages: 1 } })
    renderInvoices()

    await screen.findByText('Sara Ahmad')
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument()
  })

  it('creates a new invoice from an uninvoiced payment', async () => {
    mockInvoicesGets({
      '/invoices?': { invoices: [], pages: 1 },
      '/invoices/uninvoiced-payments': [{ id: 'pay-1', patientName: 'Omar Khalil', createdAt: '2026-01-01', totalAmount: 50 }],
    })
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('No invoices found')

    await user.click(screen.getByRole('button', { name: /new invoice/i }))
    await user.click(await screen.findByText('Omar Khalil'))
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/invoices/from-payment',
        expect.objectContaining({ paymentDetailId: 'pay-1' })
      )
    )
  })

  it('creates a credit note (return) against an existing invoice', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice()], pages: 1 } })
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: /credit note/i }))
    await screen.findByText('INV-001')
    await user.type(screen.getByRole('textbox'), 'Wrong service')
    await user.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/invoices/return',
        expect.objectContaining({ sourceInvoiceId: 'inv-1', reason: 'Wrong service' })
      )
    )
  })

  it('closes the new-invoice and credit-note modals on Escape, returning focus to their trigger', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice()], pages: 1 } })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('Sara Ahmad')

    const newInvoiceButton = screen.getByRole('button', { name: /new invoice/i })
    await user.click(newInvoiceButton)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(newInvoiceButton).toHaveFocus()

    const creditNoteButton = screen.getByRole('button', { name: /credit note/i })
    await user.click(creditNoteButton)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(creditNoteButton).toHaveFocus()
  })

  it('shows the QR/XML viewer for a submitted invoice', async () => {
    mockInvoicesGets({
      '/invoices?': { invoices: [invoice({ isSubmitted: true, invoiceXml: '<xml>data</xml>' })], pages: 1 },
    })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('Sara Ahmad')

    const xmlButton = screen.getByRole('button', { name: '📄' })
    await user.click(xmlButton)

    expect(await screen.findByText('<xml>data</xml>')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(xmlButton).toHaveFocus()
  })

  it('paginates to the next page', async () => {
    mockInvoicesGets({ '/invoices?': { invoices: [invoice()], pages: 2 } })
    const user = userEvent.setup()
    renderInvoices()
    await screen.findByText('Sara Ahmad')

    await user.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() =>
      expect(mockedApi.get).toHaveBeenCalledWith(expect.stringContaining('page=2'))
    )
  })
})
