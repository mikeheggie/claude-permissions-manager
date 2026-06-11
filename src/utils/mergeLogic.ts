/**
 * Permission Merge Logic
 * Merges permissions from multiple settings files, detecting conflicts
 * between files that assign the same pattern to different categories.
 */

import type {
  Permission,
  PermissionCategory,
  PermissionSource,
  Plugin,
} from '@/types/permissions'

import type {
  SourceFile,
  MultiFileConflict,
  ConflictSource,
  MultiFileMergeResult,
} from '@/types/multiFile'

/**
 * Generate a simple hash from a string for creating unique IDs.
 * Uses a simple djb2 hash algorithm.
 */
function simpleHash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + (str.charCodeAt(i) ?? 0)
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16)
}

/**
 * Generate a unique ID for a multi-file permission.
 * Uses the source file ID and pattern for uniqueness.
 */
export function generateMultiFilePermissionId(
  sourceFileId: string,
  category: PermissionCategory,
  pattern: string
): string {
  return `${sourceFileId}-${category}-${simpleHash(pattern)}`
}

/**
 * Generate a unique ID for a conflict.
 */
function generateConflictId(pattern: string): string {
  return `conflict-${simpleHash(pattern)}`
}

/**
 * Convert a source file's parsed config to permissions with source tracking.
 */
export function sourceFileToPermissions(sourceFile: SourceFile): Permission[] {
  if (!sourceFile.parsedConfig) {
    return []
  }

  const permissions: Permission[] = []
  const categories: PermissionCategory[] = ['allow', 'deny', 'ask']

  for (const category of categories) {
    const patterns = sourceFile.parsedConfig.permissions[category] ?? []
    for (const pattern of patterns) {
      permissions.push({
        id: generateMultiFilePermissionId(sourceFile.id, category, pattern),
        pattern,
        category,
        source: 'project', // Use 'project' for compatibility; use sourceFileId for multi-file
        originalSource: 'project',
        sourceFileId: sourceFile.id,
        sourceFileName: sourceFile.name,
      })
    }
  }

  return permissions
}

/**
 * Convert a source file's parsed config plugins with source tracking.
 */
export function sourceFileToPlugins(sourceFile: SourceFile): Plugin[] {
  if (!sourceFile.parsedConfig?.enabledPlugins) {
    return []
  }

  return Object.entries(sourceFile.parsedConfig.enabledPlugins).map(([id, enabled]) => ({
    id,
    enabled,
    source: 'project' as PermissionSource, // Use 'project' for compatibility
    sourceFileId: sourceFile.id,
    sourceFileName: sourceFile.name,
  }))
}

/**
 * Merge permissions from multiple source files.
 * Files are processed in order; later files (higher index) take priority for conflicts.
 *
 * Algorithm:
 * 1. Process files in order (index 0 = lowest priority, last = highest priority)
 * 2. For each permission pattern:
 *    - If not seen before: add it
 *    - If same category as existing: update source to latest file
 *    - If different category: create/update conflict, keep higher-priority version as default
 *
 * @param sourceFiles - Ordered array of source files (index 0 = lowest priority)
 * @returns MergeResult with permissions, plugins, and conflicts
 */
export function mergeSourceFiles(sourceFiles: SourceFile[]): MultiFileMergeResult {
  // Map pattern -> Permission (for tracking merged result)
  const permissionsByPattern = new Map<string, Permission>()

  // Map pattern -> array of ConflictSources (for building conflicts)
  const conflictSources = new Map<string, ConflictSource[]>()

  // Map pluginId -> Plugin (for tracking merged plugins)
  const pluginsById = new Map<string, Plugin>()

  // Process each file in order (later files override earlier ones)
  for (const sourceFile of sourceFiles) {
    if (!sourceFile.parsedConfig || sourceFile.validationStatus.status === 'invalid') {
      continue
    }

    // Process permissions
    const filePermissions = sourceFileToPermissions(sourceFile)
    for (const perm of filePermissions) {
      const existing = permissionsByPattern.get(perm.pattern)

      if (!existing) {
        // First occurrence of this pattern
        permissionsByPattern.set(perm.pattern, perm)
      } else if (existing.category === perm.category) {
        // Same category - later file takes precedence, update source info
        permissionsByPattern.set(perm.pattern, {
          ...perm,
          // Keep the id from the current file
        })
      } else {
        // Different category - this is a conflict
        // Track all sources for this conflict
        const sources = conflictSources.get(perm.pattern) ?? []

        // Add existing source if not already tracked
        if (existing.sourceFileId && !sources.some((s) => s.sourceFileId === existing.sourceFileId)) {
          sources.push({
            sourceFileId: existing.sourceFileId,
            sourceFileName: existing.sourceFileName ?? 'Unknown',
            category: existing.category,
            permissionId: existing.id,
          })
        }

        // Add current source
        if (!sources.some((s) => s.sourceFileId === perm.sourceFileId)) {
          sources.push({
            sourceFileId: perm.sourceFileId ?? sourceFile.id,
            sourceFileName: perm.sourceFileName ?? sourceFile.name,
            category: perm.category,
            permissionId: perm.id,
          })
        }

        conflictSources.set(perm.pattern, sources)

        // Later file wins by default (higher priority)
        permissionsByPattern.set(perm.pattern, {
          ...perm,
          conflictsWith: sources
            .filter((s) => s.sourceFileId !== perm.sourceFileId)
            .map((s) => s.permissionId),
        })
      }
    }

    // Process plugins
    const filePlugins = sourceFileToPlugins(sourceFile)
    for (const plugin of filePlugins) {
      // Later files override plugin enabled state
      pluginsById.set(plugin.id, plugin)
    }
  }

  // Build conflicts array
  const conflicts: MultiFileConflict[] = []
  for (const [pattern, sources] of conflictSources) {
    if (sources.length >= 2) {
      conflicts.push({
        id: generateConflictId(pattern),
        pattern,
        sources,
        resolved: false,
        resolvedSourceId: null,
      })
    }
  }

  return {
    permissions: Array.from(permissionsByPattern.values()),
    plugins: Array.from(pluginsById.values()),
    conflicts,
  }
}
