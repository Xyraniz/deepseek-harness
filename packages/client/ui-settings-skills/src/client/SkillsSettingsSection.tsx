/** The Settings page for toggling the bundled Claude Design skill. */

import { Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SkillsSettingsFace } from './skills-settings-controller.ts'
import css from './SkillsSettingsSection.module.css'

/** Props derived from the Settings slot, locale, and registration inject face. */
type SkillsSettingsSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings.skills'>
  & InjectFace<SkillsSettingsFace>

/** Render the bundled-skill toggle and its persisted state. */
export function SkillsSettingsSection({ t, useSkillsSettings, setEnabled }: SkillsSettingsSectionProps) {
  const state = useSkillsSettings(snapshot => snapshot)
  return <div className={css.section}>
    <header>
      <h2 className={css.heading}>{t('title')}</h2>
      <p className={css.description}>{t('description')}</p>
    </header>
    {state.status === 'loading'
      ? <p className={css.state}>{t('loading')}</p>
      : (
        <article className={css.skill}>
          <div className={css.skillDetails}>
            <h3 className={css.skillName}>{t('claudeDesign')}</h3>
            <p className={css.description}>{t('claudeDesignDescription')}</p>
            <span className={css.source}>{t('source')}</span>
            <p className={css.state}>{state.enabled ? t('enabled') : t('disabled')}</p>
            {state.failed ? <p className={css.error} role="alert">{t('writeFailed')}</p> : null}
          </div>
          <Switch
            checked={state.enabled}
            disabled={state.status !== 'ready' || !state.writable || state.saving}
            label={t('toggle')}
            onChange={setEnabled}
            className={css.switch}
          />
        </article>
      )}
  </div>
}
