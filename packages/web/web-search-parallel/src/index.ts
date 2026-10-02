/** Parallel-backed `WebSearchProvider` plugin for the `ctx.web` registry. */

import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-credentials'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-web'
import {
  ParallelSearchProvider,
  PARALLEL_DEFAULT_BASE_URL,
  PARALLEL_DEFAULT_MODE,
} from './provider.ts'

export {
  ParallelSearchProvider,
  PARALLEL_DEFAULT_BASE_URL,
  PARALLEL_DEFAULT_MODE,
  PARALLEL_PROVIDER_ID,
} from './provider.ts'
export type { ParallelSearchProviderOptions } from './provider.ts'

/** Cordis plugin name used by Loader diagnostics. */
export const name = 'web-search-parallel'

/** The web and credential services this provider uses. */
export const inject = ['web', 'credentials']

/** Optional provider configuration; `apply` supplies env and constant defaults. */
export interface Config {
  /** Parallel API key, otherwise resolved from the credentials service or `$PARALLEL_API_KEY`. */
  apiKey?: string
  /** API base; `/search` is appended. */
  baseURL?: string
  /** Retrieval mode. Defaults to Parallel's fast interactive mode. */
  mode?: 'turbo' | 'fast' | 'basic' | 'advanced'
}

export const Config: z<Config> = z.object({
  apiKey: z.string(),
  baseURL: z.string(),
  mode: z.union(['turbo', 'fast', 'basic', 'advanced'] as const),
})

/** Register the Parallel provider and resolve managed keys at each search. */
export function apply(ctx: Context, config: Config): void {
  const credentials = ctx.get('credentials')
  const apiKey = config.apiKey ?? launchEnvironmentOf(ctx).get('PARALLEL_API_KEY')?.value ?? ''
  ctx.web.registerSearchProvider(new ParallelSearchProvider({
    apiKey,
    resolveApiKey: async () => (await credentials?.resolve(credentialRef('PARALLEL_API_KEY')))?.value,
    baseURL: config.baseURL ?? PARALLEL_DEFAULT_BASE_URL,
    mode: config.mode ?? PARALLEL_DEFAULT_MODE,
  }))
}
