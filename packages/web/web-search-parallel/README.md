---
description: "Parallel Search provider for ctx.web with credential-store support and normalized cited sources."
kind: "package-reference"
---

# @deepseek-ai/dsh-web-search-parallel

English | [中文](README.zh.md)

## Summary

`dsh-web-search-parallel` registers Parallel Search as the `parallel` backend for `ctx.web`. The base composition includes it as an alternative to default Exa. Results map the first non-blank excerpt to the shared source snippet and preserve the publication date. The Web app's Plugins page stores `PARALLEL_API_KEY` in the private credentials store; headless deployments can provide it through the launch environment.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount this provider after `@deepseek-ai/dsh-web`. Pin it with `searchProvider: parallel`; the credential is resolved for each search from the credentials service, or falls back to `PARALLEL_API_KEY` from the launch environment.

```yaml
- name: '@deepseek-ai/dsh-web'
  config:
    searchProvider: parallel
- name: '@deepseek-ai/dsh-web-search-parallel'
```

In the Web app, select **Plugins → Web search → Parallel**, paste the API key, and save. The key is written to private credentials rather than the settings file.

| Field | Default | Meaning |
|---|---|---|
| `apiKey` | `$PARALLEL_API_KEY` | API key; the private credentials store takes precedence when it has a writable stored value |
| `baseURL` | `https://api.parallel.ai/v1` | API base; `/search` is appended |
| `mode` | `fast` | Parallel retrieval mode: `turbo`, `fast`, `basic`, or `advanced` |

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

Each shared web search sends the query as a one-item `search_queries` array and as the objective, together with the configured mode. Requests send the API key in `x-api-key` and use `redirect: error`. The adapter drops rows without a non-blank excerpt, maps the first excerpt to `snippet`, and maps `publish_date` to `publishedAt`. Credential lookup happens at request time so a key saved from the browser page is used without putting its literal in configuration.

</details>

<a id="further-exploration"></a>
## Further Exploration

- [web](../README.md) — the shared provider-selection service.
- [web subsystem](../../../docs/subsystems/web.md) — the request/result and provider contracts.
- [tool-web](../tool-web/README.md) — the model-facing `web_search` tool.
- [web-search-exa](../web-search-exa/README.md) — the default alternative shipped by the base composition.

<a id="model-experience"></a>
## Model Experience

### Parallel search sources

#### What the model sees

The shared `web_search` result contains each retained source's URL, optional title, first non-blank excerpt as `snippet`, and optional `publishedAt`. Results without a non-blank excerpt are omitted.

#### Token effect

The provider adds no fixed text. Token use varies with Parallel's returned source metadata and snippets, subject to the shared service's result cap.

#### KV Cache effect

The sources reach the model as a tool reply after the search call. This appends content to the conversation history without replacing the earlier request prefix.

## Known Limitations and Deferred Work
<a id="known-limitations-and-deferred-work"></a>

Search availability and results depend on Parallel's account and service.

- A valid Parallel API key is required.
- Results without a non-blank excerpt are dropped because the shared source contract requires a portable snippet.
- Provider quotas, account access, and returned results are controlled by Parallel.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
