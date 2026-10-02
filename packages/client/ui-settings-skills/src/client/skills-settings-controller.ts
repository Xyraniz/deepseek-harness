/** State and writes for the bundled skill's Settings toggle. */

import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'

/** Volatile fields read from the filesystem skill provider's Config. */
interface FilesystemSkillSettings {
  claudeDesignEnabled?: boolean
}

/** Facts the Skills page renders. */
export interface SkillsSettingsState {
  status: 'loading' | 'ready' | 'unavailable'
  enabled: boolean
  writable: boolean
  saving: boolean
  failed: boolean
}

/** The controller and store the Slots renderer injects into the page. */
export interface SkillsSettingsFace {
  hooks: { skillsSettings: SnapshotStore<SkillsSettingsState> }
  setEnabled: (enabled: boolean) => void
}

/** Owns one reactive view over the Host's skill-filesystem configuration form. */
export class SkillsSettingsController {
  private readonly store: SnapshotStore<SkillsSettingsState>
  private readonly unsubscribe: () => void
  private saving = false
  private failed = false

  /** @param scope - the Host `skill-filesystem` Config form. */
  constructor(private readonly scope: ConfigForm<FilesystemSkillSettings>) {
    this.store = createSnapshotStore(this.project())
    this.unsubscribe = scope.subscribe(() => { this.publish() })
  }

  /**
   * Build the plain-data component face.
   * @returns the store and enabled-setting action consumed by the component.
   */
  inject(): SkillsSettingsFace {
    return {
      hooks: { skillsSettings: this.store },
      setEnabled: (enabled) => { void this.write(enabled) },
    }
  }

  /** Release the form subscription. */
  dispose(): void {
    this.unsubscribe()
  }

  private project(): SkillsSettingsState {
    const snapshot = this.scope.getSnapshot()
    return {
      status: snapshot.status,
      enabled: snapshot.value?.claudeDesignEnabled === true,
      writable: snapshot.writable,
      saving: this.saving,
      failed: this.failed,
    }
  }

  private publish(): void {
    this.store.set(this.project())
  }

  private async write(enabled: boolean): Promise<void> {
    const snapshot = this.scope.getSnapshot()
    if (snapshot.status !== 'ready' || !snapshot.writable || this.saving) return
    this.saving = true
    this.failed = false
    this.publish()
    try {
      this.failed = !await this.scope.set('claudeDesignEnabled', enabled)
    } catch {
      this.failed = true
    } finally {
      this.saving = false
      this.publish()
    }
  }
}
