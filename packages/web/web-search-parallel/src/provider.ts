/**
 * `ParallelSearchProvider`: a `WebSearchProvider` backed by Parallel Search.
 * It maps the first non-blank excerpt to `snippet` and `publish_date` to
 * `publishedAt`; the shared web service applies the final source-count limit.
 * @module @deepseek-ai/dsh-web-search-parallel/provider
 */

import { WebError } from '@deepseek-ai/dsh-web'
import type {
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@deepseek-ai/dsh-web'
import type { ParallelError, ParallelResult, ParallelSearchResponse } from './types.ts'

/** Stable id this provider registers under. */
export const PARALLEL_PROVIDER_ID = 'parallel'

/** Default Parallel API base; `/search` is appended. */
export const PARALLEL_DEFAULT_BASE_URL = 'https://api.parallel.ai/v1'

/** Default search mode for interactive web searches. */
export const PARALLEL_DEFAULT_MODE = 'fast'

/** Attribution header sent on every request. Bump with the package version. */
const USER_AGENT = 'deepseek-harness/0.0.1'

/** Provider options resolved by the Cordis plugin. */
export interface ParallelSearchProviderOptions {
  /** Parallel API key; empty when no launch-environment value exists. */
  apiKey: string
  /** Resolve the current managed credential at search time when available. */
  resolveApiKey?: () => Promise<string | undefined>
  /** API base; `/search` is appended. */
  baseURL: string
  /** Parallel Search retrieval mode. */
  mode: 'turbo' | 'fast' | 'basic' | 'advanced'
}

/** Map one Parallel result, dropping entries without a non-blank excerpt. */
export function mapParallelResult(result: ParallelResult): WebSearchSource | undefined {
  const snippet = result.excerpts?.find(excerpt => excerpt.trim().length > 0)
  if (snippet === undefined) return undefined
  return {
    url: result.url,
    ...result.title != null && result.title.length > 0 ? { title: result.title } : {},
    snippet,
    ...result.publish_date != null && result.publish_date.length > 0 ? { publishedAt: result.publish_date } : {},
  }
}

/** Map a Parallel response to DSH's normalized search result. */
export function mapParallelResponse(response: ParallelSearchResponse): WebSearchResult {
  const sources = (response.results ?? [])
    .map(mapParallelResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  return { sources, truncated: false }
}

/** Search through Parallel's web index. Redirects fail as `WEB_PROVIDER_ERROR`. */
export class ParallelSearchProvider implements WebSearchProvider {
  readonly id = PARALLEL_PROVIDER_ID

  constructor(private readonly options: ParallelSearchProviderOptions) {}

  available(): boolean {
    return (this.options.apiKey.length > 0 || this.options.resolveApiKey !== undefined)
      && URL.canParse(this.options.baseURL)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    let apiKey = this.options.apiKey
    try {
      apiKey = await this.options.resolveApiKey?.() ?? apiKey
    } catch (error: unknown) {
      throw new WebError(`Parallel credential lookup failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
    if (apiKey.length === 0) {
      throw new WebError('Parallel API key is not configured; save PARALLEL_API_KEY in Plugins settings or the launch environment', 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE')
    }

    let response: Response
    try {
      response = await fetch(`${this.options.baseURL.replace(/\/+$/u, '')}/search`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({ search_queries: [request.query], objective: request.query, mode: this.options.mode }),
        ...signal !== undefined ? { signal } : {},
      })
    } catch (error: unknown) {
      if (isAbortError(error)) throw new WebError('Parallel search aborted', 'WEB_ABORTED', { cause: error })
      throw new WebError(`Parallel search request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }

    if (!response.ok) {
      const status = response.status
      let message = `Parallel API error (HTTP ${status})`
      try {
        const parsed = await response.json() as ParallelError
        const detail = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message ?? parsed.message
        if (detail !== undefined && detail.length > 0) message = detail
      } catch (error: unknown) {
        if (isAbortError(error)) throw new WebError('Parallel search aborted', 'WEB_ABORTED', { cause: error })
        // The HTTP status is already captured; an unreadable error envelope
        // can only cost us a more specific provider message.
      }
      throw new WebError(message, 'WEB_PROVIDER_ERROR')
    }

    try {
      return mapParallelResponse(await response.json() as ParallelSearchResponse)
    } catch (error: unknown) {
      if (isAbortError(error)) throw new WebError('Parallel search aborted', 'WEB_ABORTED', { cause: error })
      throw new WebError(`Parallel returned an unprocessable response body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
  }
}

/** True for an aborted fetch or response-body read. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
