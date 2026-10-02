// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { GlobalStandardProps } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '../src/client/index.ts'
import { SkillsSettingsSection } from '../src/client/SkillsSettingsSection.tsx'
import type { SkillsSettingsState } from '../src/client/skills-settings-controller.ts'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const t = (key: string) => en[key as keyof typeof en] ?? key
const unusedStandardHook = (() => { throw new Error('unused by SkillsSettingsSection') }) as never
const standardProps = {
  usePanelInfo: unusedStandardHook,
  useSessions: unusedStandardHook,
  useSessionStatus: unusedStandardHook,
  useSessionRetainInfo: unusedStandardHook,
  useResource: unusedStandardHook,
  useWorkspaces: unusedStandardHook,
} as GlobalStandardProps

function renderSection(state: Partial<SkillsSettingsState> = {}) {
  const store = createSnapshotStore<SkillsSettingsState>({
    status: 'ready', enabled: true, writable: true, saving: false, failed: false, ...state,
  })
  const setEnabled = vi.fn()
  const props: Parameters<typeof SkillsSettingsSection>[0] = {
    ...standardProps,
    t,
    close: vi.fn(),
    setEnabled,
    useSkillsSettings: bindSnapshotSelector(store),
  }
  render(<SkillsSettingsSection {...props} />)
  return setEnabled
}

describe('SkillsSettingsSection', () => {
  it('shows the packaged skill and sends switch changes to its controller', () => {
    const setEnabled = renderSection()

    expect(screen.getByRole('heading', { name: en.claudeDesign })).toBeTruthy()
    expect(screen.getByText(en.enabled)).toBeTruthy()
    fireEvent.click(screen.getByRole('switch', { name: en.toggle }))

    expect(setEnabled).toHaveBeenCalledWith(false)
  })

  it('waits for the Host config form before showing the switch', () => {
    renderSection({ status: 'loading' })

    expect(screen.getByText(en.loading)).toBeTruthy()
    expect(screen.queryByRole('switch', { name: en.toggle })).toBeNull()
  })

  it('disables the switch while read-only or saving and reports a failed write', () => {
    renderSection({ writable: false, failed: true })

    expect(screen.getByRole('switch', { name: en.toggle })).toHaveProperty('disabled', true)
    expect(screen.getByRole('alert').textContent).toBe(en.writeFailed)
  })
})
