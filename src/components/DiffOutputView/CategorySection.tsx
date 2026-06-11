/**
 * CategorySection Component
 *
 * Renders a JSON array section for a permission category (allow/deny/ask).
 * Includes the array opening bracket, permission lines, and closing bracket.
 */

import { memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Permission, PermissionCategory } from '@/types/permissions'
import { DiffLine } from './DiffLine'

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Sub-components
// =============================================================================

interface JsonLineProps {
  lineNumber: number
  children: React.ReactNode
  className?: string
}

function JsonLine({ lineNumber, children, className = '' }: JsonLineProps) {
  return (
    <div className={`diff-line flex items-center ${className}`}>
      {/* Line Number Gutter */}
      <div className="flex-shrink-0 w-10 text-right pr-2 text-json-line-number text-xs font-mono select-none">
        {lineNumber}
      </div>

      {/* Empty border space (for alignment with permission lines) */}
      <div className="flex-shrink-0 w-1" />

      {/* Content */}
      <div className="flex-1 pl-2 pr-2 font-mono text-sm">{children}</div>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

function CategorySectionComponent({
  category,
  permissions,
  startLineNumber,
  isLastSection,
  onDelete,
  onRecategorize,
  sourceFileColors,
  sourceFileNames,
  activeDropdownId,
  onDropdownToggle,
}: CategorySectionProps) {
  const closingComma = isLastSection ? '' : ','
  const isEmpty = permissions.length === 0

  // Empty section - single line
  if (isEmpty) {
    return (
      <JsonLine lineNumber={startLineNumber}>
        <span className="whitespace-pre">{'    '}</span>
        <span className="text-json-key">"{category}"</span>
        <span className="text-json-punctuation">: []</span>
        <span className="text-json-punctuation">{closingComma}</span>
      </JsonLine>
    )
  }

  // Section with items
  let currentLine = startLineNumber

  return (
    <div data-testid={`category-section-${category}`}>
      {/* Array Opening: "category": [ */}
      <JsonLine lineNumber={currentLine++}>
        <span className="whitespace-pre">{'    '}</span>
        <span className="text-json-key">"{category}"</span>
        <span className="text-json-punctuation">: [</span>
      </JsonLine>

      {/* Permission Items */}
      <AnimatePresence mode="popLayout">
        {permissions.map((permission, index) => {
          const lineNum = currentLine++
          const isLast = index === permissions.length - 1
          const sourceColor = permission.sourceFileId
            ? sourceFileColors.get(permission.sourceFileId)
            : undefined
          const sourceFileName = permission.sourceFileId
            ? sourceFileNames.get(permission.sourceFileId)
            : undefined

          return (
            <DiffLine
              key={permission.id}
              permission={permission}
              lineNumber={lineNum}
              isLastInSection={isLast}
              onDelete={onDelete}
              onRecategorize={onRecategorize}
              sourceColor={sourceColor}
              sourceFileName={sourceFileName}
              isDropdownOpen={activeDropdownId === permission.id}
              onDropdownToggle={onDropdownToggle}
            />
          )
        })}
      </AnimatePresence>

      {/* Array Closing: ] or ], */}
      <JsonLine lineNumber={startLineNumber + permissions.length + 1}>
        <span className="whitespace-pre">{'    '}</span>
        <span className="text-json-punctuation">]{closingComma}</span>
      </JsonLine>
    </div>
  )
}

// Memoize for performance
export const CategorySection = memo(CategorySectionComponent, (prevProps, nextProps) => {
  // Deep comparison would be expensive, so we compare references and key values
  if (prevProps.category !== nextProps.category) return false
  if (prevProps.startLineNumber !== nextProps.startLineNumber) return false
  if (prevProps.isLastSection !== nextProps.isLastSection) return false
  if (prevProps.activeDropdownId !== nextProps.activeDropdownId) return false
  if (prevProps.permissions.length !== nextProps.permissions.length) return false
  if (prevProps.permissions !== nextProps.permissions) {
    // Check if any permission changed
    for (let i = 0; i < prevProps.permissions.length; i++) {
      const prev = prevProps.permissions[i]
      const next = nextProps.permissions[i]
      if (!prev || !next) return false
      if (
        prev.id !== next.id ||
        prev.pattern !== next.pattern ||
        prev.category !== next.category ||
        prev.excluded !== next.excluded ||
        prev.sourceFileId !== next.sourceFileId
      ) {
        return false
      }
    }
  }
  return true
})
