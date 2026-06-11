/**
 * Core Types for Claude Permissions Manager
 */

// =============================================================================
// Core Types
// =============================================================================

/** Permission category determines behavior when Claude encounters a matching action */
export type PermissionCategory = 'allow' | 'deny' | 'ask'

/** Source indicates where the permission originated from */
export type PermissionSource = 'global' | 'project' | 'both'

/** Default mode for permission handling when no explicit rule matches */
export type DefaultMode = 'acceptEdits' | 'askEveryTime' | 'ignoreAll'

/**
 * A single permission pattern that defines an allowed, denied, or ask-required action.
 */
export interface Permission {
  /** Unique identifier for this permission instance */
  id: string

  /** The permission pattern string, e.g., "Bash(git push:*)" */
  pattern: string

  /** Which category this permission belongs to */
  category: PermissionCategory

  /** Where this permission originated from */
  source: PermissionSource

  /** Original category if moved (for undo functionality) */
  originalCategory?: PermissionCategory | undefined

  /** Original source before any merge operations */
  originalSource: PermissionSource

  // =============================================================================
  // Multi-File Extension Fields
  // =============================================================================

  /** ID of source file (multi-file merge) */
  sourceFileId?: string | undefined

  /** Display name of source file (multi-file merge) */
  sourceFileName?: string | undefined

  /** IDs of permissions this conflicts with (multi-file merge) */
  conflictsWith?: string[] | undefined

  /** Whether user has excluded this from output (multi-file merge) */
  excluded?: boolean | undefined
}

/**
 * The complete settings.json structure as parsed from user input.
 */
export interface SettingsConfiguration {
  permissions: {
    allow?: string[] | undefined
    deny?: string[] | undefined
    ask?: string[] | undefined
    defaultMode?: DefaultMode | undefined
  }
  enabledPlugins?: Record<string, boolean> | undefined
}

/**
 * A toggleable plugin configuration.
 */
export interface Plugin {
  /** Plugin identifier, e.g., "ralph-loop@claude-plugins-official" */
  id: string

  /** Current enabled state */
  enabled: boolean

  /** Which source this plugin came from */
  source: PermissionSource

  // =============================================================================
  // Multi-File Extension Fields
  // =============================================================================

  /** ID of source file (multi-file merge) */
  sourceFileId?: string | undefined

  /** Display name of source file (multi-file merge) */
  sourceFileName?: string | undefined

  /** Whether user has excluded this from output (multi-file merge) */
  excluded?: boolean | undefined
}

// =============================================================================
// Parse Types
// =============================================================================

/**
 * Error details when JSON parsing fails.
 */
export interface ParseError {
  message: string
  line?: number | undefined
  column?: number | undefined
}

/**
 * Result of JSON parsing with error handling.
 */
export interface ParseResult {
  success: boolean
  data?: SettingsConfiguration | undefined
  error?: ParseError | undefined
}
