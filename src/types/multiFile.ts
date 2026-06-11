/**
 * Multi-File Merge Types
 *
 * Types for the multi-file upload and merge functionality.
 */

import type {
  ParseError,
  SettingsConfiguration,
  PermissionCategory,
  Permission,
  Plugin,
} from './permissions'

// =============================================================================
// Input Method Types
// =============================================================================

/** How a source file was added */
export type InputMethod = 'file' | 'paste'

/** Validation status for a source file */
export interface ValidationStatus {
  status: 'valid' | 'invalid' | 'warning'
  error: ParseError | null
  warnings: string[]
}

/** Represents an uploaded or pasted settings.json file */
export interface SourceFile {
  /** Unique identifier (UUID v4) */
  id: string

  /** Display name (filename or "Pasted Input") */
  name: string

  /** Raw file content */
  content: string

  /** SHA-256 hash of content for duplicate detection */
  contentHash: string

  /** How the content was added */
  inputMethod: InputMethod

  /** Unix timestamp when added */
  addedAt: number

  /** Position in merge order (0 = lowest priority, last = highest) */
  order: number

  /** Validation result */
  validationStatus: ValidationStatus

  /** Parsed configuration if valid */
  parsedConfig: SettingsConfiguration | null

  /** Number of permissions found */
  permissionCount: number

  /** Number of plugins found */
  pluginCount: number
}

// =============================================================================
// Conflict Types
// =============================================================================

/** One side of a conflict */
export interface ConflictSource {
  sourceFileId: string
  sourceFileName: string
  category: PermissionCategory
  permissionId: string
}

/** A conflict between multiple source files */
export interface MultiFileConflict {
  /** Unique conflict identifier */
  id: string

  /** The conflicting permission pattern */
  pattern: string

  /** All sources containing this pattern with different categories */
  sources: ConflictSource[]

  /** Whether user has resolved this conflict */
  resolved: boolean

  /** ID of the chosen source file (if resolved) */
  resolvedSourceId: string | null
}

/** Statistics about the merge operation */
export interface MergeStats {
  totalPermissions: number
  totalPlugins: number
  conflictCount: number
  sourceFileCount: number
  excludedCount: number
}

// =============================================================================
// Multi-File State
// =============================================================================

/** Multi-file undo action types */
export type MultiFileUndoType =
  | 'exclude_rule'
  | 'include_rule'
  | 'resolve_conflict'
  | 'remove_file'
  | 'reorder_files'

/** Undo action for multi-file operations */
export interface MultiFileUndoAction {
  type: MultiFileUndoType
  timestamp: number
  payload: {
    ruleId?: string
    conflictId?: string
    previousSourceId?: string | null
    fileId?: string
    file?: SourceFile
    previousOrder?: string[]
  }
}

/** Merge result from the merge function */
export interface MultiFileMergeResult {
  permissions: Permission[]
  plugins: Plugin[]
  conflicts: MultiFileConflict[]
}
