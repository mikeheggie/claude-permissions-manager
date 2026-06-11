/**
 * MergePreview Component
 *
 * Displays merged permissions and plugins from multiple source files.
 * Uses DiffOutputView for permissions (JSON-style view with inline actions)
 * and card-based display for plugins.
 */

import { useMemo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import type { Permission, Plugin, PermissionCategory } from '@/types/permissions'
import type { MultiFileConflict, MergeStats, SourceFile } from '@/types/multiFile'
import { DiffOutputView } from '@/components/DiffOutputView'
import { useDiffActions } from '@/hooks/useDiffActions'

export interface MergePreviewProps {
  /** Merged permissions from all sources */
  permissions: Permission[]

  /** Merged plugins from all sources */
  plugins: Plugin[]

  /** Detected conflicts */
  conflicts: MultiFileConflict[]

  /** Merge statistics */
  stats: MergeStats

  /** Set of excluded rule IDs */
  excludedRuleIds: Set<string>

  /** Source files for color/name mapping */
  sourceFiles?: SourceFile[]

  /** Called when a permission is excluded/removed */
  onExcludePermission: (permissionId: string) => void

  /** Called when a permission is re-included */
  onIncludePermission?: (permissionId: string) => void

  /** Called when a permission is re-categorized */
  onRecategorizePermission?: (permissionId: string, newCategory: PermissionCategory) => void

  /** Called when a plugin is excluded/removed */
  onExcludePlugin: (pluginId: string) => void

  /** Called when a plugin is re-included */
  onIncludePlugin?: (pluginId: string) => void

  /** Called when a conflict is resolved */
  onResolveConflict: (conflictId: string, chosenSourceId: string) => void

  /** Test ID for E2E testing */
  testId?: string
}

type TabType = 'permissions' | 'plugins'

interface PluginItemProps {
  plugin: Plugin
  isExcluded: boolean
  onExclude: () => void
  onInclude?: (() => void) | undefined
}

function PluginItem({ plugin, isExcluded, onExclude, onInclude }: PluginItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: isExcluded ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`
        group flex items-center gap-3 p-3 rounded-lg border transition-all
        ${isExcluded ? 'opacity-50 bg-bg-tertiary border-border' : 'bg-surface border-border hover:border-accent-primary/30'}
      `}
      data-testid={`plugin-item-${plugin.id}`}
    >
      {/* Enabled/Disabled Badge */}
      <span
        className={`
          flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded
          ${plugin.enabled
            ? 'bg-category-allow-dim text-category-allow'
            : 'bg-category-deny-dim text-category-deny'
          }
        `}
      >
        {plugin.enabled ? 'ON' : 'OFF'}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Plugin ID */}
        <div className={`font-mono text-sm break-all ${isExcluded ? 'line-through text-foreground-muted' : 'text-foreground'}`}>
          {plugin.id}
        </div>

        {/* Source Attribution */}
        {plugin.sourceFileName && (
          <div className="mt-1 text-xs text-foreground-muted flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{plugin.sourceFileName}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={isExcluded ? onInclude : onExclude}
        className={`
          flex-shrink-0 p-1.5 rounded-lg transition-all
          ${isExcluded
            ? 'text-foreground-muted hover:text-category-allow hover:bg-category-allow/10'
            : 'text-foreground-muted opacity-0 group-hover:opacity-100 hover:text-category-deny hover:bg-category-deny/10'
          }
        `}
        aria-label={isExcluded ? `Include ${plugin.id}` : `Remove ${plugin.id}`}
        title={isExcluded ? 'Restore this plugin' : 'Remove from output'}
      >
        {isExcluded ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    </motion.div>
  )
}

export function MergePreview({
  permissions,
  plugins,
  conflicts: _conflicts, // Reserved for future conflict-per-line display
  stats,
  excludedRuleIds,
  sourceFiles = [],
  onExcludePermission,
  onIncludePermission,
  onRecategorizePermission,
  onExcludePlugin,
  onIncludePlugin,
  onResolveConflict: _onResolveConflict, // Reserved for future conflict-per-line display
  testId = 'merge-preview',
}: MergePreviewProps) {
  // Note: conflicts and onResolveConflict are passed but not used since
  // DiffOutputView doesn't display per-line conflict resolution yet.
  // The stats.conflictCount is used to show a summary banner instead.
  void _conflicts
  void _onResolveConflict
  const [activeTab, setActiveTab] = useState<TabType>('permissions')

  // Prepare permissions with excluded flag for DiffOutputView
  const permissionsWithExcluded = useMemo(() => {
    return permissions.map((perm) => ({
      ...perm,
      excluded: excludedRuleIds.has(perm.id),
    }))
  }, [permissions, excludedRuleIds])

  // Use useDiffActions for local diff state management
  const diffActions = useDiffActions({
    initialPermissions: permissionsWithExcluded,
    onPermissionsChange: useCallback(
      (updatedPermissions: Permission[]) => {
        // Sync excluded state back to parent
        for (const perm of updatedPermissions) {
          const wasExcluded = excludedRuleIds.has(perm.id)
          const isNowExcluded = perm.excluded ?? false

          if (!wasExcluded && isNowExcluded) {
            onExcludePermission(perm.id)
          } else if (wasExcluded && !isNowExcluded && onIncludePermission) {
            onIncludePermission(perm.id)
          }
        }
      },
      [excludedRuleIds, onExcludePermission, onIncludePermission]
    ),
  })

  // Reset diff state when permissions change from parent
  useEffect(() => {
    diffActions.reset()
  // Only reset when permissions array reference changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions])

  // Build source file color and name maps
  const sourceFileColors = useMemo(() => {
    const colorMap = new Map<string, string>()
    for (const file of sourceFiles) {
      if (file.id) {
        // Use a consistent color based on file order or explicit color
        const colors = [
          '#3b82f6', // blue
          '#10b981', // emerald
          '#f59e0b', // amber
          '#ef4444', // red
          '#8b5cf6', // violet
          '#06b6d4', // cyan
          '#f97316', // orange
          '#ec4899', // pink
        ]
        colorMap.set(file.id, colors[file.order % colors.length] ?? '#6b7280')
      }
    }
    return colorMap
  }, [sourceFiles])

  const sourceFileNames = useMemo(() => {
    const nameMap = new Map<string, string>()
    for (const file of sourceFiles) {
      if (file.id) {
        nameMap.set(file.id, file.name)
      }
    }
    return nameMap
  }, [sourceFiles])

  // Handle delete permission
  const handleDeletePermission = useCallback(
    (permissionId: string) => {
      diffActions.deletePermission(permissionId)
      onExcludePermission(permissionId)
    },
    [diffActions, onExcludePermission]
  )

  // Handle re-categorize permission
  const handleRecategorizePermission = useCallback(
    (permissionId: string, newCategory: PermissionCategory) => {
      diffActions.recategorizePermission(permissionId, newCategory)
      onRecategorizePermission?.(permissionId, newCategory)
    },
    [diffActions, onRecategorizePermission]
  )

  // Handle undo
  const handleUndo = useCallback(() => {
    // Get last undo entry before undoing to sync with parent
    const lastEntry = diffActions.undoStack[diffActions.undoStack.length - 1]
    if (lastEntry) {
      if (lastEntry.type === 'DELETE' && onIncludePermission) {
        // Undoing a delete = re-include the permission
        onIncludePermission(lastEntry.permissionId)
      } else if (lastEntry.type === 'RECATEGORIZE' && onRecategorizePermission) {
        // Undoing a recategorize = restore previous category
        onRecategorizePermission(lastEntry.permissionId, lastEntry.previousState.category)
      }
    }
    diffActions.undo()
  }, [diffActions, onIncludePermission, onRecategorizePermission])

  // Keyboard shortcut for undo (Ctrl/Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        // Only handle if we have something to undo and permissions tab is active
        if (diffActions.canUndo && activeTab === 'permissions') {
          event.preventDefault()
          handleUndo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [diffActions.canUndo, activeTab, handleUndo])

  const isEmpty = permissions.length === 0 && plugins.length === 0

  return (
    <div
      className="flex flex-col h-full"
      data-testid={testId}
    >
      {/* Tabs - only show if we have plugins */}
      {plugins.length > 0 && (
        <div className="flex-shrink-0 flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`
              flex-1 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg
              ${activeTab === 'permissions'
                ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/5'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
              }
            `}
          >
            Permissions ({permissions.length})
          </button>
          <button
            onClick={() => setActiveTab('plugins')}
            className={`
              flex-1 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg
              ${activeTab === 'plugins'
                ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/5'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
              }
            `}
          >
            Plugins ({plugins.length})
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isEmpty ? (
          <div className="flex flex-col h-full rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground-muted">No files loaded yet</p>
              <p className="text-xs text-foreground-muted/70 mt-1">Upload settings.json files to see merged output</p>
            </div>
          </div>
        ) : activeTab === 'permissions' || plugins.length === 0 ? (
          /* DiffOutputView for permissions */
          <DiffOutputView
            permissions={diffActions.permissions}
            sourceFileColors={sourceFileColors}
            sourceFileNames={sourceFileNames}
            onDeletePermission={handleDeletePermission}
            onRecategorizePermission={handleRecategorizePermission}
            onUndo={handleUndo}
            canUndo={diffActions.canUndo}
            excludedCount={diffActions.excludedCount}
            modificationCount={diffActions.modificationCount}
            label="Merged Output"
            testId="diff-output-view"
          />
        ) : (
          /* Plugin list (unchanged) */
          <div className="flex flex-col h-full rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-bg-tertiary">
              <h2 className="text-sm font-semibold text-foreground">Plugins</h2>
              <div className="mt-1 text-xs text-foreground-muted">
                {plugins.length} plugin{plugins.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              <AnimatePresence>
                {plugins.map((plugin) => (
                  <PluginItem
                    key={plugin.id}
                    plugin={plugin}
                    isExcluded={excludedRuleIds.has(plugin.id)}
                    onExclude={() => onExcludePlugin(plugin.id)}
                    onInclude={onIncludePlugin ? () => onIncludePlugin(plugin.id) : undefined}
                  />
                ))}
              </AnimatePresence>
              {plugins.length === 0 && (
                <div className="text-center py-8 text-foreground-muted text-sm">
                  No plugins in merged files
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conflicts indicator (if any unresolved) */}
      {stats.conflictCount > 0 && activeTab === 'permissions' && (
        <div className="mt-4 p-3 rounded-lg bg-category-ask/10 border border-category-ask/20">
          <div className="flex items-center gap-2 text-sm text-category-ask">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">
              {stats.conflictCount} conflict{stats.conflictCount !== 1 ? 's' : ''} detected
            </span>
            <span className="text-foreground-muted text-xs">
              - the later file takes priority; re-categorize lines below to override
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
