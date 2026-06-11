/**
 * useMultiFileMerge Hook
 *
 * State management hook for multi-file merge operations.
 * Handles source files, merge computation, conflict resolution,
 * and rule exclusion with undo support.
 */

import { useReducer, useCallback, useMemo } from 'react'

import type { Permission, Plugin, DefaultMode, PermissionCategory } from '@/types/permissions'
import type {
  SourceFile,
  MultiFileConflict,
  MergeStats,
  MultiFileUndoAction,
} from '@/types/multiFile'

import { mergeSourceFiles } from '@/utils/mergeLogic'
import { toSettingsJson } from '@/utils/exportJson'

// =============================================================================
// Types
// =============================================================================

export interface UseMultiFileMergeReturn {
  /** Current state */
  state: {
    sourceFiles: SourceFile[]
    permissions: Permission[]
    plugins: Plugin[]
    conflicts: MultiFileConflict[]
    excludedRuleIds: Set<string>
    stats: MergeStats
  }

  /** Actions */
  actions: {
    addSourceFile: (file: SourceFile) => void
    removeSourceFile: (fileId: string) => void
    reorderSourceFiles: (orderedIds: string[]) => void
    resolveConflict: (conflictId: string, chosenSourceId: string) => void
    excludeRule: (ruleId: string) => void
    includeRule: (ruleId: string) => void
    recategorizePermission: (permissionId: string, newCategory: PermissionCategory) => void
    clearAll: () => void
    undo: () => void
  }

  /** Computed values */
  computed: {
    canExport: boolean
    canUndo: boolean
    hasConflicts: boolean
    unresolvedConflictCount: number
  }

  /** Export the merged settings */
  exportSettings: (defaultMode?: DefaultMode) => string
}

// =============================================================================
// State Types
// =============================================================================

type Action =
  | { type: 'ADD_SOURCE_FILE'; payload: SourceFile }
  | { type: 'REMOVE_SOURCE_FILE'; payload: string }
  | { type: 'REORDER_SOURCE_FILES'; payload: string[] }
  | { type: 'RESOLVE_CONFLICT'; payload: { conflictId: string; chosenSourceId: string } }
  | { type: 'EXCLUDE_RULE'; payload: string }
  | { type: 'INCLUDE_RULE'; payload: string }
  | { type: 'RECATEGORIZE_PERMISSION'; payload: { permissionId: string; newCategory: PermissionCategory } }
  | { type: 'CLEAR_ALL' }
  | { type: 'UNDO' }

interface InternalState {
  sourceFiles: SourceFile[]
  permissions: Permission[]
  plugins: Plugin[]
  conflicts: MultiFileConflict[]
  excludedRuleIds: Set<string>
  undoStack: MultiFileUndoAction[]
}

// =============================================================================
// Initial State
// =============================================================================

const createInitialState = (): InternalState => ({
  sourceFiles: [],
  permissions: [],
  plugins: [],
  conflicts: [],
  excludedRuleIds: new Set(),
  undoStack: [],
})

// =============================================================================
// Helpers
// =============================================================================

/**
 * Recalculate merge result from source files.
 */
function recalculateMerge(sourceFiles: SourceFile[]): {
  permissions: Permission[]
  plugins: Plugin[]
  conflicts: MultiFileConflict[]
} {
  if (sourceFiles.length === 0) {
    return { permissions: [], plugins: [], conflicts: [] }
  }

  // Sort by order for proper merge priority
  const sortedFiles = [...sourceFiles].sort((a, b) => a.order - b.order)
  return mergeSourceFiles(sortedFiles)
}

/**
 * Compute merge statistics.
 */
function computeStats(
  sourceFiles: SourceFile[],
  permissions: Permission[],
  plugins: Plugin[],
  conflicts: MultiFileConflict[],
  excludedRuleIds: Set<string>
): MergeStats {
  return {
    totalPermissions: permissions.length,
    totalPlugins: plugins.length,
    conflictCount: conflicts.filter((c) => !c.resolved).length,
    sourceFileCount: sourceFiles.filter((f) => f.validationStatus.status !== 'invalid').length,
    excludedCount: excludedRuleIds.size,
  }
}

// =============================================================================
// Reducer
// =============================================================================

function reducer(state: InternalState, action: Action): InternalState {
  switch (action.type) {
    case 'ADD_SOURCE_FILE': {
      const newFile = {
        ...action.payload,
        order: state.sourceFiles.length, // Add at end (highest priority)
      }
      const newSourceFiles = [...state.sourceFiles, newFile]
      const mergeResult = recalculateMerge(newSourceFiles)

      return {
        ...state,
        sourceFiles: newSourceFiles,
        permissions: mergeResult.permissions,
        plugins: mergeResult.plugins,
        conflicts: mergeResult.conflicts,
        // Keep existing exclusions that still apply
        excludedRuleIds: new Set(
          [...state.excludedRuleIds].filter(
            (id) =>
              mergeResult.permissions.some((p) => p.id === id) ||
              mergeResult.plugins.some((p) => p.id === id)
          )
        ),
      }
    }

    case 'REMOVE_SOURCE_FILE': {
      const fileToRemove = state.sourceFiles.find((f) => f.id === action.payload)
      if (!fileToRemove) return state

      const newSourceFiles = state.sourceFiles
        .filter((f) => f.id !== action.payload)
        .map((f, idx) => ({ ...f, order: idx })) // Reindex orders

      const mergeResult = recalculateMerge(newSourceFiles)

      // Add to undo stack
      const undoAction: MultiFileUndoAction = {
        type: 'remove_file',
        timestamp: Date.now(),
        payload: {
          fileId: action.payload,
          file: fileToRemove,
        },
      }

      return {
        ...state,
        sourceFiles: newSourceFiles,
        permissions: mergeResult.permissions,
        plugins: mergeResult.plugins,
        conflicts: mergeResult.conflicts,
        excludedRuleIds: new Set(
          [...state.excludedRuleIds].filter(
            (id) =>
              mergeResult.permissions.some((p) => p.id === id) ||
              mergeResult.plugins.some((p) => p.id === id)
          )
        ),
        undoStack: [...state.undoStack, undoAction].slice(-50), // Keep last 50
      }
    }

    case 'REORDER_SOURCE_FILES': {
      const previousOrder = state.sourceFiles.map((f) => f.id)
      const orderedIds = action.payload

      // Create new array with updated order values
      const newSourceFiles = orderedIds
        .map((id, idx) => {
          const file = state.sourceFiles.find((f) => f.id === id)
          return file ? { ...file, order: idx } : null
        })
        .filter((f): f is SourceFile => f !== null)

      const mergeResult = recalculateMerge(newSourceFiles)

      // Add to undo stack
      const undoAction: MultiFileUndoAction = {
        type: 'reorder_files',
        timestamp: Date.now(),
        payload: {
          previousOrder,
        },
      }

      return {
        ...state,
        sourceFiles: newSourceFiles,
        permissions: mergeResult.permissions,
        plugins: mergeResult.plugins,
        conflicts: mergeResult.conflicts,
        undoStack: [...state.undoStack, undoAction].slice(-50),
      }
    }

    case 'RESOLVE_CONFLICT': {
      const { conflictId, chosenSourceId } = action.payload
      const conflict = state.conflicts.find((c) => c.id === conflictId)

      if (!conflict) return state

      // Find the chosen source and its category
      const chosenSource = conflict.sources.find((s) => s.sourceFileId === chosenSourceId)
      if (!chosenSource) return state

      // Add to undo stack
      const undoAction: MultiFileUndoAction = {
        type: 'resolve_conflict',
        timestamp: Date.now(),
        payload: {
          conflictId,
          previousSourceId: conflict.resolvedSourceId,
        },
      }

      // Update the conflict
      const newConflicts = state.conflicts.map((c) =>
        c.id === conflictId
          ? { ...c, resolved: true, resolvedSourceId: chosenSourceId }
          : c
      )

      // Update the permission to use the chosen category
      const newPermissions = state.permissions.map((perm) => {
        if (perm.pattern === conflict.pattern) {
          return {
            ...perm,
            category: chosenSource.category,
            sourceFileId: chosenSourceId,
            sourceFileName: chosenSource.sourceFileName,
          }
        }
        return perm
      })

      return {
        ...state,
        conflicts: newConflicts,
        permissions: newPermissions,
        undoStack: [...state.undoStack, undoAction].slice(-50),
      }
    }

    case 'EXCLUDE_RULE': {
      const ruleId = action.payload

      // Add to undo stack
      const undoAction: MultiFileUndoAction = {
        type: 'exclude_rule',
        timestamp: Date.now(),
        payload: {
          ruleId,
        },
      }

      return {
        ...state,
        excludedRuleIds: new Set([...state.excludedRuleIds, ruleId]),
        undoStack: [...state.undoStack, undoAction].slice(-50),
      }
    }

    case 'INCLUDE_RULE': {
      const ruleId = action.payload

      // Add to undo stack
      const undoAction: MultiFileUndoAction = {
        type: 'include_rule',
        timestamp: Date.now(),
        payload: {
          ruleId,
        },
      }

      const newExcluded = new Set(state.excludedRuleIds)
      newExcluded.delete(ruleId)

      return {
        ...state,
        excludedRuleIds: newExcluded,
        undoStack: [...state.undoStack, undoAction].slice(-50),
      }
    }

    case 'RECATEGORIZE_PERMISSION': {
      const { permissionId, newCategory } = action.payload
      const permission = state.permissions.find((p) => p.id === permissionId)

      // If permission not found or same category, no-op
      if (!permission || permission.category === newCategory) {
        return state
      }

      // Update permission category
      const newPermissions = state.permissions.map((p) =>
        p.id === permissionId ? { ...p, category: newCategory } : p
      )

      return {
        ...state,
        permissions: newPermissions,
        // Note: Recategorize doesn't add to undoStack here since MergePreview
        // handles undo via useDiffActions hook. This action is for sync only.
      }
    }

    case 'CLEAR_ALL': {
      return createInitialState()
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state

      const lastAction = state.undoStack[state.undoStack.length - 1]
      if (!lastAction) return state

      const newUndoStack = state.undoStack.slice(0, -1)

      switch (lastAction.type) {
        case 'exclude_rule': {
          const newExcluded = new Set(state.excludedRuleIds)
          if (lastAction.payload.ruleId) {
            newExcluded.delete(lastAction.payload.ruleId)
          }
          return { ...state, excludedRuleIds: newExcluded, undoStack: newUndoStack }
        }

        case 'include_rule': {
          if (lastAction.payload.ruleId) {
            return {
              ...state,
              excludedRuleIds: new Set([...state.excludedRuleIds, lastAction.payload.ruleId]),
              undoStack: newUndoStack,
            }
          }
          return { ...state, undoStack: newUndoStack }
        }

        case 'remove_file': {
          if (lastAction.payload.file) {
            const restoredFile = lastAction.payload.file
            const newSourceFiles = [...state.sourceFiles, restoredFile].sort(
              (a, b) => a.order - b.order
            )
            const mergeResult = recalculateMerge(newSourceFiles)
            return {
              ...state,
              sourceFiles: newSourceFiles,
              permissions: mergeResult.permissions,
              plugins: mergeResult.plugins,
              conflicts: mergeResult.conflicts,
              undoStack: newUndoStack,
            }
          }
          return { ...state, undoStack: newUndoStack }
        }

        case 'reorder_files': {
          if (lastAction.payload.previousOrder) {
            const previousOrder = lastAction.payload.previousOrder
            const newSourceFiles = previousOrder
              .map((id, idx) => {
                const file = state.sourceFiles.find((f) => f.id === id)
                return file ? { ...file, order: idx } : null
              })
              .filter((f): f is SourceFile => f !== null)

            const mergeResult = recalculateMerge(newSourceFiles)
            return {
              ...state,
              sourceFiles: newSourceFiles,
              permissions: mergeResult.permissions,
              plugins: mergeResult.plugins,
              conflicts: mergeResult.conflicts,
              undoStack: newUndoStack,
            }
          }
          return { ...state, undoStack: newUndoStack }
        }

        case 'resolve_conflict': {
          if (lastAction.payload.conflictId) {
            const newConflicts = state.conflicts.map((c) =>
              c.id === lastAction.payload.conflictId
                ? {
                    ...c,
                    resolved: lastAction.payload.previousSourceId !== null,
                    resolvedSourceId: lastAction.payload.previousSourceId ?? null,
                  }
                : c
            )
            return { ...state, conflicts: newConflicts, undoStack: newUndoStack }
          }
          return { ...state, undoStack: newUndoStack }
        }

        default:
          return { ...state, undoStack: newUndoStack }
      }
    }

    default:
      return state
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useMultiFileMerge(): UseMultiFileMergeReturn {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  // Actions
  const addSourceFile = useCallback((file: SourceFile) => {
    dispatch({ type: 'ADD_SOURCE_FILE', payload: file })
  }, [])

  const removeSourceFile = useCallback((fileId: string) => {
    dispatch({ type: 'REMOVE_SOURCE_FILE', payload: fileId })
  }, [])

  const reorderSourceFiles = useCallback((orderedIds: string[]) => {
    dispatch({ type: 'REORDER_SOURCE_FILES', payload: orderedIds })
  }, [])

  const resolveConflict = useCallback((conflictId: string, chosenSourceId: string) => {
    dispatch({ type: 'RESOLVE_CONFLICT', payload: { conflictId, chosenSourceId } })
  }, [])

  const excludeRule = useCallback((ruleId: string) => {
    dispatch({ type: 'EXCLUDE_RULE', payload: ruleId })
  }, [])

  const includeRule = useCallback((ruleId: string) => {
    dispatch({ type: 'INCLUDE_RULE', payload: ruleId })
  }, [])

  const recategorizePermission = useCallback(
    (permissionId: string, newCategory: PermissionCategory) => {
      dispatch({ type: 'RECATEGORIZE_PERMISSION', payload: { permissionId, newCategory } })
    },
    []
  )

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  // Computed values
  const stats = useMemo(
    () =>
      computeStats(
        state.sourceFiles,
        state.permissions,
        state.plugins,
        state.conflicts,
        state.excludedRuleIds
      ),
    [state.sourceFiles, state.permissions, state.plugins, state.conflicts, state.excludedRuleIds]
  )

  const unresolvedConflictCount = useMemo(
    () => state.conflicts.filter((c) => !c.resolved).length,
    [state.conflicts]
  )

  const canExport = useMemo(
    () => state.sourceFiles.some((f) => f.validationStatus.status === 'valid'),
    [state.sourceFiles]
  )

  const canUndo = state.undoStack.length > 0

  const hasConflicts = unresolvedConflictCount > 0

  // Export function - excludes removed rules
  const exportSettings = useCallback(
    (defaultMode?: DefaultMode): string => {
      // Filter out excluded permissions
      const includedPermissions = state.permissions.filter(
        (p) => !state.excludedRuleIds.has(p.id)
      )

      // Filter out excluded plugins
      const includedPlugins = state.plugins.filter(
        (p) => !state.excludedRuleIds.has(p.id)
      )

      return toSettingsJson(includedPermissions, includedPlugins, defaultMode)
    },
    [state.permissions, state.plugins, state.excludedRuleIds]
  )

  return {
    state: {
      sourceFiles: state.sourceFiles,
      permissions: state.permissions,
      plugins: state.plugins,
      conflicts: state.conflicts,
      excludedRuleIds: state.excludedRuleIds,
      stats,
    },
    actions: {
      addSourceFile,
      removeSourceFile,
      reorderSourceFiles,
      resolveConflict,
      excludeRule,
      includeRule,
      recategorizePermission,
      clearAll,
      undo,
    },
    computed: {
      canExport,
      canUndo,
      hasConflicts,
      unresolvedConflictCount,
    },
    exportSettings,
  }
}
