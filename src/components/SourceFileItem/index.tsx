/**
 * SourceFileItem Component
 *
 * Displays a single source file with metadata, validation status,
 * and remove action. Used within SourceFileList.
 *
 */

import { motion } from 'framer-motion'

import type { SourceFile, ValidationStatus } from '@/types/multiFile'

export interface SourceFileItemProps {
  /** The source file to display */
  file: SourceFile

  /** Position indicator (e.g., "1 of 3") */
  position?: string

  /** Whether this file has the highest merge priority */
  isHighestPriority?: boolean

  /** Called when remove button is clicked */
  onRemove: () => void

  /** Called when view/expand is clicked */
  onView?: (() => void) | undefined

  /** Whether the item is being dragged */
  isDragging?: boolean

  /** Test ID for E2E testing */
  testId?: string
}

/**
 * Get status indicator styles and icon based on validation status.
 */
function getStatusStyles(status: ValidationStatus['status']): {
  bgColor: string
  textColor: string
  borderColor: string
  icon: React.ReactNode
} {
  switch (status) {
    case 'valid':
      return {
        bgColor: 'bg-category-allow-dim',
        textColor: 'text-category-allow',
        borderColor: 'border-category-allow-border',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
      }
    case 'invalid':
      return {
        bgColor: 'bg-category-deny-dim',
        textColor: 'text-category-deny',
        borderColor: 'border-category-deny-border',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      }
    case 'warning':
      return {
        bgColor: 'bg-category-ask-dim',
        textColor: 'text-category-ask',
        borderColor: 'border-category-ask-border',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ),
      }
  }
}

/**
 * Get input method icon.
 */
function InputMethodIcon({ method }: { method: 'file' | 'paste' }) {
  if (method === 'file') {
    return (
      <svg className="w-4 h-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    )
  }

  return (
    <svg className="w-4 h-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  )
}

/**
 * SourceFileItem displays a single uploaded/pasted source file.
 *
 * Features:
 * - File name with input method icon
 * - Permission and plugin counts
 * - Validation status indicator
 * - Remove button
 * - Drag handle visual affordance
 * - Position indicator
 * - Highest priority badge
 */
export function SourceFileItem({
  file,
  position,
  isHighestPriority = false,
  onRemove,
  onView,
  isDragging = false,
  testId = 'source-file-item',
}: SourceFileItemProps) {
  const statusStyles = getStatusStyles(file.validationStatus.status)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative flex items-center gap-3 p-3 rounded-lg border
        bg-surface transition-all cursor-grab active:cursor-grabbing
        ${isDragging ? 'shadow-lg ring-2 ring-accent-primary/50 bg-surface-hover' : 'border-border hover:border-accent-primary/30'}
        ${file.validationStatus.status === 'invalid' ? 'opacity-70' : ''}
      `}
      data-testid={testId}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity touch-none">
        <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Status Indicator */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${statusStyles.bgColor} ${statusStyles.textColor} ${statusStyles.borderColor} border
        `}
        title={
          file.validationStatus.status === 'valid'
            ? 'Valid JSON'
            : file.validationStatus.status === 'invalid'
              ? file.validationStatus.error?.message ?? 'Invalid JSON'
              : file.validationStatus.warnings.join(', ')
        }
      >
        {statusStyles.icon}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        {/* File Name Row */}
        <div className="flex items-center gap-2">
          <InputMethodIcon method={file.inputMethod} />
          <span className="text-sm font-medium text-foreground truncate" title={file.name}>
            {file.name}
          </span>
          {isHighestPriority && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              Highest Priority
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="mt-1 flex items-center gap-3 text-xs text-foreground-muted">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {file.permissionCount} permission{file.permissionCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            {file.pluginCount} plugin{file.pluginCount !== 1 ? 's' : ''}
          </span>
          {position && (
            <span className="text-foreground-muted/70">{position}</span>
          )}
        </div>

        {/* Error/Warning Message */}
        {file.validationStatus.status === 'invalid' && file.validationStatus.error && (
          <div className="mt-1.5 text-xs text-category-deny">
            {file.validationStatus.error.message}
          </div>
        )}
        {file.validationStatus.status === 'warning' && file.validationStatus.warnings.length > 0 && (
          <div className="mt-1.5 text-xs text-category-ask">
            {file.validationStatus.warnings[0]}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {/* View Button (optional) */}
        {onView && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            className="p-1.5 rounded-lg text-foreground-muted opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-surface-hover transition-all"
            aria-label={`View ${file.name}`}
            title="View file contents"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="p-1.5 rounded-lg text-foreground-muted opacity-0 group-hover:opacity-100 hover:text-category-deny hover:bg-category-deny/10 transition-all"
          aria-label={`Remove ${file.name}`}
          title="Remove file"
          data-testid={`${testId}-remove`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
