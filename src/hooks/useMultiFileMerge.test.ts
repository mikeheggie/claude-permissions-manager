import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMultiFileMerge } from './useMultiFileMerge'
import { makeSourceFile } from '@/test/factories'

const allowNpm = { permissions: { allow: ['Bash(npm:*)'] } }
const denyNpm = { permissions: { deny: ['Bash(npm:*)'] } }

describe('useMultiFileMerge', () => {
  it('starts empty and cannot export', () => {
    const { result } = renderHook(() => useMultiFileMerge())

    expect(result.current.state.sourceFiles).toEqual([])
    expect(result.current.computed.canExport).toBe(false)
    expect(result.current.computed.hasConflicts).toBe(false)
  })

  it('merges added files and enables export', () => {
    const { result } = renderHook(() => useMultiFileMerge())

    act(() => {
      result.current.actions.addSourceFile(makeSourceFile(allowNpm, { name: 'a.json' }))
      result.current.actions.addSourceFile(
        makeSourceFile({ permissions: { allow: ['Bash(git:*)'] } }, { name: 'b.json' })
      )
    })

    expect(result.current.state.permissions).toHaveLength(2)
    expect(result.current.computed.canExport).toBe(true)
    expect(result.current.state.stats.sourceFileCount).toBe(2)
  })

  it('detects conflicts between files and resolves them by chosen source', () => {
    const { result } = renderHook(() => useMultiFileMerge())
    const fileA = makeSourceFile(allowNpm, { name: 'a.json' })
    const fileB = makeSourceFile(denyNpm, { name: 'b.json' })

    act(() => {
      result.current.actions.addSourceFile(fileA)
      result.current.actions.addSourceFile(fileB)
    })

    expect(result.current.computed.unresolvedConflictCount).toBe(1)
    // Later file wins by default
    expect(result.current.state.permissions[0]?.category).toBe('deny')

    const conflict = result.current.state.conflicts[0]
    expect(conflict).toBeDefined()

    act(() => {
      result.current.actions.resolveConflict(conflict!.id, fileA.id)
    })

    expect(result.current.computed.unresolvedConflictCount).toBe(0)
    expect(result.current.state.permissions[0]?.category).toBe('allow')
    expect(result.current.state.conflicts[0]?.resolved).toBe(true)
  })

  it('excludes rules from the export and supports undo', () => {
    const { result } = renderHook(() => useMultiFileMerge())

    act(() => {
      result.current.actions.addSourceFile(
        makeSourceFile({ permissions: { allow: ['Bash(npm:*)', 'Bash(git:*)'] } })
      )
    })

    const excludedId = result.current.state.permissions.find(
      (p) => p.pattern === 'Bash(npm:*)'
    )!.id

    act(() => {
      result.current.actions.excludeRule(excludedId)
    })

    const exported = JSON.parse(result.current.exportSettings())
    expect(exported.permissions.allow).toEqual(['Bash(git:*)'])

    act(() => {
      result.current.actions.undo()
    })

    const reExported = JSON.parse(result.current.exportSettings())
    expect(reExported.permissions.allow).toEqual(['Bash(git:*)', 'Bash(npm:*)'])
  })

  it('removing a file recomputes the merge, and undo restores it', () => {
    const { result } = renderHook(() => useMultiFileMerge())
    const fileA = makeSourceFile(allowNpm, { name: 'a.json' })

    act(() => {
      result.current.actions.addSourceFile(fileA)
      result.current.actions.addSourceFile(
        makeSourceFile({ permissions: { allow: ['Bash(git:*)'] } }, { name: 'b.json' })
      )
    })

    act(() => {
      result.current.actions.removeSourceFile(fileA.id)
    })

    expect(result.current.state.sourceFiles).toHaveLength(1)
    expect(result.current.state.permissions.map((p) => p.pattern)).toEqual(['Bash(git:*)'])

    act(() => {
      result.current.actions.undo()
    })

    expect(result.current.state.sourceFiles).toHaveLength(2)
    expect(result.current.state.permissions).toHaveLength(2)
  })

  it('reordering files changes which file wins a conflict', () => {
    const { result } = renderHook(() => useMultiFileMerge())
    const fileA = makeSourceFile(allowNpm, { name: 'a.json' })
    const fileB = makeSourceFile(denyNpm, { name: 'b.json' })

    act(() => {
      result.current.actions.addSourceFile(fileA)
      result.current.actions.addSourceFile(fileB)
    })

    expect(result.current.state.permissions[0]?.category).toBe('deny')

    act(() => {
      result.current.actions.reorderSourceFiles([fileB.id, fileA.id])
    })

    // fileA is now last (highest priority), so allow wins
    expect(result.current.state.permissions[0]?.category).toBe('allow')
  })

  it('does not export rules from invalid files and blocks export without valid files', () => {
    const { result } = renderHook(() => useMultiFileMerge())

    act(() => {
      result.current.actions.addSourceFile(makeSourceFile(null, { invalid: true }))
    })

    expect(result.current.computed.canExport).toBe(false)
    expect(result.current.state.permissions).toEqual([])
  })

  it('clearAll resets everything', () => {
    const { result } = renderHook(() => useMultiFileMerge())

    act(() => {
      result.current.actions.addSourceFile(makeSourceFile(allowNpm))
      result.current.actions.clearAll()
    })

    expect(result.current.state.sourceFiles).toEqual([])
    expect(result.current.computed.canExport).toBe(false)
  })
})
