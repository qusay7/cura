import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchableSelect from './SearchableSelect'

const options = [
  { value: 'doc-1', label: 'Dr. Ali' },
  { value: 'doc-2', label: 'Dr. Omar' },
  { value: 'doc-3', label: 'Dr. Sara' },
]

function renderSelect(onChange = vi.fn()) {
  render(
    <SearchableSelect isRtl={false} value="" onChange={onChange} options={options} placeholder="Select a doctor" />
  )
  return onChange
}

describe('SearchableSelect', () => {
  it('shows the placeholder when nothing is selected, and the label once a value is set', () => {
    const { rerender } = render(
      <SearchableSelect isRtl={false} value="" onChange={vi.fn()} options={options} placeholder="Select a doctor" />
    )
    expect(screen.getByRole('button', { name: /select a doctor/i })).toBeInTheDocument()

    rerender(<SearchableSelect isRtl={false} value="doc-2" onChange={vi.fn()} options={options} placeholder="Select a doctor" />)
    expect(screen.getByRole('button', { name: /dr\. omar/i })).toBeInTheDocument()
  })

  it('opens the listbox on click and exposes the correct ARIA roles', async () => {
    const user = userEvent.setup()
    renderSelect()

    const trigger = screen.getByRole('button', { name: /select a doctor/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('filters options as the user types', async () => {
    const user = userEvent.setup()
    renderSelect()
    await user.click(screen.getByRole('button', { name: /select a doctor/i }))

    await user.type(screen.getByRole('combobox'), 'omar')

    const opts = screen.getAllByRole('option')
    expect(opts).toHaveLength(1)
    expect(opts[0]).toHaveTextContent('Dr. Omar')
  })

  it('navigates with the arrow keys and selects the active option with Enter', async () => {
    const user = userEvent.setup()
    const onChange = renderSelect()
    await user.click(screen.getByRole('button', { name: /select a doctor/i }))
    const input = screen.getByRole('combobox')
    await user.click(input)

    // First option is active by default.
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0].id)

    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[1].id)

    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith('doc-2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger button', async () => {
    const user = userEvent.setup()
    renderSelect()
    const trigger = screen.getByRole('button', { name: /select a doctor/i })
    await user.click(trigger)
    await user.click(screen.getByRole('combobox'))

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
