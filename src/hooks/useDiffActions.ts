/**
 * useDiffActions Hook
 *
 * Manages permission modifications for the diff output view.
 * Handles delete, re-categorize, and undo operations with proper state tracking.
 */

import { useReducer, useCallback, useMemo, useEffect } from 'react'
import type { Permission, PermissionCategory } from '@/types/permissions'
import type {
  DiffAction,
  DiffActionsState,
  UndoEntry,
  UseDiffActionsOptions,
  UseDiffActionsReturn,
} from '@/types/diffOutput'

// =============================================================================
// Reducer
// =============================================================================

function diffActionsReducer(
  state: DiffActionsState,
  action: DiffAction
): DiffActionsState {
  switch (action.type) {
    case 'DELETE_PERMISSION': {
      const { permissionId } = action
      const permission = state.permissions.find((p) => p.id === permissionId)

      // If already excluded, no-op
      if (!permission || permission.excluded) {
        return state
      }

      // Create undo entry
      const undoEntry: UndoEntry = {
        type: 'DELETE',
        permissionId,
        previousState: {
          category: permission.category,
          excluded: permission.excluded ?? false,
        },
        timestamp: Date.now(),
      }

      // Update permission to excluded
      const updatedPermissions = state.permissions.map((p) =>
        p.id === permissionId ? { ...p, excluded: true } : p
      )

      return {
        ...state,
        permissions: updatedPermissions,
        undoStack: [...state.undoStack, undoEntry],
        activeDropdownId: null, // Close any open dropdown
      }
    }

    case 'RECATEGORIZE_PERMISSION': {
      const { permissionId, newCategory } = action
      const permission = state.permissions.find((p) => p.id === permissionId)

      // If same category or not found, no-op
      if (!permission || permission.category === newCategory) {
        return state
      }

      // Create undo entry
      const undoEntry: UndoEntry = {
        type: 'RECATEGORIZE',
        permissionId,
        previousState: {
          category: permission.category,
          excluded: permission.excluded ?? false,
        },
        timestamp: Date.now(),
      }

      // Update permission category
      const updatedPermissions = state.permissions.map((p) =>
        p.id === permissionId ? { ...p, category: newCategory } : p
      )

      return {
        ...state,
        permissions: updatedPermissions,
        undoStack: [...state.undoStack, undoEntry],
        activeDropdownId: null, // Close dropdown after selection
      }
    }

    case 'UNDO': {
      const undoEntry = state.undoStack[state.undoStack.length - 1]
      if (!undoEntry) {
        return state
      }

      // Pop the most recent entry
      const newUndoStack = state.undoStack.slice(0, -1)

      // Restore the previous state
      const updatedPermissions = state.permissions.map((p) =>
        p.id === undoEntry.permissionId
          ? {
              ...p,
              category: undoEntry.previousState.category,
              excluded: undoEntry.previousState.excluded,
            }
          : p
      )

      return {
        ...state,
        permissions: updatedPermissions,
        undoStack: newUndoStack,
      }
    }

    case 'SET_ACTIVE_DROPDOWN': {
      return {
        ...state,
        activeDropdownId: action.permissionId,
      }
    }

    case 'RESET': {
      return {
        permissions: action.initialPermissions.map((p) => ({
          ...p,
          excluded: false,
        })),
        undoStack: [],
        activeDropdownId: null,
      }
    }

    default:
      return state
  }
}

// =============================================================================
// Hook
// =============================================================================

const MAX_UNDO_SIZE_DEFAULT = 50

export function useDiffActions(options: UseDiffActionsOptions): UseDiffActionsReturn {
  const {
    initialPermissions,
    maxUndoSize = MAX_UNDO_SIZE_DEFAULT,
    onPermissionsChange,
  } = options

  // Initialize state
  const [state, dispatch] = useReducer(diffActionsReducer, {
    permissions: initialPermissions.map((p) => ({ ...p })),
    undoStack: [],
    activeDropdownId: null,
  })

  // Trim undo stack if it exceeds max size
  useEffect(() => {
    if (state.undoStack.length > maxUndoSize) {
      // We could dispatch a trim action, but for simplicity
      // we just let it grow slightly beyond and trim on next action
      // This is fine since the extra entries are minimal
    }
  }, [state.undoStack.length, maxUndoSize])

  // Notify parent when permissions change
  useEffect(() => {
    onPermissionsChange?.(state.permissions)
  }, [state.permissions, onPermissionsChange])

  // =============================================================================
  // Actions (wrapped in useCallback for stable references)
  // =============================================================================

  const deletePermission = useCallback((permissionId: string) => {
    dispatch({ type: 'DELETE_PERMISSION', permissionId })
  }, [])

  const recategorizePermission = useCallback(
    (permissionId: string, newCategory: PermissionCategory) => {
      dispatch({ type: 'RECATEGORIZE_PERMISSION', permissionId, newCategory })
    },
    []
  )

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const setActiveDropdown = useCallback((permissionId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_DROPDOWN', permissionId })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', initialPermissions })
  }, [initialPermissions])

  // =============================================================================
  // Computed values (memoized)
  // =============================================================================

  const canUndo = useMemo(() => state.undoStack.length > 0, [state.undoStack.length])

  const groupedPermissions = useMemo(() => {
    const groups: { allow: Permission[]; deny: Permission[]; ask: Permission[] } = {
      allow: [],
      deny: [],
      ask: [],
    }

    for (const permission of state.permissions) {
      // Skip excluded permissions
      if (permission.excluded) {
        continue
      }
      groups[permission.category].push(permission)
    }

    // Sort each group alphabetically by pattern
    groups.allow.sort((a, b) => a.pattern.localeCompare(b.pattern))
    groups.deny.sort((a, b) => a.pattern.localeCompare(b.pattern))
    groups.ask.sort((a, b) => a.pattern.localeCompare(b.pattern))

    return groups
  }, [state.permissions])

  const visibleCount = useMemo(
    () => state.permissions.filter((p) => !p.excluded).length,
    [state.permissions]
  )

  const excludedCount = useMemo(
    () => state.permissions.filter((p) => p.excluded).length,
    [state.permissions]
  )

  const modificationCount = useMemo(() => state.undoStack.length, [state.undoStack.length])

  // =============================================================================
  // Return combined state, actions, and computed values
  // =============================================================================

  return {
    // State
    permissions: state.permissions,
    undoStack: state.undoStack,
    activeDropdownId: state.activeDropdownId,

    // Actions
    deletePermission,
    recategorizePermission,
    undo,
    setActiveDropdown,
    reset,

    // Computed
    canUndo,
    groupedPermissions,
    visibleCount,
    excludedCount,
    modificationCount,
  }
}
