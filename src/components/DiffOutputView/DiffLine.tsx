/**
 * DiffLine Component
 *
 * Renders a single permission line within the diff output view.
 * Displays the permission pattern with JSON syntax and provides
 * hover-activated action buttons for delete and re-categorize.
 */

import { useState, useCallback, memo, forwardRef } from 'react'
import { motion } from 'framer-motion'
import type { Permission, PermissionCategory } from '@/types/permissions'
import { LineActions } from './LineActions'
import { formatPattern } from './helpers'

// =============================================================================
// Types
// =============================================================================

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
  onDropdownToggle?: (permissionId: string | null) => void
}

// =============================================================================
// Component
// =============================================================================

const DiffLineComponent = forwardRef<HTMLDivElement, DiffLineProps>(function DiffLineComponent(
  {
    permission,
    lineNumber,
    isLastInSection,
    onDelete,
    onRecategorize,
    sourceColor,
    sourceFileName,
    isDropdownOpen = false,
    onDropdownToggle,
  },
  ref
) {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleDelete = useCallback(() => {
    onDelete(permission.id)
  }, [onDelete, permission.id])

  const handleRecategorize = useCallback(
    (newCategory: PermissionCategory) => {
      onRecategorize(permission.id, newCategory)
    },
    [onRecategorize, permission.id]
  )

  const handleDropdownToggle = useCallback(
    (isOpen: boolean) => {
      onDropdownToggle?.(isOpen ? permission.id : null)
    },
    [onDropdownToggle, permission.id]
  )

  const formattedPattern = formatPattern(permission.pattern)
  const trailingComma = isLastInSection ? '' : ','

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 24 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className={`group diff-line relative flex items-center hover:bg-bg-tertiary/50 focus-within:bg-bg-tertiary/50 transition-colors ${isDropdownOpen ? 'z-[100]' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      data-testid={`diff-line-${permission.id}`}
    >
      {/* Line Number Gutter */}
      <div className="flex-shrink-0 w-10 text-right pr-2 text-json-line-number text-xs font-mono select-none">
        {lineNumber}
      </div>

      {/* Source Color Border */}
      <div
        className="flex-shrink-0 w-1 h-full self-stretch"
        style={{ backgroundColor: sourceColor || 'transparent' }}
        title={sourceFileName}
      />

      {/* Content */}
      <div className="flex-1 flex items-center min-w-0 pl-2 pr-2">
        {/* Indentation (2 levels: permissions object + category array) */}
        <span className="text-transparent select-none whitespace-pre font-mono text-sm">
          {'      '}
        </span>

        {/* JSON Pattern */}
        <span
          className="text-json-string font-mono text-sm truncate"
          title={permission.pattern}
        >
          {formattedPattern}
        </span>

        {/* Trailing comma */}
        <span className="text-json-punctuation font-mono text-sm">
          {trailingComma}
        </span>
      </div>

      {/* Actions - positioned at fixed location aligned with rule start */}
      <div
        className={`
          absolute left-[calc(1.75rem+0.25rem+0.5rem+6ch)] top-1/2 -translate-y-1/2 bg-bg-secondary rounded px-1 border border-border
          transition-opacity duration-150
          ${isHovered || isDropdownOpen ? 'opacity-100' : 'opacity-0'}
          ${!isHovered && !isDropdownOpen ? 'pointer-events-none' : ''}
          group-focus-within:opacity-100 group-focus-within:pointer-events-auto
          ${isDropdownOpen ? 'z-[100]' : ''}
        `}
      >
        <LineActions
          permissionId={permission.id}
          currentCategory={permission.category}
          onDelete={handleDelete}
          onRecategorize={handleRecategorize}
          isDropdownOpen={isDropdownOpen}
          onDropdownToggle={handleDropdownToggle}
        />
      </div>
    </motion.div>
  )
})

// Memoize with custom comparison for performance
export const DiffLine = memo(DiffLineComponent, (prevProps, nextProps) => {
  return (
    prevProps.permission.id === nextProps.permission.id &&
    prevProps.permission.pattern === nextProps.permission.pattern &&
    prevProps.permission.category === nextProps.permission.category &&
    prevProps.permission.excluded === nextProps.permission.excluded &&
    prevProps.lineNumber === nextProps.lineNumber &&
    prevProps.isLastInSection === nextProps.isLastInSection &&
    prevProps.sourceColor === nextProps.sourceColor &&
    prevProps.sourceFileName === nextProps.sourceFileName &&
    prevProps.isDropdownOpen === nextProps.isDropdownOpen
  )
})
