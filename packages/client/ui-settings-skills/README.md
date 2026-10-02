---
description: "The dsh web client's standalone Skills settings page for toggling the bundled Claude Design skill."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-skills

English | [中文](README.zh.md)

## Summary

Open **Skills** in Settings to enable or disable the bundled **Claude Design** skill. The base profile enables it by default. The switch writes the `claudeDesignEnabled` volatile field on `skill-filesystem`, so changes persist in the active profile and update the Host's skill catalog. Disabling the bundled copy leaves project and user skills with the same name available. The bundled source is NousResearch's Hermes Agent `claude-design` skill; its metadata credits BadTechBandit and declares MIT.

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

The standalone **Skills** section shows the packaged Claude Design skill and its upstream attribution. Turn the switch on to include the packaged copy in the Host skill catalog, or off to remove only that copy. The setting is saved immediately to the active profile's `skill-filesystem` entry. The page appears while the Host serves that configuration namespace.

The source is [NousResearch/hermes-agent, `skills/creative/claude-design/SKILL.md`](https://github.com/NousResearch/hermes-agent/tree/main/skills/creative/claude-design). Upstream metadata credits BadTechBandit and declares the MIT license; the bundled files retain that metadata and attribution.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The browser package registers a standalone `settings.section` row while `ctx.configForms` serves `skill-filesystem`. Its controller writes the volatile `claudeDesignEnabled` field. The filesystem provider includes its packaged skill root when enabled and filters only its own packaged `claude-design` candidate when disabled; project, custom, and user roots remain independent. A settings document update invalidates the Host skill catalog.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-settings](../ui-settings/README.md) — the Settings slots and live Config form service.
- [ui-settings-general](../ui-settings-general/README.md) — the Settings shell and navigation sections.
- [ui-primitives](../ui-primitives/README.md) — the switch control used by this page.
- [skill-filesystem](../../skill/skill-filesystem/README.md) — the Host provider and bundled skill root.
- [NousResearch Hermes Agent skill source](https://github.com/NousResearch/hermes-agent/tree/main/skills/creative/claude-design) — the upstream `claude-design` skill.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side settings surface that registers no model surface.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **One bundled skill** — the page currently exposes only Claude Design.
- **Web Settings only** — this page is included by the web-app bundle and does not add a terminal settings interface.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
