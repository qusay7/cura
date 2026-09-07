import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import api from './api/axios'

vi.mock('./api/axios', () => ({
  default: { get: vi.fn() },
}))

const mockedApi = vi.mocked(api, true)

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  )
}

describe('App — document lang/dir sync', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockedApi.get.mockResolvedValue({ data: [] })
    document.documentElement.lang = ''
    document.documentElement.dir = ''
  })

  it('defaults <html lang>/dir to English/LTR when no language is stored', () => {
    renderApp()

    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('applies the stored language to <html> on mount', () => {
    localStorage.setItem('cura-lang', 'ar')
    renderApp()

    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })

  it('updates <html lang>/dir when the app-wide language change event fires', () => {
    renderApp()
    expect(document.documentElement.lang).toBe('en')

    window.dispatchEvent(new CustomEvent('cura-lang-change', { detail: 'ar' }))

    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })
})
