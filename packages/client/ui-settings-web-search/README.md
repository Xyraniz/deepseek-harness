---
description: "The Web app's Plugins page for selecting Exa or Parallel search and saving its API key in private credentials."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-web-search

English | [中文](README.zh.md)

## Summary

Open **Plugins** in the sidebar and select **Web search** in the Official group. Choose Exa or Parallel, paste that provider's API key, then save. The password field starts blank and reports only whether a key is configured; leaving it blank keeps the current key. The key is written through the private credentials domain rather than the settings document, so its literal never rides a response. The page exists while the Host serves the `web` namespace.

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

The **Web search** card in the Official group offers a provider dropdown and a password textbox for its key. Choose Exa or Parallel, paste the matching key, and press **Save**; a blank password draft keeps the current key. Keys from read-only sources, such as the process environment, show as configured but disable editing. The provider selection is stored in the `web` settings row, while the key goes only through `remote.credentials.set` and `remote.credentials.describe` returns only configured/writable metadata. Nothing is written until **Save**; leaving the page drops the drafts.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The Host half is an empty `apply`, present only so the package holds a Loader row the client module system serves the browser half for. The browser half binds the `web` namespace through `ctx.configForms.get` and stages `searchProvider` with the shared `SettingsFormModel` of `ui-primitives`. Its password textbox is a write-only secret control: the selected provider chooses `EXA_API_KEY` or `PARALLEL_API_KEY`, writes through `remote.credentials.set`, and reads back only metadata through `remote.credentials.describe`. The controller re-reads the credential when the scope changes and when the Host reports `credentials/reference-updated` for the watched reference. Exa and Parallel resolve that stored credential for each search request. The page registers `WebSearchCard` into the Plugins page's `plugins.item` slot through `ctx.configForms.whileServed`.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-plugin-manager](../ui-plugin-manager/README.md) — the Plugins page and the `plugins.item` slot the page registers into.
- [ui-settings](../ui-settings/README.md) — the settings scope and the served-namespace watch the page rides.
- [ui-primitives](../ui-primitives/README.md) — the settings form model and fields the page renders.
- [credentials](../../credentials/README.md) — the credential-reference seam the key writes through.
- [web](../../web/web/README.md) — the service that registers the settings namespace.
- [web-search-exa](../../web/web-search-exa/README.md) and [web-search-parallel](../../web/web-search-parallel/README.md) — the selectable search providers.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side settings surface that registers no model surface.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Three fields of the namespace** — the provider's model, API version, and token budget stay at their composed values; the page edits the key, the endpoint, and the search budget only.
- **Runtime invariant:** No companion is published. The page holds no owned relationship of its own: what it shows derives from the settings mirror and the credentials domain, and what it writes the Host validates.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
