/** The search-provider choice and its write-only API key. */

import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { SettingsChoiceField, SettingsForm, SettingsSecretField } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { formLabels } from './locales.ts'
import type { WebSearchCardFace } from './web-search-card-controller.ts'

/** Props the renderer binds for the web-search page. */
export type WebSearchCardProps =
  PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.webSearch'>
  & InjectFace<WebSearchCardFace>

/**
 * Render the web-search provider's one-liner or its settings form, as the Plugins page asks.
 * @param props - the view asked for, locale copy, the form snapshot, and its actions.
 * @returns the one-liner, or the form.
 */
export function WebSearchCard(props: WebSearchCardProps) {
  const { t } = props
  const state = props.useWebSearchCard(snapshot => snapshot)
  if (props.view === 'summary') return t('description')
  const disabled = !state.writable
  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      <SettingsChoiceField
        id="plugin-config-web-search-provider"
        label={t('provider')}
        hint={t('providerHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidSelection')}
        disabled={disabled}
        {...state.searchProvider}
        text={state.searchProvider.text || 'exa'}
        choices={[
          { value: 'exa', label: t('exa') },
          { value: 'parallel', label: t('parallel') },
        ]}
        onEdit={(text) => { props.edit('searchProvider', text) }}
        onReset={() => { props.resetField('searchProvider') }}
      />
      <SettingsSecretField
        id="plugin-config-web-search-key"
        label={state.provider === 'exa' ? t('exaApiKey') : t('parallelApiKey')}
        hint={t('apiKeyHint')}
        disabled={!state.apiKeyWritable}
        text={state.apiKey.text}
        configured={state.apiKeyConfigured}
        stateLabel={state.apiKeyConfigured ? t('apiKeySet') : t('apiKeyUnset')}
        onEdit={(text) => { props.edit('apiKey', text) }}
      />
    </SettingsForm>
  )
}
