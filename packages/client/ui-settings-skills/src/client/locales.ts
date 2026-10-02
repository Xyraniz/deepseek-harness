/** English and Simplified Chinese copy for the Skills Settings section. */

/** The page's localized strings. */
export type SkillsSettingsLocaleKey =
  | 'nav' | 'title' | 'description' | 'loading'
  | 'claudeDesign' | 'claudeDesignDescription' | 'source' | 'enabled' | 'disabled' | 'toggle'
  | 'writeFailed'

/** English copy. */
export const en: Record<SkillsSettingsLocaleKey, string> = {
  nav: 'Skills',
  title: 'Skills',
  description: 'Choose which bundled skills are available to the agent.',
  loading: 'Loading skill settings…',
  claudeDesign: 'Claude Design',
  claudeDesignDescription: 'Design one-off HTML artifacts such as landing pages, decks, and prototypes.',
  source: 'NousResearch · Hermes Agent · MIT',
  enabled: 'Enabled',
  disabled: 'Disabled',
  toggle: 'Enable Claude Design skill',
  writeFailed: 'The setting could not be saved. Try again.',
}

/** Simplified Chinese copy. */
export const zh: Record<SkillsSettingsLocaleKey, string> = {
  nav: 'Skills',
  title: 'Skills',
  description: '选择 Agent 可以使用的随包提供的 skills。',
  loading: '正在加载 skill 设置…',
  claudeDesign: 'Claude Design',
  claudeDesignDescription: '设计独立的 HTML 成品，例如落地页、演示文稿和原型。',
  source: 'NousResearch · Hermes Agent · MIT',
  enabled: '已启用',
  disabled: '已停用',
  toggle: '启用 Claude Design skill',
  writeFailed: '无法保存此设置，请重试。',
}
