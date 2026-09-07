import { describe, it, expect, vi } from 'vitest'
import { useRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFocusTrap } from './useFocusTrap'

function Dialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, true, onClose)
  return (
    <div ref={ref} role="dialog" aria-modal="true" tabIndex={-1}>
      <button>First</button>
      <button>Last</button>
    </div>
  )
}

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      {open && <Dialog onClose={() => setOpen(false)} />}
    </div>
  )
}

describe('useFocusTrap', () => {
  it('moves focus into the dialog on open', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /open dialog/i }))

    expect(screen.getByRole('button', { name: /^first$/i })).toHaveFocus()
  })

  it('wraps Tab from the last focusable element back to the first', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /open dialog/i }))

    screen.getByRole('button', { name: /^last$/i }).focus()
    await user.tab()

    expect(screen.getByRole('button', { name: /^first$/i })).toHaveFocus()
  })

  it('wraps Shift+Tab from the first focusable element back to the last', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /open dialog/i }))

    expect(screen.getByRole('button', { name: /^first$/i })).toHaveFocus()
    await user.tab({ shift: true })

    expect(screen.getByRole('button', { name: /^last$/i })).toHaveFocus()
  })

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /open dialog/i }))

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('returns focus to the trigger button after the dialog closes', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: /open dialog/i })
    await user.click(trigger)

    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('does nothing when isOpen is false', () => {
    const onClose = vi.fn()
    function ClosedDialog() {
      const ref = useRef<HTMLDivElement>(null)
      useFocusTrap(ref, false, onClose)
      return <div ref={ref}><button>Inert</button></div>
    }
    render(<ClosedDialog />)

    expect(screen.getByRole('button', { name: /inert/i })).not.toHaveFocus()
  })
})
