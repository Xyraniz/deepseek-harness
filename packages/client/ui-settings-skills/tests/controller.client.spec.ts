import { describe, expect, it, vi } from 'vitest'
import { stubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import { SkillsSettingsController } from '../src/client/skills-settings-controller.ts'

interface Settings {
  claudeDesignEnabled?: boolean
}

describe('SkillsSettingsController', () => {
  it('reflects the Host value and writes the selected switch state', async () => {
    const host = stubConfigForm<Settings>()
    host.set.mockResolvedValue(true)
    const controller = new SkillsSettingsController(host.scope)
    host.publish({ status: 'ready', writable: true, value: { claudeDesignEnabled: false } })
    const face = controller.inject()

    expect(face.hooks.skillsSettings.getSnapshot()).toMatchObject({ status: 'ready', enabled: false, writable: true })
    face.setEnabled(true)

    await vi.waitFor(() => { expect(host.set).toHaveBeenCalledWith('claudeDesignEnabled', true) })
    expect(face.hooks.skillsSettings.getSnapshot()).toMatchObject({ enabled: false, saving: false, failed: false })
    controller.dispose()
    expect(host.listenerCount()).toBe(0)
  })

  it('does not write before the Host is ready or while its document is read-only', () => {
    const host = stubConfigForm<Settings>()
    const controller = new SkillsSettingsController(host.scope)
    const face = controller.inject()

    face.setEnabled(true)
    host.publish({ status: 'ready', writable: false, value: { claudeDesignEnabled: false } })
    face.setEnabled(true)

    expect(host.set).not.toHaveBeenCalled()
    expect(face.hooks.skillsSettings.getSnapshot()).toMatchObject({ status: 'ready', writable: false, enabled: false })
    controller.dispose()
  })

  it('reports refused and failed writes without changing the accepted Host value', async () => {
    const host = stubConfigForm<Settings>()
    const controller = new SkillsSettingsController(host.scope)
    host.publish({ status: 'ready', writable: true, value: { claudeDesignEnabled: false } })
    const face = controller.inject()

    host.set.mockResolvedValueOnce(false)
    face.setEnabled(true)
    await vi.waitFor(() => { expect(face.hooks.skillsSettings.getSnapshot().failed).toBe(true) })
    expect(face.hooks.skillsSettings.getSnapshot().enabled).toBe(false)

    host.set.mockRejectedValueOnce(new Error('offline'))
    face.setEnabled(true)
    await vi.waitFor(() => { expect(host.set).toHaveBeenCalledTimes(2) })
    await vi.waitFor(() => { expect(face.hooks.skillsSettings.getSnapshot()).toMatchObject({ failed: true, saving: false }) })
    controller.dispose()
  })
})
