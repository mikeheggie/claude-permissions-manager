/**
 * CopyFallbackModal Component
 * Shown when clipboard API fails - displays content for manual copy
 */

import { useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CopyFallbackModalProps {
  /** Whether the modal is visible */
  visible: boolean

  /** The content to display for manual copy */
  content: string

  /** Callback when modal is closed */
  onClose: () => void

  /** Test ID for E2E testing */
  testId?: string | undefined
}

export function CopyFallbackModal({
  visible,
  content,
  onClose,
  testId,
}: CopyFallbackModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-select content when modal opens
  useEffect(() => {
    if (visible && textareaRef.current) {
      textareaRef.current.select()
    }
  }, [visible])

  const handleSelectAll = useCallback(() => {
    textareaRef.current?.select()
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
            data-testid={testId ? `${testId}-backdrop` : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4"
            data-testid={testId}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fallback-modal-title"
          >
            <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-bg-tertiary/30">
                <div>
                  <h2
                    id="fallback-modal-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    Copy to Clipboard
                  </h2>
                  <p className="text-sm text-foreground-secondary mt-0.5">
                    Automatic copy failed. Please select and copy manually.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-bg-tertiary transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5 text-foreground-muted hover:text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <textarea
                  ref={textareaRef}
                  readOnly
                  value={content}
                  className="w-full h-64 p-4 font-mono text-sm text-foreground bg-bg-tertiary/50 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary"
                  onClick={handleSelectAll}
                  data-testid={testId ? `${testId}-textarea` : undefined}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg-tertiary/20">
                <p className="text-sm text-foreground-muted font-medium">
                  Press <kbd className="px-1.5 py-0.5 text-xs bg-bg-tertiary rounded border border-border">⌘</kbd>+<kbd className="px-1.5 py-0.5 text-xs bg-bg-tertiary rounded border border-border">C</kbd> to copy
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 text-sm font-semibold text-foreground-secondary hover:text-foreground hover:bg-bg-tertiary rounded-xl transition-all"
                  >
                    Select All
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent-primary text-white shadow-lg shadow-accent-primary/25 hover:bg-accent-primary-hover hover:shadow-xl hover:shadow-accent-primary/30 hover:-translate-y-0.5 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
