/**
 * PasteInput Component
 *
 * Collapsible paste input component for pasting JSON settings content.
 * Provides an alternative to file upload for users who prefer copy/paste.
 *
 */

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { useFileUpload, type ProcessFileResult } from '@/hooks/useFileUpload'
import type { SourceFile } from '@/types/multiFile'

export interface PasteInputProps {
  /** Called when pasted content is successfully processed */
  onPasteProcessed: (file: SourceFile) => void

  /** Called when a duplicate is detected */
  onDuplicateDetected?: (contentName: string, existingFileName: string) => void

  /** Existing files for duplicate detection */
  existingFiles?: SourceFile[]

  /** Whether the component is disabled */
  disabled?: boolean

  /** Placeholder text for the textarea */
  placeholder?: string

  /** Test ID for E2E testing */
  testId?: string
}

interface PasteFeedback {
  type: 'error' | 'warning' | 'success'
  message: string
}

/**
 * PasteInput provides a collapsible paste input area for JSON settings.
 *
 * Features:
 * - Collapsible "Or paste JSON" section
 * - Integrates with useFileUpload hook's processPaste function
 * - Duplicate detection with warning message
 * - Real-time JSON validation feedback
 * - Keyboard accessible (Enter/Space to toggle, Tab to navigate)
 *
 * Usage:
 * ```tsx
 * <PasteInput
 *   onPasteProcessed={(file) => addSourceFile(file)}
 *   existingFiles={sourceFiles}
 *   onDuplicateDetected={(name, existing) => showWarning(`Duplicate of ${existing}`)}
 * />
 * ```
 */
export function PasteInput({
  onPasteProcessed,
  onDuplicateDetected,
  existingFiles = [],
  disabled = false,
  placeholder = 'Paste your settings.json content here...',
  testId = 'paste-input',
}: PasteInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState<PasteFeedback | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { processPaste, isProcessing } = useFileUpload()

  /**
   * Toggle the collapsed/expanded state
   */
  const toggleExpanded = useCallback(() => {
    if (disabled) return
    setIsExpanded((prev) => !prev)
  }, [disabled])

  /**
   * Handle keyboard interaction for toggle button
   */
  const handleToggleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleExpanded()
      }
    },
    [toggleExpanded]
  )

  /**
   * Handle content change in textarea
   */
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value)
      // Clear feedback when user starts typing
      if (feedback) {
        setFeedback(null)
      }
    },
    [feedback]
  )

  /**
   * Process the pasted content and create a SourceFile
   */
  const handleProcessPaste = useCallback(async () => {
    if (!content.trim() || isProcessing) return

    setFeedback(null)

    try {
      // Generate a name based on timestamp
      const name = `Pasted ${new Date().toLocaleTimeString()}`

      // Process the pasted content using the hook
      const result: ProcessFileResult = await processPaste(content, name, existingFiles)

      // Check for duplicates
      if (result.isDuplicate) {
        onDuplicateDetected?.(name, result.duplicateOf ?? 'existing file')
        setFeedback({
          type: 'warning',
          message: `Content is identical to "${result.duplicateOf ?? 'existing file'}"`,
        })
        return
      }

      // Check validation status
      const { validationStatus } = result.sourceFile
      if (validationStatus.status === 'invalid') {
        setFeedback({
          type: 'error',
          message: validationStatus.error?.message ?? 'Invalid JSON content',
        })
        return
      }

      if (validationStatus.status === 'warning') {
        setFeedback({
          type: 'warning',
          message: validationStatus.warnings[0] ?? 'Content has no permissions',
        })
      }

      // Process succeeded - notify parent and clear
      onPasteProcessed(result.sourceFile)
      setContent('')
      setFeedback({
        type: 'success',
        message: 'Content added successfully',
      })

      // Clear success message after 3 seconds
      setTimeout(() => {
        setFeedback((current) => (current?.type === 'success' ? null : current))
      }, 3000)
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to process content',
      })
    }
  }, [content, isProcessing, processPaste, existingFiles, onPasteProcessed, onDuplicateDetected])

  /**
   * Handle keyboard shortcut to process (Cmd/Ctrl + Enter)
   */
  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleProcessPaste()
      }
    },
    [handleProcessPaste]
  )

  /**
   * Clear the textarea content
   */
  const handleClear = useCallback(() => {
    setContent('')
    setFeedback(null)
    textareaRef.current?.focus()
  }, [])

  return (
    <div className="w-full" data-testid={testId}>
      {/* Collapsible Toggle Header */}
      <button
        type="button"
        onClick={toggleExpanded}
        onKeyDown={handleToggleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3
          rounded-lg border border-border bg-surface
          transition-all duration-200
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-surface-hover hover:border-accent-primary/30 cursor-pointer'
          }
          ${isExpanded ? 'rounded-b-none border-b-0' : ''}
        `}
        aria-expanded={isExpanded}
        aria-controls={`${testId}-content`}
        data-testid={`${testId}-toggle`}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground-muted">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Or paste JSON
        </span>
        <motion.svg
          className="w-4 h-4 text-foreground-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Collapsible Content Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={`${testId}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border border-t-0 border-border rounded-b-lg bg-surface p-4 space-y-3">
              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleTextareaKeyDown}
                  disabled={disabled || isProcessing}
                  placeholder={placeholder}
                  className={`
                    w-full min-h-[160px] px-3 py-2
                    font-mono text-sm text-foreground
                    bg-bg-tertiary border border-border rounded-lg
                    placeholder:text-foreground-muted/50
                    focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary
                    resize-y transition-all
                    ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  aria-label="Paste JSON content"
                  data-testid={`${testId}-textarea`}
                />

                {/* Clear button (when content exists) */}
                {content && !isProcessing && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-foreground-muted hover:text-foreground transition-colors"
                    aria-label="Clear content"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">
                  Press <kbd className="px-1.5 py-0.5 bg-bg-secondary rounded border border-border text-foreground-muted">⌘</kbd>+<kbd className="px-1.5 py-0.5 bg-bg-secondary rounded border border-border text-foreground-muted">Enter</kbd> to add
                </span>

                <button
                  type="button"
                  onClick={handleProcessPaste}
                  disabled={!content.trim() || isProcessing || disabled}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg
                    transition-all duration-200
                    ${content.trim() && !isProcessing && !disabled
                      ? 'bg-accent-primary text-white hover:bg-accent-primary-hover shadow-sm'
                      : 'bg-bg-tertiary text-foreground-muted cursor-not-allowed'
                    }
                  `}
                  data-testid={`${testId}-add-button`}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Processing...
                    </span>
                  ) : (
                    'Add Content'
                  )}
                </button>
              </div>

              {/* Feedback Message */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={`
                      flex items-start gap-2 px-3 py-2 rounded-lg text-sm
                      ${feedback.type === 'error'
                        ? 'bg-category-deny-dim text-category-deny'
                        : feedback.type === 'warning'
                          ? 'bg-category-ask-dim text-category-ask'
                          : 'bg-category-allow-dim text-category-allow'
                      }
                    `}
                    role={feedback.type === 'error' ? 'alert' : 'status'}
                    data-testid={`${testId}-feedback`}
                  >
                    {feedback.type === 'error' ? (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : feedback.type === 'warning' ? (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span>{feedback.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
