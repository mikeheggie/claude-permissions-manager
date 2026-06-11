/**
 * FileUpload Component
 *
 * Drop zone and file input component for uploading settings.json files.
 * Supports drag-and-drop and click-to-browse with visual feedback.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { useDropZone } from '@/hooks/useDropZone'
import { useFileUpload } from '@/hooks/useFileUpload'
import type { SourceFile, ValidationStatus } from '@/types/multiFile'
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '@/utils/fileUtils'

export interface FileUploadProps {
  /** Called when files are successfully processed */
  onFilesSelected: (files: SourceFile[]) => void

  /** Called when a duplicate file is detected */
  onDuplicateDetected?: (fileName: string, existingFileName: string) => void

  /** Existing files for duplicate detection */
  existingFiles?: SourceFile[]

  /** Whether the upload zone is disabled */
  disabled?: boolean

  /** Whether multiple files can be uploaded at once */
  multiple?: boolean

  /** Accepted file types (default: .json) */
  accept?: string

  /** Maximum file size in bytes (default: 1MB) */
  maxFileSize?: number

  /** Test ID for E2E testing */
  testId?: string
}

interface UploadFeedback {
  type: 'error' | 'warning' | 'success'
  message: string
  fileName?: string
}

/**
 * Get a user-friendly message for validation status.
 */
function getValidationMessage(status: ValidationStatus, fileName: string): UploadFeedback | null {
  switch (status.status) {
    case 'invalid':
      return {
        type: 'error',
        message: status.error?.message ?? 'Invalid JSON file',
        fileName,
      }
    case 'warning':
      return {
        type: 'warning',
        message: status.warnings[0] ?? 'File contains no permissions',
        fileName,
      }
    default:
      return null
  }
}

export function FileUpload({
  onFilesSelected,
  onDuplicateDetected,
  existingFiles = [],
  disabled = false,
  multiple = true,
  accept = ACCEPTED_FILE_TYPES,
  maxFileSize = MAX_FILE_SIZE,
  testId = 'file-upload',
}: FileUploadProps) {
  const [feedback, setFeedback] = useState<UploadFeedback | null>(null)
  const { processFile, isProcessing, error: uploadError } = useFileUpload()

  /**
   * Handle dropped or selected files.
   */
  const handleFiles = useCallback(
    async (files: File[]) => {
      setFeedback(null)
      const processedFiles: SourceFile[] = []
      let feedbackShown = false

      for (const file of files) {
        try {
          // Check file size first
          if (file.size > maxFileSize) {
            setFeedback({
              type: 'error',
              message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (1MB)`,
              fileName: file.name,
            })
            feedbackShown = true
            continue
          }

          // Process the file with duplicate detection
          const result = await processFile(file, existingFiles)

          // Check for duplicates
          if (result.isDuplicate) {
            onDuplicateDetected?.(file.name, result.duplicateOf ?? 'existing file')
            setFeedback({
              type: 'warning',
              message: `File has identical content to "${result.duplicateOf ?? 'existing file'}"`,
              fileName: file.name,
            })
            feedbackShown = true
            continue
          }

          // Check validation status and show feedback
          const validationFeedback = getValidationMessage(result.sourceFile.validationStatus, file.name)
          if (validationFeedback) {
            setFeedback(validationFeedback)
            feedbackShown = true
          }

          // Add the file regardless of validation status (user can see and manage it)
          processedFiles.push(result.sourceFile)
        } catch (err) {
          setFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to process file',
            fileName: file.name,
          })
          feedbackShown = true
        }
      }

      if (processedFiles.length > 0) {
        onFilesSelected(processedFiles)

        // Show success feedback if no errors/warnings
        if (!feedbackShown) {
          setFeedback({
            type: 'success',
            message: processedFiles.length === 1
              ? `Loaded "${processedFiles[0]?.name}"`
              : `Loaded ${processedFiles.length} files`,
          })

          // Clear success message after 3 seconds
          setTimeout(() => {
            setFeedback((current) => (current?.type === 'success' ? null : current))
          }, 3000)
        }
      }
    },
    [processFile, existingFiles, maxFileSize, onFilesSelected, onDuplicateDetected]
  )

  const { isDragging, dropZoneProps, inputRef, inputProps, openFileDialog } = useDropZone({
    onDrop: handleFiles,
    disabled: disabled || isProcessing,
    accept,
    multiple,
  })

  /**
   * Clear feedback message.
   */
  const clearFeedback = useCallback(() => {
    setFeedback(null)
  }, [])

  return (
    <div className="w-full" data-testid={testId}>
      {/* Drop Zone */}
      <div
        {...dropZoneProps}
        onClick={openFileDialog}
        className={`
          relative flex flex-col items-center justify-center
          min-h-[160px] p-6
          border-2 border-dashed rounded-xl
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-accent-primary bg-accent-primary/5 scale-[1.02]'
            : 'border-border hover:border-accent-primary/50 hover:bg-surface-hover'
          }
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        role="button"
        tabIndex={disabled || isProcessing ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openFileDialog()
          }
        }}
        aria-label="Upload files"
        aria-disabled={disabled || isProcessing}
        data-testid={`${testId}-dropzone`}
      >
        {/* Hidden file input */}
        <input ref={inputRef} {...inputProps} data-testid={`${testId}-input`} />

        {/* Loading State */}
        {isProcessing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Loading Spinner */}
            <div className="relative w-12 h-12">
              <motion.div
                className="absolute inset-0 border-4 border-accent-primary/20 rounded-full"
              />
              <motion.div
                className="absolute inset-0 border-4 border-transparent border-t-accent-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <span className="text-sm font-medium text-foreground-muted">Processing file...</span>
          </motion.div>
        ) : isDragging ? (
          /* Dragging State */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center">
              <motion.svg
                className="w-6 h-6 text-accent-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </motion.svg>
            </div>
            <span className="text-sm font-semibold text-accent-primary">Drop files here</span>
          </motion.div>
        ) : (
          /* Default State */
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
              <svg
                className="w-6 h-6 text-foreground-muted"
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
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Drop settings.json {multiple ? 'files' : 'file'} here
              </p>
              <p className="text-xs text-foreground-muted">
                or <span className="text-accent-primary font-medium">click to browse</span>
              </p>
            </div>
            <p className="text-xs text-foreground-muted/70">
              JSON files only, max 1MB each
            </p>
            {/* Hidden files tip */}
            <div className="mt-4 w-full">
              <div className="w-full bg-white/[0.03] rounded-lg px-4 py-3">
                <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>To show hidden files (like .claude), press</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <kbd className="flex flex-col items-center justify-center min-w-[60px] px-3 py-2 bg-bg-tertiary rounded-lg text-foreground-muted font-medium">
                    <span className="text-lg leading-none">⌘</span>
                    <span className="text-[10px] mt-1">command</span>
                  </kbd>
                  <span className="text-foreground-muted/60 text-sm">+</span>
                  <kbd className="flex flex-col items-center justify-center min-w-[60px] px-3 py-2 bg-bg-tertiary rounded-lg text-foreground-muted font-medium">
                    <span className="text-lg leading-none">⇧</span>
                    <span className="text-[10px] mt-1">shift</span>
                  </kbd>
                  <span className="text-foreground-muted/60 text-sm">+</span>
                  <kbd className="flex flex-col items-center justify-center min-w-[60px] px-3 py-2 bg-bg-tertiary rounded-lg text-foreground-muted font-medium">
                    <span className="text-lg leading-none">&gt;</span>
                    <span className="text-[10px] mt-1">.</span>
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Message */}
      <AnimatePresence>
        {(feedback || uploadError) && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 overflow-hidden"
          >
            <div
              className={`
                flex items-start gap-3 px-4 py-3 rounded-lg text-sm
                ${feedback?.type === 'error' || uploadError
                  ? 'bg-category-deny-dim text-category-deny'
                  : feedback?.type === 'warning'
                    ? 'bg-category-ask-dim text-category-ask'
                    : 'bg-category-allow-dim text-category-allow'
                }
              `}
              role={feedback?.type === 'error' || uploadError ? 'alert' : 'status'}
              data-testid={`${testId}-feedback`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {feedback?.type === 'error' || uploadError ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : feedback?.type === 'warning' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                {feedback?.fileName && (
                  <span className="font-medium">{feedback.fileName}: </span>
                )}
                <span>{uploadError?.message ?? feedback?.message}</span>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearFeedback()
                }}
                className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Dismiss message"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
