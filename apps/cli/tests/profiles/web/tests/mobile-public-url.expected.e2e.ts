/** Phone and named-tunnel access through the shipped Web profile. */

import { networkInterfaces } from 'node:os'
import { describe, expect, it } from 'vitest'
import { webRequest, withDefaultWeb } from './default-web-process.ts'

describe('Web profile remote access', () => {
  it('publishes a named HTTPS tunnel URL and trusts its Host in the real CLI composition', async (test) => {
    await withDefaultWeb(test, async (app) => {
      await expect.poll(() => app.stdout()).toContain('█')
      expect(app.stdout()).toContain('dsh public: https://named-smoke.example.com/?token=')
      expect(app.stdout()).toContain('dsh mobile: https://named-smoke.example.com/?token=')

      const apiUrl = new URL(app.url)
      apiUrl.pathname = '/api'
      apiUrl.search = ''
      const trusted = await webRequest(apiUrl, test.signal, {
        method: 'GET',
        headers: { Host: 'named-smoke.example.com', Origin: 'https://named-smoke.example.com' },
      })
      const untrusted = await webRequest(apiUrl, test.signal, {
        method: 'GET',
        headers: { Host: 'attacker.example', Origin: 'https://attacker.example' },
      })
      expect(trusted.status).toBe(401)
      expect(untrusted.status).toBe(403)
    }, { flags: ['--public-url', 'https://named-smoke.example.com'] })
  })

  it('binds the same-Wi-Fi phone mode and trusts the advertised LAN address', async (test) => {
    await withDefaultWeb(test, async (app) => {
      const address = Object.values(networkInterfaces()).flat()
        .find(iface => iface !== undefined && iface.family === 'IPv4' && !iface.internal)?.address
      if (address === undefined) {
        await expect.poll(() => app.stdout()).toContain('dsh mobile: no non-loopback IPv4 address was found')
        return
      }
      await expect.poll(() => app.stdout()).toContain('█')
      expect(app.stdout()).toContain(`dsh mobile: http://${address}:`)

      const apiUrl = new URL(app.url)
      apiUrl.pathname = '/api'
      apiUrl.search = ''
      const authority = `${address}:${apiUrl.port}`
      const trusted = await webRequest(apiUrl, test.signal, {
        method: 'GET',
        headers: { Host: authority, Origin: `http://${authority}` },
      })
      expect(trusted.status).toBe(401)
    }, { mobile: true })
  })
})
