import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'

function dispatchBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event
}

function Harness({ ready = true }: { ready?: boolean }) {
  const [value, setValue] = useState('initial')
  useUnsavedChangesWarning({ value }, ready)
  return <input aria-label="field" value={value} onChange={e => setValue(e.target.value)} />
}

// Loads a value asynchronously (simulating an edit page's data fetch) before
// flipping `ready` — the hydration itself must not count as a "change".
function AsyncHarness() {
  const [ready, setReady] = useState(false)
  const [value, setValue] = useState('')
  useUnsavedChangesWarning({ value }, ready)
  return (
    <div>
      <input aria-label="field" value={value} onChange={e => setValue(e.target.value)} />
      <button onClick={() => { setValue('hydrated from server'); setReady(true) }}>load</button>
    </div>
  )
}

describe('useUnsavedChangesWarning', () => {
  it('does not block beforeunload when nothing has changed', () => {
    render(<Harness />)

    const event = dispatchBeforeUnload()

    expect(event.defaultPrevented).toBe(false)
  })

  it('blocks beforeunload once the tracked value changes', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText('field'), '!')

    const event = dispatchBeforeUnload()

    expect(event.defaultPrevented).toBe(true)
  })

  it('does not treat the initial data hydration as a change', async () => {
    const user = userEvent.setup()
    render(<AsyncHarness />)

    await user.click(screen.getByRole('button', { name: /load/i }))

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false)

    await user.type(screen.getByLabelText('field'), '!')

    expect(dispatchBeforeUnload().defaultPrevented).toBe(true)
  })

  it('stops blocking once unmounted', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness />)
    await user.type(screen.getByLabelText('field'), '!')
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true)

    unmount()

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false)
  })
})
