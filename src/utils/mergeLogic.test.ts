import { describe, it, expect } from 'vitest'
import { mergeSourceFiles, sourceFileToPermissions, sourceFileToPlugins } from './mergeLogic'
import { makeSourceFile } from '@/test/factories'

describe('mergeSourceFiles', () => {
  it('returns an empty result for no input files', () => {
    const result = mergeSourceFiles([])

    expect(result.permissions).toEqual([])
    expect(result.plugins).toEqual([])
    expect(result.conflicts).toEqual([])
  })

  it('keeps all permissions from a single file', () => {
    const file = makeSourceFile({
      permissions: { allow: ['Bash(npm run:*)'], deny: ['Read(**/.env*)'], ask: ['Bash(git push:*)'] },
    })

    const result = mergeSourceFiles([file])

    expect(result.permissions).toHaveLength(3)
    expect(result.conflicts).toEqual([])
    const categories = result.permissions.map((p) => p.category).sort()
    expect(categories).toEqual(['allow', 'ask', 'deny'])
  })

  it('unions permissions from files with no overlap', () => {
    const a = makeSourceFile({ permissions: { allow: ['Bash(npm:*)'] } }, { order: 0 })
    const b = makeSourceFile({ permissions: { allow: ['Bash(git:*)'] } }, { order: 1 })

    const result = mergeSourceFiles([a, b])

    expect(result.permissions.map((p) => p.pattern).sort()).toEqual([
      'Bash(git:*)',
      'Bash(npm:*)',
    ])
    expect(result.conflicts).toEqual([])
  })

  it('deduplicates identical patterns in the same category, keeping the later file as source', () => {
    const a = makeSourceFile({ permissions: { allow: ['Bash(npm:*)'] } }, { name: 'a.json', order: 0 })
    const b = makeSourceFile({ permissions: { allow: ['Bash(npm:*)'] } }, { name: 'b.json', order: 1 })

    const result = mergeSourceFiles([a, b])

    expect(result.permissions).toHaveLength(1)
    expect(result.permissions[0]?.sourceFileId).toBe(b.id)
    expect(result.conflicts).toEqual([])
  })

  it('detects a conflict when the same pattern appears in different categories', () => {
    const a = makeSourceFile({ permissions: { allow: ['Bash(rm:*)'] } }, { name: 'a.json', order: 0 })
    const b = makeSourceFile({ permissions: { deny: ['Bash(rm:*)'] } }, { name: 'b.json', order: 1 })

    const result = mergeSourceFiles([a, b])

    expect(result.conflicts).toHaveLength(1)
    const conflict = result.conflicts[0]
    expect(conflict?.pattern).toBe('Bash(rm:*)')
    expect(conflict?.resolved).toBe(false)
    expect(conflict?.sources.map((s) => s.sourceFileId).sort()).toEqual(
      [a.id, b.id].sort()
    )

    // The later (higher-priority) file wins by default
    expect(result.permissions).toHaveLength(1)
    expect(result.permissions[0]?.category).toBe('deny')
    expect(result.permissions[0]?.conflictsWith).toBeDefined()
    expect(result.permissions[0]?.conflictsWith).not.toHaveLength(0)
  })

  it('skips invalid files entirely', () => {
    const valid = makeSourceFile({ permissions: { allow: ['Bash(ls:*)'] } }, { order: 0 })
    const invalid = makeSourceFile(null, { invalid: true, order: 1 })

    const result = mergeSourceFiles([valid, invalid])

    expect(result.permissions).toHaveLength(1)
    expect(result.permissions[0]?.pattern).toBe('Bash(ls:*)')
  })

  it('merges plugins with the later file overriding enabled state', () => {
    const a = makeSourceFile(
      { permissions: {}, enabledPlugins: { 'p1@official': true } },
      { order: 0 }
    )
    const b = makeSourceFile(
      { permissions: {}, enabledPlugins: { 'p1@official': false, 'p2@official': true } },
      { order: 1 }
    )

    const result = mergeSourceFiles([a, b])

    expect(result.plugins).toHaveLength(2)
    const p1 = result.plugins.find((p) => p.id === 'p1@official')
    expect(p1?.enabled).toBe(false)
  })

  it('handles a three-way conflict across files', () => {
    const a = makeSourceFile({ permissions: { allow: ['WebFetch'] } }, { name: 'a.json', order: 0 })
    const b = makeSourceFile({ permissions: { deny: ['WebFetch'] } }, { name: 'b.json', order: 1 })
    const c = makeSourceFile({ permissions: { ask: ['WebFetch'] } }, { name: 'c.json', order: 2 })

    const result = mergeSourceFiles([a, b, c])

    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0]?.sources.length).toBeGreaterThanOrEqual(2)
    // Last file wins
    expect(result.permissions[0]?.category).toBe('ask')
  })
})

describe('sourceFileToPermissions', () => {
  it('returns an empty array when the file has no parsed config', () => {
    const file = makeSourceFile(null, { invalid: true })

    expect(sourceFileToPermissions(file)).toEqual([])
  })

  it('tags every permission with the source file id and name', () => {
    const file = makeSourceFile(
      { permissions: { allow: ['Read'], deny: ['Write'] } },
      { name: 'tagged.json' }
    )

    const permissions = sourceFileToPermissions(file)

    expect(permissions).toHaveLength(2)
    for (const perm of permissions) {
      expect(perm.sourceFileId).toBe(file.id)
      expect(perm.sourceFileName).toBe('tagged.json')
    }
  })

  it('generates distinct ids for the same pattern in different categories', () => {
    const file = makeSourceFile({
      permissions: { allow: ['Bash(ls:*)'], deny: ['Bash(ls:*)'] },
    })

    const permissions = sourceFileToPermissions(file)
    const ids = new Set(permissions.map((p) => p.id))

    expect(ids.size).toBe(2)
  })
})

describe('sourceFileToPlugins', () => {
  it('returns an empty array when there are no plugins', () => {
    const file = makeSourceFile({ permissions: { allow: ['Read'] } })

    expect(sourceFileToPlugins(file)).toEqual([])
  })

  it('converts the enabledPlugins map to tagged plugin objects', () => {
    const file = makeSourceFile({
      permissions: {},
      enabledPlugins: { 'a@x': true, 'b@x': false },
    })

    const plugins = sourceFileToPlugins(file)

    expect(plugins).toHaveLength(2)
    expect(plugins.find((p) => p.id === 'b@x')?.enabled).toBe(false)
    expect(plugins[0]?.sourceFileId).toBe(file.id)
  })
})
