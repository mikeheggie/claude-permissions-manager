/**
 * Diff Output Types
 *
 * Types for the diff-style output view that displays merged permissions
 * as a JSON structure with inline editing capabilities.
 */

import type { Permission, PermissionCategory } from './permissions'

// =============================================================================
// Undo Types
// =============================================================================

/**
 * Entry in the undo stack representing a reversible action.
 */
export interface UndoEntry {
  /** Type of action that was performed */
  type: 'DELETE' | 'RECATEGORIZE'

  /** ID of the permission that was affected */
  permissionId: string

  /** State of the permission before the action */
  previousState: {
    category: PermissionCategory
    excluded: boolean
  }

  /** Unix timestamp when the action occurred */
  timestamp: number
}

// =============================================================================
// State Types
// =============================================================================

/**
 * State managed by the useDiffActions hook.
 */
export interface DiffActionsState {
  /** Current permissions, modified by actions */
  permissions: Permission[]

  /** Stack of undoable actions (most recent last) */
  undoStack: UndoEntry[]

  /** ID of permission with open dropdown, or null */
  activeDropdownId: string | null
}

// =============================================================================
// Action Types
// =============================================================================

/**
 * Union type for all reducer actions.
 */
export type DiffAction =
  | { type: 'DELETE_PERMISSION'; permissionId: string }
  | { type: 'RECATEGORIZE_PERMISSION'; permissionId: string; newCategory: PermissionCategory }
  | { type: 'UNDO' }
  | { type: 'SET_ACTIVE_DROPDOWN'; permissionId: string | null }
  | { type: 'RESET'; initialPermissions: Permission[] }

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for the DiffLine component.
 */
export interface DiffLineProps {
  /** The permission to render */
  permission: Permission

  /** Line number to display (1-indexed) */
  lineNumber: number

  /** Whether this is the last item in its category array (controls trailing comma) */
  isLastInSection: boolean

  /** Callback when delete action is triggered */
  onDelete: (permissionId: string) => void

  /** Callback when re-categorize action is triggered */
  onRecategorize: (permissionId: string, newCategory: PermissionCategory) => void

  /** Color for the left border (from source file) */
  sourceColor?: string | undefined

  /** Source file name for tooltip */
  sourceFileName?: string | undefined

  /** Whether the re-categorize dropdown is currently open */
  isDropdownOpen?: boolean

  /** Callback when dropdown state changes */
  onDropdownToggle?: (isOpen: boolean) => void
}

/**
 * Props for the CategorySection component.
 */
export interface CategorySectionProps {
  /** The category this section represents */
  category: PermissionCategory

  /** Permissions to display in this section (should already be filtered) */
  permissions: Permission[]

  /** Line number for the array opening line */
  startLineNumber: number

  /** Whether this is the last category section (controls trailing comma) */
  isLastSection: boolean

  /** Callback when a permission is deleted */
  onDelete: (permissionId: string) => void

  /** Callback when a permission is re-categorized */
  onRecategorize: (permissionId: string, newCategory: PermissionCategory) => void

  /** Map of source file IDs to their display colors */
  sourceFileColors: Map<string, string>

  /** Map of source file IDs to their display names */
  sourceFileNames: Map<string, string>

  /** ID of permission with open dropdown, or null */
  activeDropdownId: string | null

  /** Callback when dropdown state changes */
  onDropdownToggle: (permissionId: string | null) => void
}

/**
 * Props for the LineActions component.
 */
export interface LineActionsProps {
  /** ID of the permission these actions apply to */
  permissionId: string

  /** Current category of the permission */
  currentCategory: PermissionCategory

  /** Callback when delete button is clicked */
  onDelete: () => void

  /** Callback when a new category is selected */
  onRecategorize: (newCategory: PermissionCategory) => void

  /** Whether the dropdown is currently open */
  isDropdownOpen: boolean

  /** Callback when dropdown state changes */
  onDropdownToggle: (isOpen: boolean) => void
}

// =============================================================================
// Hook Types
// =============================================================================

/**
 * Options for the useDiffActions hook.
 */
export interface UseDiffActionsOptions {
  /** Initial permissions to manage */
  initialPermissions: Permission[]

  /** Maximum undo stack size (default: 50) */
  maxUndoSize?: number

  /** Callback when permissions change */
  onPermissionsChange?: (permissions: Permission[]) => void
}

/**
 * Computed values derived from state.
 */
export interface DiffActionsComputed {
  /** Whether undo is available */
  canUndo: boolean

  /** Permissions grouped by category (excluding deleted) */
  groupedPermissions: {
    allow: Permission[]
    deny: Permission[]
    ask: Permission[]
  }

  /** Count of visible (non-excluded) permissions */
  visibleCount: number

  /** Count of excluded permissions */
  excludedCount: number

  /** Total modification count (deletes + recategorizations) */
  modificationCount: number
}

/**
 * Actions available from the useDiffActions hook.
 */
export interface DiffActionsAPI {
  /** Delete a permission (marks as excluded) */
  deletePermission: (permissionId: string) => void

  /** Move a permission to a different category */
  recategorizePermission: (permissionId: string, newCategory: PermissionCategory) => void

  /** Undo the most recent action */
  undo: () => void

  /** Set which permission's dropdown is open */
  setActiveDropdown: (permissionId: string | null) => void

  /** Reset all modifications and clear undo stack */
  reset: () => void
}

/**
 * Return type of the useDiffActions hook.
 */
export interface UseDiffActionsReturn
  extends DiffActionsState,
    DiffActionsAPI,
    DiffActionsComputed {}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Display configuration for a permission category.
 */
export interface CategoryDisplay {
  label: string
  color: string
  icon?: string
}

/**
 * Props for the main DiffOutputView component.
 */
export interface DiffOutputViewProps {
  /** Array of all permissions to display */
  permissions: Permission[]

  /** Source file colors map (sourceFileId -> color) */
  sourceFileColors: Map<string, string>

  /** Source file names map (sourceFileId -> name) */
  sourceFileNames: Map<string, string>

  /** Callback when a permission is deleted */
  onDeletePermission: (permissionId: string) => void

  /** Callback when a permission is moved to a different category */
  onRecategorizePermission: (permissionId: string, newCategory: PermissionCategory) => void

  /** Callback to undo the last action */
  onUndo: () => void

  /** Whether undo is available */
  canUndo: boolean

  /** Count of excluded permissions */
  excludedCount?: number

  /** Count of modifications */
  modificationCount?: number

  /** Optional label for the output section */
  label?: string

  /** Optional test ID for testing */
  testId?: string
}
