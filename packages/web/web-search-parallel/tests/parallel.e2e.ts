import { describe, expect, it } from 'vitest'
import { ParallelSearchProvider, PARALLEL_DEFAULT_BASE_URL, PARALLEL_DEFAULT_MODE } from '@deepseek-ai/dsh-web-search-parallel'

/** Real-API smoke; self-skips unless the developer supplied a Parallel key. */
const apiKey = process.env.PARALLEL_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('ParallelSearchProvider real API', () => {
  it('returns cited sources for a live query', async () => {
    const provider = new ParallelSearchProvider({
      apiKey: apiKey!,
      baseURL: process.env.PARALLEL_BASE_URL ?? PARALLEL_DEFAULT_BASE_URL,
      mode: PARALLEL_DEFAULT_MODE,
    })
    const result = await provider.search({ query: 'DeepSeek Harness', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//)
  }, 30_000)
})
