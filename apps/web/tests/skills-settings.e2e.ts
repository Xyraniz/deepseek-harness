/** The Skills settings page writes the Host provider config and changes its live catalog. */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { expect, it, onTestFinished } from 'vitest'
import { launchWebScaffold } from './scaffold.ts'
import { newEnglishPage, openSettings } from './support.ts'

it('toggles the bundled Claude Design skill in the live Host catalog and persists the setting', async () => {
  const scaffold = await launchWebScaffold({ editableSkillsSettings: true })
  onTestFinished(() => scaffold.close())
  expect(scaffold.ctx.settings.describe().map(form => form.ns)).toContain('skill-filesystem')
  const browser = await chromium.launch()
  onTestFinished(() => browser.close())
  const page = await newEnglishPage(browser)
  await page.goto(scaffold.authenticatedUrl)
  await openSettings(page, 'en')

  const settings = page.getByRole('dialog', { name: 'Settings', exact: true })
  const sectionButtons = await settings.getByRole('button').allTextContents()
  expect(sectionButtons, `Settings navigation: ${sectionButtons.join(' | ')}`).toContain('Skills')
  await settings.getByRole('button', { name: 'Skills', exact: true }).click()
  const toggle = settings.getByRole('switch', { name: 'Enable Claude Design skill' })
  await toggle.waitFor({ state: 'visible' })
  expect(await toggle.isEnabled()).toBe(true)
  expect(await toggle.getAttribute('aria-checked')).toBe('false')

  const mutation = page.waitForResponse(response => new URL(response.url()).pathname === '/api/settings/mutate')
  await toggle.click()
  const reply = await mutation
  const responseText = await reply.text()
  const payload = JSON.parse(responseText) as { result?: { ok?: boolean; error?: { message?: string } } }
  expect(payload.result?.ok, payload.result?.error?.message).toBe(true)
  await expect.poll(() => toggle.getAttribute('aria-checked')).toBe('true')
  await expect.poll(async () => (await scaffold.ctx.skills.list()).some(skill => skill.name === 'claude-design'))
    .toBe(true)
  expect(await scaffold.ctx.skills.get('claude-design')).toMatchObject({ name: 'claude-design', source: 'bundled' })

  await toggle.click()
  await expect.poll(() => toggle.getAttribute('aria-checked')).toBe('false')
  await expect.poll(async () => (await scaffold.ctx.skills.list()).some(skill => skill.name === 'claude-design'))
    .toBe(false)
  await toggle.click()
  await expect.poll(() => toggle.getAttribute('aria-checked')).toBe('true')
  await expect.poll(async () => (await scaffold.ctx.skills.list()).some(skill => skill.name === 'claude-design'))
    .toBe(true)
  const saved = await readFile(join(scaffold.harnessHome, 'profiles', 'scaffold', 'cordis.patch.yml'), 'utf8')
  expect(saved).toMatch(/claudeDesignEnabled:\s*true/)

  await page.reload()
  await openSettings(page, 'en')
  await page.getByRole('dialog', { name: 'Settings', exact: true })
    .getByRole('button', { name: 'Skills', exact: true }).click()
  await expect.poll(() => toggle.getAttribute('aria-checked')).toBe('true')
})
