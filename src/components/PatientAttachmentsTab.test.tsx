import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PatientAttachmentsTab from './PatientAttachmentsTab'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const attachment = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'att-1',
  fileName: 'chest-xray.png',
  fileType: 'image/png',
  fileSize: 20480,
  category: 'xray',
  notes: null,
  createdAt: '2026-01-01T00:00:00',
  appointmentId: null,
  isImage: true,
  ...overrides,
})

describe('PatientAttachmentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  it('opens the preview modal, traps focus, and restores it on Escape', async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/attachments/patient/pat-1') return Promise.resolve({ data: [attachment()] })
      if (url === '/attachments/att-1/file') return Promise.resolve({ data: new Blob(['x']) })
      return Promise.reject(new Error(`unexpected GET ${url}`))
    })
    const user = userEvent.setup()
    render(<PatientAttachmentsTab patientId="pat-1" lang="en" />)
    const viewButton = await screen.findByRole('button', { name: /view/i })

    await user.click(viewButton)

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('chest-xray.png')
    // The dialog's own close button is its first focusable element.
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(viewButton).toHaveFocus()
  })

  it('shows the empty state when there are no attachments', async () => {
    mockedApi.get.mockResolvedValue({ data: [] })
    render(<PatientAttachmentsTab patientId="pat-1" lang="en" />)

    expect(await screen.findByText('No attachments for this patient yet')).toBeInTheDocument()
  })
})
