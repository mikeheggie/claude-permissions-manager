import { describe, it, expect } from 'vitest'
import { toSettingsJson } from './exportJson'
import type { Permission, Plugin } from '@/types/permissions'

function makePermission(
  pattern: string,
  category: Permission['category'],
  overrides: Partial<Permission> = {}
): Permission {
  return {
    id: `${category}-${pattern}`,
    pattern,
    category,
    source: 'project',
    originalSource: 'project',
    ...overrides,
  }
}

function makePlugin(id: string, enabled: boolean): Plugin {
  return { id, enabled, source: 'project' }
}

describe('toSettingsJson', () => {
  it('produces valid JSON with all three category arrays', () => {
    const output = toSettingsJson(
      [makePermission('Bash(npm:*)', 'allow'), makePermission('Read(**/.env*)', 'deny')],
      []
    )
    const parsed = JSON.parse(output)

    expect(parsed.permissions.allow).toEqual(['Bash(npm:*)'])
    expect(parsed.permissions.deny).toEqual(['Read(**/.env*)'])
    expect(parsed.permissions.ask).toEqual([])
  })

  it('sorts patterns alphabetically within each category', () => {
    const output = toSettingsJson(
      [
        makePermission('Bash(zsh:*)', 'allow'),
        makePermission('Bash(awk:*)', 'allow'),
        makePermission('Bash(make:*)', 'allow'),
      ],
      []
    )
    const parsed = JSON.parse(output)

    expect(parsed.permissions.allow).toEqual([
      'Bash(awk:*)',
      'Bash(make:*)',
      'Bash(zsh:*)',
    ])
  })

  it('filters out excluded permissions', () => {
    const output = toSettingsJson(
      [
        makePermission('Bash(kept:*)', 'allow'),
        makePermission('Bash(removed:*)', 'allow', { excluded: true }),
      ],
      []
    )
    const parsed = JSON.parse(output)

    expect(parsed.permissions.allow).toEqual(['Bash(kept:*)'])
  })

  it('includes defaultMode only when provided', () => {
    const withMode = JSON.parse(toSettingsJson([], [], 'acceptEdits'))
    const withoutMode = JSON.parse(toSettingsJson([], []))

    expect(withMode.permissions.defaultMode).toBe('acceptEdits')
    expect('defaultMode' in withoutMode.permissions).toBe(false)
  })

  it('includes enabledPlugins sorted by id, and omits the key when empty', () => {
    const withPlugins = JSON.parse(
      toSettingsJson([], [makePlugin('z@official', false), makePlugin('a@official', true)])
    )
    const withoutPlugins = JSON.parse(toSettingsJson([], []))

    expect(Object.keys(withPlugins.enabledPlugins)).toEqual(['a@official', 'z@official'])
    expect(withPlugins.enabledPlugins['z@official']).toBe(false)
    expect('enabledPlugins' in withoutPlugins).toBe(false)
  })

  it('formats with two-space indentation for readable diffs', () => {
    const output = toSettingsJson([makePermission('Read', 'allow')], [])

    expect(output).toContain('\n  "permissions"')
  })
})
