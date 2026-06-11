/**
 * ActionBar Component
 * Sticky footer with merge and copy buttons
 *
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { isFileSystemAccessSupported } from '@/utils/exportJson'

export interface ActionBarProps {
  /** Callback for "Copy settings.json" action (primary) */
  onCopy: () => Promise<boolean>

  /** Callback for "Download settings.json" action (secondary) */
  onDownload: () => void

  /** Callback for "Save As" action */
  onSaveAs?: () => Promise<{ saved: boolean; cancelled: boolean }> | undefined

  /** Whether export is possible */
  canExport: boolean

  /** Export disabled reason */
  exportDisabledReason?: string | undefined

  /** Callback for clearing all inputs */
  onClearAll: () => void

  /** Test ID for E2E testing */
  testId?: string | undefined
}

export function ActionBar({
  onCopy,
  onDownload,
  onSaveAs,
  canExport,
  exportDisabledReason,
  onClearAll,
  testId,
}: ActionBarProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'success'>('idle')
  const [saveAsState, setSaveAsState] = useState<'idle' | 'saving' | 'success'>('idle')

  // Check if File System Access API is supported
  const fileSystemAccessSupported = isFileSystemAccessSupported()

  const handleCopy = useCallback(async () => {
    if (!canExport || copyState === 'copying') return

    setCopyState('copying')
    const success = await onCopy()

    if (success) {
      setCopyState('success')
      // Reset to idle after showing checkmark
      setTimeout(() => setCopyState('idle'), 2000)
    } else {
      setCopyState('idle')
    }
  }, [canExport, copyState, onCopy])

  // Handle Save As action
  const handleSaveAs = useCallback(async () => {
    if (!canExport || !onSaveAs || saveAsState === 'saving') return

    setSaveAsState('saving')
    const result = await onSaveAs()

    // Handle cancellation gracefully
    if (!result || result.cancelled) {
      setSaveAsState('idle')
      return
    }

    if (result.saved) {
      setSaveAsState('success')
      // Reset to idle after showing checkmark
      setTimeout(() => setSaveAsState('idle'), 2000)
    } else {
      setSaveAsState('idle')
    }
  }, [canExport, onSaveAs, saveAsState])

  return (
    <div
      data-testid={testId}
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* Copy Button (Secondary) */}
        <div className="relative group">
          <button
            onClick={handleCopy}
            disabled={!canExport || copyState === 'copying'}
            className={`
              px-6 py-3 text-sm font-semibold rounded-xl min-w-[180px] transition-all duration-200
              ${
                canExport
                  ? 'bg-surface text-foreground border border-border hover:border-accent-primary hover:text-accent-primary hover:shadow-md active:scale-[0.98]'
                  : 'bg-bg-tertiary text-foreground-muted border border-border cursor-not-allowed'
              }
            `}
            aria-describedby={!canExport ? 'copy-tooltip' : undefined}
            data-testid={testId ? `${testId}-copy` : undefined}
          >
            <AnimatePresence mode="wait">
              {copyState === 'success' ? (
                <motion.span
                  key="success"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy settings.json
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Tooltip */}
          {!canExport && exportDisabledReason && (
            <div
              id="copy-tooltip"
              role="tooltip"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs font-medium text-foreground bg-surface border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              {exportDisabledReason}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-surface border-r border-b border-border rotate-45" />
            </div>
          )}
        </div>

        {/* Download Button (Secondary) */}
        <div className="relative group">
          <button
            onClick={onDownload}
            disabled={!canExport}
            className={`
              px-5 py-3 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all duration-200
              ${
                canExport
                  ? 'bg-surface text-foreground border border-border hover:border-accent-primary hover:text-accent-primary hover:shadow-md active:scale-[0.98]'
                  : 'bg-bg-tertiary text-foreground-muted border border-border cursor-not-allowed'
              }
            `}
            aria-describedby={!canExport ? 'download-tooltip' : undefined}
            data-testid={testId ? `${testId}-download` : undefined}
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </button>

          {/* Tooltip */}
          {!canExport && exportDisabledReason && (
            <div
              id="download-tooltip"
              role="tooltip"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs font-medium text-foreground bg-surface border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              {exportDisabledReason}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-surface border-r border-b border-border rotate-45" />
            </div>
          )}
        </div>

        {/* Save As Button (Primary) - Only show if File System Access API is available or handler is provided */}
        {onSaveAs && (
          <div className="relative group">
            <button
              onClick={handleSaveAs}
              disabled={!canExport || saveAsState === 'saving' || !fileSystemAccessSupported}
              className={`
                px-5 py-3 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all duration-200
                ${
                  canExport && fileSystemAccessSupported
                    ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25 hover:bg-accent-primary-hover hover:shadow-xl hover:shadow-accent-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                    : 'bg-bg-tertiary text-foreground-muted border border-border cursor-not-allowed'
                }
              `}
              aria-describedby={!fileSystemAccessSupported ? 'saveas-tooltip' : undefined}
              data-testid={testId ? `${testId}-saveas` : undefined}
            >
              <AnimatePresence mode="wait">
                {saveAsState === 'success' ? (
                  <motion.span
                    key="success"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Saved!
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
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
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    Save As...
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Tooltip for unsupported browsers */}
            {!fileSystemAccessSupported && (
              <div
                id="saveas-tooltip"
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs font-medium text-foreground bg-surface border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none max-w-xs"
              >
                Save As requires Chrome, Edge, or Opera browser
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-surface border-r border-b border-border rotate-45" />
              </div>
            )}
          </div>
        )}

        {/* Clear All Button */}
        <button
          onClick={onClearAll}
          className="px-4 py-3 text-sm font-medium rounded-xl text-foreground-muted hover:text-foreground hover:bg-bg-tertiary border border-transparent hover:border-border transition-all duration-200"
          aria-label="Clear all inputs"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
