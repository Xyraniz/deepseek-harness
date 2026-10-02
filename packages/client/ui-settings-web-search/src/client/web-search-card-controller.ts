/** Staged provider selection and write-only API-key form for the `web` settings namespace. */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  SettingsFormModel, settingsTextField,
  type SettingsFieldState, type SettingsFormActions, type SettingsFormShell, type SettingsFormScope,
} from '@deepseek-ai/dsh-client-ui-primitives'

/** Namespace of the web provider-selection service. */
export const WEB_SEARCH_NS = 'web'

/** Available search providers in the base composition. */
export type WebSearchProviderId = 'exa' | 'parallel'

/** Credentials references the page writes for each provider. */
const API_KEY_REFS: Record<WebSearchProviderId, string> = {
  exa: 'EXA_API_KEY',
  parallel: 'PARALLEL_API_KEY',
}

/** Form field the secret control stages under. */
const API_KEY_FIELD = 'apiKey'

/** Search fields this page edits in the `web` row. */
export interface WebSearchSettings {
  /** Selected `ctx.web` search provider. */
  searchProvider?: string
}

/** Last credential facts reported by the Host. */
interface CredentialState {
  ref: string
  configured: boolean
  writable: boolean
}

/** State rendered by the web-search settings page. */
export interface WebSearchCardState extends SettingsFormShell {
  /** Selected provider field. */
  searchProvider: SettingsFieldState
  /** Provider whose credential the password input edits. */
  provider: WebSearchProviderId
  /** Write-only key draft; it starts blank. */
  apiKey: SettingsFieldState
  /** Whether the Host already has this provider's key. */
  apiKeyConfigured: boolean
  /** Whether the credentials service accepts a write for this key. */
  apiKeyWritable: boolean
}

/** The card state and staged-form actions injected into the Plugins page. */
export interface WebSearchCardFace extends SettingsFormActions {
  hooks: { webSearchCard: SnapshotStore<WebSearchCardState> }
}

/** Owns the staged provider choice and updates its credential separately. */
export class WebSearchCardController {
  private readonly form: SettingsFormModel<WebSearchSettings>
  private readonly store: SnapshotStore<WebSearchCardState>
  private readonly unsubscribe: () => void
  private credential: CredentialState = { ref: '', configured: false, writable: true }

  /**
   * @param scope - the shared settings scope for the Host's `web` entry.
   * @param ctx - the browser context with credential operations and invalidations.
   */
  constructor(
    private readonly scope: SettingsFormScope<WebSearchSettings>,
    private readonly ctx: ClientContext,
  ) {
    this.form = new SettingsFormModel(
      scope,
      [settingsTextField('searchProvider')],
      [{ field: API_KEY_FIELD, write: text => this.writeKey(text) }],
    )
    this.store = this.form.bind(() => this.projection())
    this.unsubscribe = scope.subscribe(() => { void this.readCredential() })
    void this.readCredential()
  }

  private projection(): WebSearchCardState {
    return {
      ...this.form.shell(),
      searchProvider: this.form.field('searchProvider'),
      provider: this.provider(),
      apiKey: this.form.field(API_KEY_FIELD),
      apiKeyConfigured: this.credential.configured,
      apiKeyWritable: this.credential.writable,
    }
  }

  /** Re-read the key state for the currently staged provider. */
  private async readCredential(): Promise<void> {
    const ref = API_KEY_REFS[this.provider()]
    if (ref !== this.credential.ref) {
      this.credential = { ref, configured: false, writable: true }
      this.store.set(this.projection())
    }
    const response = await this.ctx.remote.credentials.describe([ref])
    if (!response.ok || ref !== API_KEY_REFS[this.provider()]) return
    const view = response.value[ref]
    const next: CredentialState = {
      ref,
      configured: view?.configured ?? false,
      writable: view?.writable ?? true,
    }
    if (next.configured === this.credential.configured && next.writable === this.credential.writable) return
    this.credential = next
    this.store.set(this.projection())
  }

  /** Re-read after the Host reports a change to the selected API key. */
  refreshCredential(ref: string): void {
    if (ref === API_KEY_REFS[this.provider()]) void this.readCredential()
  }

  /**
   * Build the slot face and re-check credentials as soon as the user chooses a provider.
   * @returns the current snapshot and form actions.
   */
  inject(): WebSearchCardFace {
    const actions = this.form.actions()
    return {
      hooks: { webSearchCard: this.store },
      ...actions,
      edit: (field, text) => {
        actions.edit(field, text)
        if (field === 'searchProvider') void this.readCredential()
      },
    }
  }

  /** Store the key under the selected provider's reference without reading its value back. */
  private async writeKey(value: string): Promise<boolean> {
    const ref = API_KEY_REFS[this.provider()]
    await this.ctx.remote.credentials.set(ref, value)
    await this.readCredential()
    return this.credential.configured
  }

  /** Release configuration subscriptions. */
  dispose(): void { this.unsubscribe(); this.form.dispose() }

  private provider(): WebSearchProviderId {
    const draft = this.form.field('searchProvider').text.trim()
    const selected = draft || this.scope.getSnapshot().value?.searchProvider
    return selected === 'parallel' ? 'parallel' : 'exa'
  }
}
