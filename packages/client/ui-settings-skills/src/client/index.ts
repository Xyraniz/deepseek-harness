/** Browser Settings page for the packaged Claude Design skill. */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { SkillsSettingsSection } from './SkillsSettingsSection.tsx'
import { SkillsSettingsController } from './skills-settings-controller.ts'
import { en, zh, type SkillsSettingsLocaleKey } from './locales.ts'

export type { SkillsSettingsLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Settings-page copy for bundled skills. */
    'settings.skills': SkillsSettingsLocaleKey
  }
}

/** Localization namespace owned by this page. */
export const NS = 'settings.skills'

/** Services required by the Settings page. */
export const inject = ['slots', 'locale', 'configForms']

/** Register the Skills section while the Host serves its filesystem config. */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'ui-settings-skills: dictionaries')
  ctx.effect(() => ctx.configForms.whileServed(['skill-filesystem'], () => {
    const controller = new SkillsSettingsController(ctx.configForms.get('skill-filesystem'))
    const dispose = ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'skills',
      order: 60,
      label: () => t('nav'),
      locale: NS,
      inject: () => controller.inject(),
    }, SkillsSettingsSection))
    return () => {
      dispose()
      controller.dispose()
    }
  }), 'ui-settings-skills: section')
}
