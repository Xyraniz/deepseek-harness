import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import WebRuntime from '@deepseek-ai/dsh-web'
import { ParallelSearchProvider, PARALLEL_PROVIDER_ID } from '@deepseek-ai/dsh-web-search-parallel'
import * as parallelPlugin from '@deepseek-ai/dsh-web-search-parallel'
import { mapParallelResponse, mapParallelResult } from '../src/provider.ts'

const options = { apiKey: 'parallel-key', baseURL: 'https://api.parallel.test/v1', mode: 'fast' as const }

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init })
}

function provideCredentials(ctx: Context): void {
  ctx.provide('credentials', { resolve: vi.fn(async () => undefined) } as never)
}

afterEach(() => { vi.unstubAllGlobals() })

describe('Parallel result mapping', () => {
  it('maps a result with its first excerpt and publication date', () => {
    expect(mapParallelResult({
      url: 'https://a.test', title: 'A', publish_date: '2026-01-01', excerpts: ['salient sentence', 'second'],
    })).toEqual({ url: 'https://a.test', title: 'A', snippet: 'salient sentence', publishedAt: '2026-01-01' })
  })

  it('drops entries without a useful excerpt and omits empty optional fields', () => {
    expect(mapParallelResult({ url: 'https://a.test', excerpts: [] })).toBeUndefined()
    expect(mapParallelResult({ url: 'https://a.test', excerpts: [' ', ''] })).toBeUndefined()
    expect(mapParallelResult({ url: 'https://a.test', title: '', publish_date: null, excerpts: ['hi'] }))
      .toEqual({ url: 'https://a.test', snippet: 'hi' })
  })

  it('maps a response and tolerates an omitted results array', () => {
    expect(mapParallelResponse({ results: [
      { url: 'https://a.test', excerpts: ['one'] },
      { url: 'https://b.test' },
    ] })).toEqual({ sources: [{ url: 'https://a.test', snippet: 'one' }], truncated: false })
    expect(mapParallelResponse({}).sources).toEqual([])
  })
})

describe('ParallelSearchProvider availability', () => {
  it('is unavailable without a key or a credential resolver', () => {
    expect(new ParallelSearchProvider({ ...options, apiKey: '' }).available()).toBe(false)
  })

  it('uses a managed credential resolver and rejects an invalid endpoint', () => {
    expect(new ParallelSearchProvider({ ...options, apiKey: '', resolveApiKey: () => Promise.resolve('saved') }).available()).toBe(true)
    expect(new ParallelSearchProvider({ ...options, baseURL: 'not a url' }).available()).toBe(false)
  })
})

describe('ParallelSearchProvider requests', () => {
  it('sends the API query, objective, mode, credential, and abort signal', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [{ url: 'https://a.test', excerpts: ['hi'] }] }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    const result = await new ParallelSearchProvider({ ...options, baseURL: 'https://api.parallel.test/v1/' })
      .search({ query: 'latest Parallel search API', maxResults: 5 }, controller.signal)

    expect(result.sources).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.parallel.test/v1/search')
    expect(init).toMatchObject({ method: 'POST', redirect: 'error', signal: controller.signal })
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('parallel-key')
    expect(JSON.parse(init.body as string)).toEqual({
      search_queries: ['latest Parallel search API'],
      objective: 'latest Parallel search API',
      mode: 'fast',
    })
  })

  it('resolves a managed key for each request', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const provider = new ParallelSearchProvider({ ...options, apiKey: '', resolveApiKey: async () => 'from-vault' })
    await provider.search({ query: 'query' })

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.headers).toMatchObject({ 'x-api-key': 'from-vault' })
  })

  it('fails clearly if the selected provider has no usable key', async () => {
    const provider = new ParallelSearchProvider({ ...options, apiKey: '', resolveApiKey: () => Promise.resolve(undefined) })
    await expect(provider.search({ query: 'query' })).rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE' }))
  })
})

describe('ParallelSearchProvider errors', () => {
  it('uses the Parallel error message from the response envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { message: 'bad key' } }, { status: 401 })))
    await expect(new ParallelSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR', message: 'bad key' }))
  })

  it('preserves an HTTP status when the error body has no message or JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: {} }, { status: 429 })))
    await expect(new ParallelSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ message: 'Parallel API error (HTTP 429)' }))
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unavailable', { status: 503 })))
    await expect(new ParallelSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ message: 'Parallel API error (HTTP 503)' }))
  })

  it('maps fetch and response-body aborts separately from provider failures', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('connection refused'))))
    await expect(new ParallelSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new DOMException('aborted', 'AbortError'))))
    await expect(new ParallelSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_ABORTED' }))
    const body = { json: () => Promise.reject(new DOMException('aborted', 'AbortError')), ok: true, status: 200 }
    vi.stubGlobal('fetch', vi.fn(async () => body as unknown as Response))
    await expect(new ParallelSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_ABORTED' }))
  })

  it('rejects malformed success bodies with WEB_PROVIDER_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
    await expect(new ParallelSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ results: {} })))
    await expect(new ParallelSearchProvider(options).search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))
  })
})

describe('web-search-parallel plugin registration', () => {
  it('registers into ctx.web and unregisters with its fiber', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ results: [] })))
    const ctx = new Context()
    provideCredentials(ctx)
    await ctx.plugin(WebRuntime, { searchProvider: PARALLEL_PROVIDER_ID })
    const fiber = await ctx.plugin(parallelPlugin, { apiKey: 'parallel-key' })
    await expect(ctx.web.search({ query: 'q' })).resolves.toMatchObject({ sources: [], truncated: false })
    await fiber.dispose()
    await expect(ctx.web.search({ query: 'q' }))
      .rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_CONFIGURED_MISSING' }))
  })

  it('has no default export', () => { expect('default' in parallelPlugin).toBe(false) })

  it('resolves a saved key through the credentials service', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = new Context()
    ctx.provide('credentials', {
      resolve: vi.fn(async () => ({ value: 'stored-key', source: 'file' as const })),
    } as never)
    await ctx.plugin(WebRuntime, { searchProvider: PARALLEL_PROVIDER_ID })
    await ctx.plugin(parallelPlugin, {})

    await ctx.web.search({ query: 'q' })

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.headers).toMatchObject({ 'x-api-key': 'stored-key' })
  })
})
