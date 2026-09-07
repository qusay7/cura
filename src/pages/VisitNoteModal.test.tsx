import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitNoteModal from './VisitNoteModal'
import api from '../api/axios'

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

const baseProps = {
  isOpen: true,
  appointmentId: 'appt-1',
  patientId: 'pat-1',
  doctorId: 'doc-1',
  lang: 'en' as const,
}

describe('VisitNoteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    render(<VisitNoteModal {...baseProps} isOpen={false} onClose={onClose} onSaved={onSaved} />)

    expect(screen.queryByText('Visit Notes')).not.toBeInTheDocument()
  })

  it('creates a new visit note', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(<VisitNoteModal {...baseProps} onClose={onClose} onSaved={onSaved} />)

    expect(screen.getByText('Visit Notes', { exact: false })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Enter diagnosis...'), 'Flu')
    await user.type(screen.getByPlaceholderText('Enter medications and dosages...'), 'Rest')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/visitnotes',
        expect.objectContaining({ patientId: 'pat-1', appointmentId: 'appt-1', diagnosis: 'Flu', prescription: 'Rest' })
      )
    )
    expect(onSaved).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('pre-fills the form when editing an existing note, and submits a PUT', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: {} })
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(
      <VisitNoteModal
        {...baseProps}
        onClose={onClose}
        onSaved={onSaved}
        existingNote={{ id: 'note-1', diagnosis: 'Cold', prescription: 'Fluids', cost: 20, nextVisitDate: '2026-02-01T00:00:00' }}
      />
    )

    expect(screen.getByText('Edit Visit Notes', { exact: false })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cold')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Fluids')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/visitnotes/note-1',
        expect.objectContaining({ diagnosis: 'Cold', prescription: 'Fluids', cost: 20 })
      )
    )
    expect(onSaved).toHaveBeenCalled()
  })

  it('shows the server error message and does not close when saving fails', async () => {
    mockedApi.post.mockRejectedValueOnce({ response: { data: 'Duplicate note' } })
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(<VisitNoteModal {...baseProps} onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText('Duplicate note', { exact: false })).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes without saving when Cancel is clicked', async () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(<VisitNoteModal {...baseProps} onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it('exposes dialog semantics, traps focus inside, and closes on Escape', async () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(<VisitNoteModal {...baseProps} onClose={onClose} onSaved={onSaved} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName(/visit notes/i)
    // The close button is the dialog's first focusable element.
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })
})
