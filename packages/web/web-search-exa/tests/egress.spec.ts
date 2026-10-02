import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { installProxyFromEnvironment } from '@deepseek-ai/dsh-http-proxy'
import { ExaSearchProvider } from '../src/provider.ts'
import { ParallelSearchProvider } from '../../web-search-parallel/src/provider.ts'

let seen: string[] = []
let proxy: Server
let proxyUrl: string
let redirectServer: Server
let redirectUrl: string
let redirectTargets = 0

beforeAll(async () => {
  proxy = createServer((request, response) => {
    seen.push(`REQ ${request.url ?? ''}`)
    response.writeHead(502); response.end('fake-proxy')
  })
  proxy.on('connect', (request, socket) => {
    seen.push(`CONNECT ${request.url ?? ''}`)
    socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n'); socket.end()
  })
  const a = await new Promise<AddressInfo>((r) => { proxy.listen(0, '127.0.0.1', () => { r(proxy.address() as AddressInfo) }) })
  proxyUrl = `http://127.0.0.1:${String(a.port)}`
  redirectServer = createServer((request, response) => {
    if (request.url === '/target') { redirectTargets++; response.end('unexpected target contact'); return }
    response.writeHead(302, { location: '/target' }); response.end()
  })
  const redirectAddress = await new Promise<AddressInfo>((r) => {
    redirectServer.listen(0, '127.0.0.1', () => { r(redirectServer.address() as AddressInfo) })
  })
  redirectUrl = `http://127.0.0.1:${String(redirectAddress.port)}`
})
afterAll(async () => {
  await Promise.all([
    new Promise<void>((r) => { proxy.close(() => { r() }) }),
    new Promise<void>((r) => { redirectServer.close(() => { r() }) }),
  ])
})

/** The launch environment of a user who exported one proxy for both schemes. */
function proxyEnv(): { get(name: string): { value: string } | undefined } {
  return { get: name => (name === 'HTTP_PROXY' || name === 'HTTPS_PROXY' ? { value: proxyUrl } : undefined) }
}
async function observe(run: () => Promise<unknown>): Promise<string[]> {
  seen = []
  const dispose = await installProxyFromEnvironment(proxyEnv(), () => undefined)
  try { await run().catch(() => undefined) } finally { await dispose() }
  return seen
}
describe('exa egress', () => {
  it('goes through the proxy', async () => {
    const p = new ExaSearchProvider({ apiKey: 'probe', baseURL: 'http://exa-probe.invalid', searchType: 'auto', highlightsPerResult: 1 })
    expect(await observe(() => p.search({ query: 'probe' }))).toEqual(['REQ http://exa-probe.invalid/search'])
  })

  it('rejects redirects before contacting the target', async () => {
    redirectTargets = 0
    const provider = new ExaSearchProvider({ apiKey: 'probe', baseURL: redirectUrl, searchType: 'auto', highlightsPerResult: 1 })

    await expect(provider.search({ query: 'probe' })).rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))

    expect(redirectTargets).toBe(0)
  })

  it('applies the same proxy policy to Parallel requests', async () => {
    const provider = new ParallelSearchProvider({ apiKey: 'probe', baseURL: 'http://parallel-probe.invalid/v1', mode: 'fast' })
    expect(await observe(() => provider.search({ query: 'probe' }))).toEqual(['REQ http://parallel-probe.invalid/v1/search'])
  })

  it('rejects Parallel redirects before contacting the target', async () => {
    redirectTargets = 0
    const provider = new ParallelSearchProvider({ apiKey: 'probe', baseURL: redirectUrl, mode: 'fast' })

    await expect(provider.search({ query: 'probe' })).rejects.toThrow(expect.objectContaining({ code: 'WEB_PROVIDER_ERROR' }))

    expect(redirectTargets).toBe(0)
  })
})
