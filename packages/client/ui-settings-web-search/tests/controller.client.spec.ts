import { describe, expect, it, vi } from 'vitest'
import type { SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client'
import {
  RemoteError, stubConfigForm, type StubConfigForm,
} from '@deepseek-ai/dsh-client-test-runtime'
import { WebSearchCardController, type WebSearchSettings } from '../src/client/web-search-card-controller.ts'

function acceptWrites<T>(host: StubConfigForm<T>): void {
  const section = (): Record<string, unknown> => ({ ...host.scope.getSnapshot().value as object })
  const layer = (): Record<string, unknown> => ({ ...host.scope.getSnapshot().user as object })
  host.mutate.mockImplementation((ops: readonly SettingsPathOpView[]) => {
    const value = { ...section() }
    const user = { ...layer() }
    for (const op of ops) {
      const field = op.path[0]!
      if (op.op === 'set') { value[field] = op.value; user[field] = op.value }
      else {
        Reflect.deleteProperty(user, field)
        const base = host.scope.getSnapshot().base as Record<string, unknown> | undefined
        value[field] = base?.[field]
      }
    }
    host.publish({ value: value as T, user })
    return Promise.resolve(true)
  })
}

function credentialsApi(initial: readonly string[] = []) {
  const configured = new Set(initial)
  const describe = vi.fn((refs: readonly string[]) => Promise.resolve({
    ok: true as const,
    value: Object.fromEntries(refs.map(ref => [ref, { configured: configured.has(ref), writable: true }])),
  }))
  const set = vi.fn((ref: string, value: string) => {
    if (value.trim() !== '') configured.add(ref)
    return Promise.resolve({ ok: true as const, value: undefined })
  })
  return { ctx: { remote: { credentials: { describe, set } } } as never, describe, set }
}

describe('WebSearchCardController', () => {
  it('reads the chosen provider key without returning its value', async () => {
    const host = stubConfigForm<WebSearchSettings>()
    const credentials = credentialsApi(['EXA_API_KEY'])
    const controller = new WebSearchCardController(host.scope, credentials.ctx)
    host.publish({ status: 'ready', writable: true, value: { searchProvider: 'exa' }, user: {} })

    await vi.waitFor(() => { expect(credentials.describe).toHaveBeenCalledWith(['EXA_API_KEY']) })
    expect(controller.inject().hooks.webSearchCard.getSnapshot()).toMatchObject({
      provider: 'exa',
      apiKey: { text: '', overridden: false },
      apiKeyConfigured: true,
      apiKeyWritable: true,
    })
  })

  it('changes provider and stores the pasted key only in the matching credential reference', async () => {
    const host = stubConfigForm<WebSearchSettings>()
    acceptWrites(host)
    const credentials = credentialsApi()
    const controller = new WebSearchCardController(host.scope, credentials.ctx)
    host.publish({ status: 'ready', writable: true, revision: 3, value: { searchProvider: 'exa' }, base: { searchProvider: 'exa' }, user: {} })
    const face = controller.inject()

    face.edit('searchProvider', 'parallel')
    await vi.waitFor(() => { expect(credentials.describe).toHaveBeenCalledWith(['PARALLEL_API_KEY']) })
    face.edit('apiKey', ' parallel-secret ')
    face.save()

    await vi.waitFor(() => { expect(credentials.set).toHaveBeenCalledWith('PARALLEL_API_KEY', 'parallel-secret') })
    await vi.waitFor(() => { expect(face.hooks.webSearchCard.getSnapshot().dirty).toBe(false) })
    expect(host.mutate).toHaveBeenCalledWith(
      [{ op: 'set', path: ['searchProvider'], value: 'parallel' }],
      3,
    )
    expect(host.set).not.toHaveBeenCalled()
    expect(face.hooks.webSearchCard.getSnapshot()).toMatchObject({ provider: 'parallel', apiKeyConfigured: true })
  })

  it('keeps the stored key when the draft is blank', () => {
    const host = stubConfigForm<WebSearchSettings>()
    const credentials = credentialsApi(['EXA_API_KEY'])
    const controller = new WebSearchCardController(host.scope, credentials.ctx)
    host.publish({ status: 'ready', writable: true, value: { searchProvider: 'exa' }, user: {} })
    const face = controller.inject()

    face.edit('apiKey', '   ')
    expect(face.hooks.webSearchCard.getSnapshot().dirty).toBe(false)
    face.save()
    expect(credentials.set).not.toHaveBeenCalled()
  })

  it('reacts only to invalidations for the currently selected provider key', async () => {
    const host = stubConfigForm<WebSearchSettings>()
    const credentials = credentialsApi()
    const controller = new WebSearchCardController(host.scope, credentials.ctx)
    const face = controller.inject()
    await vi.waitFor(() => { expect(credentials.describe).toHaveBeenCalledWith(['EXA_API_KEY']) })
    credentials.describe.mockClear()

    controller.refreshCredential('PARALLEL_API_KEY')
    expect(credentials.describe).not.toHaveBeenCalled()
    controller.refreshCredential('EXA_API_KEY')
    await vi.waitFor(() => { expect(credentials.describe).toHaveBeenCalledWith(['EXA_API_KEY']) })
    expect(face.hooks.webSearchCard.getSnapshot().apiKeyConfigured).toBe(false)
  })

  it('keeps the key control usable when settings are read-only', () => {
    const host = stubConfigForm<WebSearchSettings>()
    const credentials = credentialsApi()
    const controller = new WebSearchCardController(host.scope, credentials.ctx)
    host.publish({ status: 'ready', writable: false, value: { searchProvider: 'exa' }, user: {} })

    expect(controller.inject().hooks.webSearchCard.getSnapshot()).toMatchObject({ writable: false, apiKeyWritable: true })
  })

  it('disables a key supplied by a read-only source', async () => {
    const host = stubConfigForm<WebSearchSettings>()
    const credentials = credentialsApi()
    credentials.describe.mockImplementation((refs: readonly string[]) => Promise.resolve({
      ok: true as const,
      value: Object.fromEntries(refs.map(ref => [ref, { configured: true, writable: false }])),
    }))
    const controller = new WebSearchCardController(host.scope, credentials.ctx)

    await vi.waitFor(() => { expect(controller.inject().hooks.webSearchCard.getSnapshot().apiKeyWritable).toBe(false) })
  })

  it('keeps the card usable when the credential service refuses the read', async () => {
    const host = stubConfigForm<WebSearchSettings>()
    const refusal = () => Promise.resolve({
      ok: false as const,
      error: new RemoteError('credential/rejected', 'offline', { ref: 'EXA_API_KEY' }),
    })
    const controller = new WebSearchCardController(host.scope, {
      remote: { credentials: { describe: vi.fn(refusal), set: vi.fn(refusal) } },
    } as never)
    host.publish({ status: 'ready', writable: true, value: { searchProvider: 'exa' }, user: {} })

    await vi.waitFor(() => { expect(controller.inject().hooks.webSearchCard.getSnapshot().available).toBe(true) })
  })
})
