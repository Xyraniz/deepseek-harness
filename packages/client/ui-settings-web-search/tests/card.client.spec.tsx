// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SettingsFieldState, SettingsFormShell } from '@deepseek-ai/dsh-client-ui-primitives'
import { WebSearchCard, type WebSearchCardProps } from '../src/client/WebSearchCard.tsx'
import type { WebSearchCardState } from '../src/client/web-search-card-controller.ts'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const t = (key: keyof typeof en) => en[key]
const settled: SettingsFormShell = { available: true, writable: true, dirty: false, invalid: false, saving: false, failed: false }

function field(text: string, rest: Partial<SettingsFieldState> = {}): SettingsFieldState {
  return { text, overridden: false, invalid: false, ...rest }
}

function cardActions() {
  return { edit: vi.fn(), resetField: vi.fn(), save: vi.fn(), discard: vi.fn() }
}

describe('WebSearchCard', () => {
  function renderWebSearch(state: Partial<WebSearchCardState> = {}) {
    const store = createSnapshotStore<WebSearchCardState>({
      ...settled,
      searchProvider: field('exa'),
      provider: 'exa',
      apiKey: field(''),
      apiKeyConfigured: false,
      apiKeyWritable: true,
      ...state,
    })
    const actions = cardActions()
    const props = { ...actions, view: 'page', t, useWebSearchCard: bindSnapshotSelector(store) } as WebSearchCardProps
    render(<WebSearchCard {...props} />)
    return actions
  }

  it('renders its one-liner alone in the summary view', () => {
    const store = createSnapshotStore<WebSearchCardState>({
      ...settled, searchProvider: field('exa'), provider: 'exa', apiKey: field(''), apiKeyConfigured: false, apiKeyWritable: true,
    })
    const props = { ...cardActions(), view: 'summary', t, useWebSearchCard: bindSnapshotSelector(store) } as WebSearchCardProps
    render(<WebSearchCard {...props} />)

    expect(document.body.textContent).toBe(en.description)
    expect(screen.queryByLabelText(en.exaApiKey)).toBeNull()
  })

  it('offers Exa and Parallel and stages the choice', () => {
    const actions = renderWebSearch()

    fireEvent.change(screen.getByLabelText(en.provider), { target: { value: 'parallel' } })

    expect(screen.getByRole('option', { name: en.exa })).toBeTruthy()
    expect(screen.getByRole('option', { name: en.parallel })).toBeTruthy()
    expect(actions.edit).toHaveBeenCalledWith('searchProvider', 'parallel')
  })

  it('uses a write-only password input and reports only whether the selected key exists', () => {
    renderWebSearch({ apiKeyConfigured: true })

    expect(screen.getByText(en.apiKeySet)).toBeTruthy()
    expect(screen.getByLabelText(en.exaApiKey)).toHaveProperty('type', 'password')
  })

  it('labels the password input with the selected provider', () => {
    renderWebSearch({ provider: 'parallel' })

    expect(screen.getByLabelText(en.parallelApiKey)).toHaveProperty('type', 'password')
  })

  it('keeps the key control usable while settings are read-only', () => {
    const actions = renderWebSearch({ writable: false })

    expect(screen.getByLabelText(en.provider)).toHaveProperty('disabled', true)
    const key = screen.getByLabelText(en.exaApiKey)
    expect(key).toHaveProperty('disabled', false)
    fireEvent.change(key, { target: { value: 'exa-secret' } })
    expect(actions.edit).toHaveBeenCalledWith('apiKey', 'exa-secret')
  })

  it('disables the key input when its reference is read-only', () => {
    renderWebSearch({ apiKeyConfigured: true, apiKeyWritable: false })

    expect(screen.getByLabelText(en.exaApiKey)).toHaveProperty('disabled', true)
    expect(screen.getByLabelText(en.provider)).toHaveProperty('disabled', false)
  })
})
