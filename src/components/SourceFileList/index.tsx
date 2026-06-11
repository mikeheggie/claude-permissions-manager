/**
 * SourceFileList Component
 *
 * Displays a reorderable list of source files with drag-and-drop support.
 * Uses Framer Motion Reorder for smooth drag animations.
 *
 */

import { useCallback, useRef, KeyboardEvent } from 'react'
import { Reorder, AnimatePresence } from 'framer-motion'

import type { SourceFile } from '@/types/multiFile'
import { SourceFileItem } from '@/components/SourceFileItem'

export interface SourceFileListProps {
  /** Array of source files to display */
  files: SourceFile[]

  /** Called when files are reordered */
  onReorder: (orderedIds: string[]) => void

  /** Called when a file is removed */
  onRemove: (fileId: string) => void

  /** Called when user wants to view file details */
  onViewFile?: (fileId: string) => void

  /** Test ID for E2E testing */
  testId?: string
}

/**
 * SourceFileList displays all uploaded source files in a reorderable list.
 *
 * Features:
 * - Drag-and-drop reordering with Framer Motion Reorder
 * - Priority order hint showing merge priority
 * - Keyboard accessibility for reorder with up/down arrows
 * - File count summary header
 * - Empty state when no files
 *
 * Merge Priority:
 * - Files at the bottom have the highest priority
 * - When conflicts occur, the higher priority file's value wins by default
 *
 * Keyboard Controls:
 * - Up Arrow: Move focused file up in the list (lower priority)
 * - Down Arrow: Move focused file down in the list (higher priority)
 * - Focus is maintained on the moved item
 */
export function SourceFileList({
  files,
  onReorder,
  onRemove,
  onViewFile,
  testId = 'source-file-list',
}: SourceFileListProps) {
  // Refs for keyboard navigation
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Handle reorder - Framer Motion Reorder gives us the new order as SourceFile[]
  const handleReorder = useCallback(
    (newOrder: SourceFile[]) => {
      const orderedIds = newOrder.map((f) => f.id)
      onReorder(orderedIds)
    },
    [onReorder]
  )

  // Handle keyboard navigation for reordering
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, fileId: string, currentIndex: number) => {
      // Only handle arrow keys
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        return
      }

      // Prevent default scrolling behavior
      e.preventDefault()

      const newIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1

      // Check bounds
      if (newIndex < 0 || newIndex >= files.length) {
        return
      }

      // Create new order by swapping
      const newOrder = [...files]
      const temp = newOrder[currentIndex]
      newOrder[currentIndex] = newOrder[newIndex] as SourceFile
      newOrder[newIndex] = temp as SourceFile

      // Trigger reorder
      onReorder(newOrder.map((f) => f.id))

      // Maintain focus on the moved item after the DOM updates
      requestAnimationFrame(() => {
        const itemRef = itemRefs.current.get(fileId)
        if (itemRef) {
          itemRef.focus()
        }
      })
    },
    [files, onReorder]
  )

  // Store ref for an item
  const setItemRef = useCallback((fileId: string, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(fileId, el)
    } else {
      itemRefs.current.delete(fileId)
    }
  }, [])

  // Count valid files
  const validFileCount = files.filter((f) => f.validationStatus.status !== 'invalid').length

  // Empty state
  if (files.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-testid={testId}
      >
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground-muted">No files uploaded yet</p>
        <p className="text-xs text-foreground-muted/70 mt-1">
          Drag and drop settings.json files or click to browse
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid={testId}>
      {/* Header with file count */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Source Files ({files.length})
        </h3>
        {validFileCount > 0 && validFileCount !== files.length && (
          <span className="text-xs text-foreground-muted">
            {validFileCount} valid
          </span>
        )}
      </div>

      {/* Priority Hint */}
      <div className="flex items-center gap-2 px-1 py-2 text-xs text-foreground-muted bg-bg-tertiary/50 rounded-lg">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Drag or use <kbd className="px-1.5 py-0.5 bg-bg-secondary rounded border border-border text-foreground-muted">↑</kbd> / <kbd className="px-1.5 py-0.5 bg-bg-secondary rounded border border-border text-foreground-muted">↓</kbd> to reorder. <strong className="text-foreground">Bottom = highest priority</strong> (wins conflicts)
        </span>
      </div>

      {/* Reorderable File List */}
      <Reorder.Group
        axis="y"
        values={files}
        onReorder={handleReorder}
        className="space-y-2"
        role="listbox"
        aria-label="Source files list - use up/down arrows to reorder"
      >
        <AnimatePresence initial={false}>
          {files.map((file, index) => {
            const isLast = index === files.length - 1
            const position = `${index + 1} of ${files.length}`

            return (
              <Reorder.Item
                key={file.id}
                value={file}
                className="list-none outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-lg"
                tabIndex={0}
                role="option"
                aria-selected={false}
                aria-label={`${file.name}, ${position}, ${isLast && files.length > 1 ? 'highest priority' : ''}`}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, file.id, index)}
                ref={(el: HTMLLIElement | null) => setItemRef(file.id, el as unknown as HTMLDivElement | null)}
              >
                <SourceFileItem
                  file={file}
                  position={position}
                  isHighestPriority={isLast && files.length > 1}
                  onRemove={() => onRemove(file.id)}
                  onView={onViewFile ? () => onViewFile(file.id) : undefined}
                  testId={`source-file-item-${file.id}`}
                />
              </Reorder.Item>
            )
          })}
        </AnimatePresence>
      </Reorder.Group>

      {/* Bottom hint for long lists */}
      {files.length > 3 && (
        <div className="text-center text-xs text-foreground-muted pt-2">
          <span className="inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Higher priority
          </span>
        </div>
      )}
    </div>
  )
}
