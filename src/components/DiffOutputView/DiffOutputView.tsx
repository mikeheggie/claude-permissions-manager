/**
 * DiffOutputView Component
 *
 * Main component that renders the diff-style JSON output view.
 * Replaces the card-based MergePreview display with a compact,
 * single-line-per-rule JSON representation.
 */

import { useMemo, useState, useCallback } from 'react'
import type { Permission } from '@/types/permissions'
import type { DiffOutputViewProps } from '@/types/diffOutput'
import { CategorySection } from './CategorySection'
import { getCategorySectionLineCount } from './helpers'

// =============================================================================
// Sub-components
// =============================================================================

interface JsonLineProps {
  lineNumber: number
  children: React.ReactNode
}

function JsonLine({ lineNumber, children }: JsonLineProps) {
  return (
    <div className="diff-line flex items-center">
      {/* Line Number Gutter */}
      <div className="flex-shrink-0 w-10 text-right pr-2 text-json-line-number text-xs font-mono select-none">
        {lineNumber}
      </div>

      {/* Empty border space (for alignment) */}
      <div className="flex-shrink-0 w-1" />

      {/* Content */}
      <div className="flex-1 pl-2 pr-2 font-mono text-sm">{children}</div>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function DiffOutputView({
  permissions,
  sourceFileColors,
  sourceFileNames,
  onDeletePermission,
  onRecategorizePermission,
  onUndo,
  canUndo,
  excludedCount = 0,
  modificationCount = 0,
  label = 'Merged Output',
  testId = 'diff-output-view',
}: DiffOutputViewProps) {
  // Manage active dropdown state locally
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)

  const handleDropdownToggle = useCallback((permissionId: string | null) => {
    setActiveDropdownId(permissionId)
  }, [])

  // Group permissions by category (excluding excluded ones)
  const groupedPermissions = useMemo(() => {
    const groups: { allow: Permission[]; deny: Permission[]; ask: Permission[] } = {
      allow: [],
      deny: [],
      ask: [],
    }

    for (const permission of permissions) {
      if (!permission.excluded) {
        groups[permission.category].push(permission)
      }
    }

    // Sort each group alphabetically
    groups.allow.sort((a, b) => a.pattern.localeCompare(b.pattern))
    groups.deny.sort((a, b) => a.pattern.localeCompare(b.pattern))
    groups.ask.sort((a, b) => a.pattern.localeCompare(b.pattern))

    return groups
  }, [permissions])

  // Calculate line numbers for each section
  const lineNumbers = useMemo(() => {
    let line = 1 // Opening {
    line++ // "permissions": {

    const allowStart = line + 1
    line += getCategorySectionLineCount(groupedPermissions.allow.length)

    const denyStart = line + 1
    line += getCategorySectionLineCount(groupedPermissions.deny.length)

    const askStart = line + 1
    line += getCategorySectionLineCount(groupedPermissions.ask.length)

    line++ // Closing }
    line++ // Closing }

    return {
      total: line,
      allowStart,
      denyStart,
      askStart,
    }
  }, [groupedPermissions])

  const visibleCount =
    groupedPermissions.allow.length +
    groupedPermissions.deny.length +
    groupedPermissions.ask.length

  const isEmpty = visibleCount === 0

  return (
    <div
      className="flex flex-col h-full rounded-xl border border-border bg-surface overflow-hidden shadow-sm"
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-bg-tertiary">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{label}</h2>
          <div className="flex items-center gap-2">
            {modificationCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent-primary/10 text-accent-primary">
                {modificationCount} change{modificationCount !== 1 ? 's' : ''}
              </span>
            )}
            {excludedCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-foreground-muted/10 text-foreground-muted">
                {excludedCount} removed
              </span>
            )}
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`
                px-2 py-1 text-xs font-medium rounded-lg transition-colors
                flex items-center gap-1
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1
                ${canUndo
                  ? 'text-foreground-secondary hover:bg-bg-tertiary hover:text-foreground'
                  : 'text-foreground-muted/50 cursor-not-allowed'
                }
              `}
              aria-label="Undo last action"
              title={canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              Undo
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-2 flex items-center gap-4 text-xs text-foreground-muted">
          <span>{visibleCount} permission{visibleCount !== 1 ? 's' : ''}</span>
          <span>{lineNumbers.total} lines</span>
        </div>
      </div>

      {/* JSON Content */}
      <div className="flex-1 overflow-auto py-2 bg-bg-secondary">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-foreground-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground-muted">No permissions to display</p>
            <p className="text-xs text-foreground-muted/70 mt-1">
              {excludedCount > 0
                ? `All ${excludedCount} permission${excludedCount !== 1 ? 's have' : ' has'} been removed`
                : 'Load files or paste JSON to see permissions'}
            </p>
          </div>
        ) : (
          <div className="min-w-max">
            {/* Opening { */}
            <JsonLine lineNumber={1}>
              <span className="text-json-punctuation">{'{'}</span>
            </JsonLine>

            {/* "permissions": { */}
            <JsonLine lineNumber={2}>
              <span className="whitespace-pre">{'  '}</span>
              <span className="text-json-key">"permissions"</span>
              <span className="text-json-punctuation">{': {'}</span>
            </JsonLine>

            {/* Allow Section */}
            <CategorySection
              category="allow"
              permissions={groupedPermissions.allow}
              startLineNumber={lineNumbers.allowStart}
              isLastSection={false}
              onDelete={onDeletePermission}
              onRecategorize={onRecategorizePermission}
              sourceFileColors={sourceFileColors}
              sourceFileNames={sourceFileNames}
              activeDropdownId={activeDropdownId}
              onDropdownToggle={handleDropdownToggle}
            />

            {/* Deny Section */}
            <CategorySection
              category="deny"
              permissions={groupedPermissions.deny}
              startLineNumber={lineNumbers.denyStart}
              isLastSection={false}
              onDelete={onDeletePermission}
              onRecategorize={onRecategorizePermission}
              sourceFileColors={sourceFileColors}
              sourceFileNames={sourceFileNames}
              activeDropdownId={activeDropdownId}
              onDropdownToggle={handleDropdownToggle}
            />

            {/* Ask Section */}
            <CategorySection
              category="ask"
              permissions={groupedPermissions.ask}
              startLineNumber={lineNumbers.askStart}
              isLastSection={true}
              onDelete={onDeletePermission}
              onRecategorize={onRecategorizePermission}
              sourceFileColors={sourceFileColors}
              sourceFileNames={sourceFileNames}
              activeDropdownId={activeDropdownId}
              onDropdownToggle={handleDropdownToggle}
            />

            {/* Closing } for permissions */}
            <JsonLine lineNumber={lineNumbers.total - 1}>
              <span className="whitespace-pre">{'  '}</span>
              <span className="text-json-punctuation">{'}'}</span>
            </JsonLine>

            {/* Closing } for root */}
            <JsonLine lineNumber={lineNumbers.total}>
              <span className="text-json-punctuation">{'}'}</span>
            </JsonLine>
          </div>
        )}
      </div>
    </div>
  )
}
