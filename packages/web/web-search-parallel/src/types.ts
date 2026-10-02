/** Wire types for the Parallel Search API. Types only; no runtime code. */

/** Search request sent to `POST /v1/search`. */
export interface ParallelSearchRequest {
  search_queries: string[]
  objective: string
  mode: 'turbo' | 'fast' | 'basic' | 'advanced'
}

/** One result returned by Parallel Search. */
export interface ParallelResult {
  url: string
  title?: string | null
  publish_date?: string | null
  excerpts?: string[]
}

/** Successful Parallel Search response. */
export interface ParallelSearchResponse {
  results?: ParallelResult[]
}

/** Best-effort Parallel error response. */
export interface ParallelError {
  error?: string | { message?: string }
  message?: string
}
