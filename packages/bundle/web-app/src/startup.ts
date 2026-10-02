/**
 * The web app's command-line provider: it parses the `dsh --profile web` flag
 * family (`--host`, `--mobile`, `--public-url`, `--port`, `--trusted-host`, `--no-open`) and its `--help`
 * text, then provides the immutable values as {@link WEB_STARTUP_SERVICE}.
 * Ordinary rows inject that service before reading it from lazy config.
 * @module @deepseek-ai/dsh-web-app/startup
 */

import { Command } from 'commander'
import type { Context } from '@deepseek-ai/cordis'
import { parseCmdline } from '@deepseek-ai/dsh-cmdline'

/** Stable Cordis plugin name. */
export const name = 'web-startup'

/** Services required before the flags can be resolved. */
export const inject = ['cmdlineArgs']

/** Service provided by this ordinary plugin and injected by flag-configured rows. */
export const WEB_STARTUP_SERVICE = 'webStartup'

/** What the web rows read from {@link WEB_STARTUP_SERVICE}. */
export interface WebStartupValues {
  /** Whether this invocation opens the default browser after startup. */
  openBrowser: boolean
  /** `--host`, absent when the invocation did not name one. */
  host?: string
  /** `--port`, absent when the invocation did not name one. */
  port?: number
  /** Public HTTPS URL for a separately managed tunnel or reverse proxy. */
  publicUrl?: string
  /** Explicit `--trusted-host` authorities, in argument order. */
  trustedHosts: string[]
}

/** The web flag family, as commander parsed it. */
interface WebOptions {
  host?: string
  mobile: boolean
  publicUrl?: string
  open: boolean
  port?: string
  trustedHost?: string[]
}

/**
 * This app's command: its flags, its description, and its help text.
 * @returns a fresh program, so one process can parse more than once (tests).
 */
function webCommand(): Command {
  return new Command()
    .name('dsh --profile web')
    .description('Serve the DeepSeek Harness browser UI.')
    .helpOption('-h, --help', 'show this help')
    .option('--host <host>', 'bind host')
    .option('--mobile', 'allow LAN devices to connect; print a QR code (equivalent to --host 0.0.0.0)')
    .option('--public-url <url>', 'publish a tokenized link for an existing HTTPS tunnel origin; Quick Tunnels are unsupported')
    .option('--no-open', 'do not open the Web UI in the default browser')
    .option('--port <port>', 'listen port; pass 0 to let the OS pick a free one')
    .option('--trusted-host <authority...>', 'extra authority the /api browser-trust fence accepts (host or host:port; repeatable)')
    .addHelpText('after', `
Examples:
  dsh --profile web                          serve on the composed host and port
  dsh --profile web --no-open                serve without opening a browser
  dsh --profile web --port 8080              serve on another port
  dsh --profile web --mobile                  show a QR code for a phone on the same Wi-Fi
  dsh --profile web --public-url https://dsh.example.com

Quick Tunnels do not support live Server-Sent Events; use a named Cloudflare Tunnel.
The LAN and public links grant access to this session. Share them only with people you trust.
`)
}

/**
 * Parse and provide the Web invocation as an ordinary Cordis service. The
 * command's action publishes the flags this invocation named; `--mobile` opts
 * into all-interface binding, and a non-numeric `--port` is a usage error, so
 * on rejection (and on `--help`) nothing is provided.
 * @param ctx - plugin context carrying the command line.
 */
export function apply(ctx: Context): void {
  const program = webCommand()
  program.action(() => {
    const options = program.opts<WebOptions>()
    if (options.mobile && options.host !== undefined && options.host !== '0.0.0.0') {
      program.error('error: --mobile cannot be combined with --host unless --host is 0.0.0.0')
    }
    let publicUrl: string | undefined
    if (options.publicUrl !== undefined) {
      let parsed: URL
      try {
        parsed = new URL(options.publicUrl)
      } catch {
        program.error('error: --public-url must be an HTTPS origin, such as https://dsh.example.com')
        return
      }
      if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== ''
        || parsed.pathname !== '/' || parsed.search !== '' || parsed.hash !== '') {
        program.error('error: --public-url must be an HTTPS origin, such as https://dsh.example.com')
        return
      }
      if (parsed.hostname === 'trycloudflare.com' || parsed.hostname.endsWith('.trycloudflare.com')) {
        program.error('error: --public-url cannot use a Cloudflare Quick Tunnel because Quick Tunnels do not support DSH live streaming; configure a named tunnel instead')
        return
      }
      publicUrl = parsed.origin
    }
    if (options.port !== undefined && !/^\d+$/.test(options.port)) {
      program.error(`error: --port must be a number, got ${JSON.stringify(options.port)}`)
    }
    ctx.provide(WEB_STARTUP_SERVICE, {
      openBrowser: options.open,
      ...options.mobile && { host: '0.0.0.0' },
      ...!options.mobile && options.host !== undefined && { host: options.host },
      ...options.port !== undefined && { port: Number(options.port) },
      ...publicUrl !== undefined && { publicUrl },
      trustedHosts: options.trustedHost ?? [],
    } satisfies WebStartupValues)
  })
  parseCmdline(ctx, program)
}
