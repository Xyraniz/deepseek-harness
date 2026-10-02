/** Locale bundles for the web-search provider's settings page. */

import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Locale keys the page renders. */
export type WebSearchSettingsLocaleKey =
  | 'title' | 'description'
  | 'provider' | 'providerHint' | 'exa' | 'parallel' | 'invalidSelection'
  | 'exaApiKey' | 'parallelApiKey' | 'apiKeyHint' | 'apiKeySet' | 'apiKeyUnset'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed'

/** English copy. */
export const en: Record<WebSearchSettingsLocaleKey, string> = {
  title: 'Web search',
  description: 'Choose Exa or Parallel and save its API key.',
  provider: 'Search provider',
  providerHint: 'Choose which web search service the web_search tool uses.',
  exa: 'Exa',
  parallel: 'Parallel',
  invalidSelection: 'Choose one of the listed providers.',
  exaApiKey: 'Exa API key',
  parallelApiKey: 'Parallel API key',
  apiKeyHint: 'Saved in the private credentials store, not the settings file. Leave blank to keep the current key.',
  apiKeySet: 'A key is configured.',
  apiKeyUnset: 'No key is configured for this provider.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
}

/** Simplified Chinese copy. */
export const zh: Record<WebSearchSettingsLocaleKey, string> = {
  title: '网页搜索',
  description: '选择 Exa 或 Parallel 并保存对应的 API Key。',
  provider: '搜索提供方',
  providerHint: '选择 web_search 工具使用的网页搜索服务。',
  exa: 'Exa',
  parallel: 'Parallel',
  invalidSelection: '请选择列表中的提供方。',
  exaApiKey: 'Exa API Key',
  parallelApiKey: 'Parallel API Key',
  apiKeyHint: '密钥保存在私有凭据存储中，不写入设置文件。留空表示保留现有密钥。',
  apiKeySet: '已配置密钥。',
  apiKeyUnset: '此提供方尚未配置密钥。',
  overridden: '已覆盖',
  reset: '恢复默认',
  readOnly: '本部署的设置为只读。',
  unavailable: '该插件当前未加载，暂时无法配置。',
  save: '保存',
  saving: '保存中…',
  saveFailed: '本部署没有接受这些值，已保留供你修改。',
}

/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: WebSearchSettingsLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}
