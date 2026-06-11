/**
 * Toast Component
 * Notification with optional undo action
 */

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ToastProps {
  /** Toast message */
  message: string

  /** Type of toast (affects styling) */
  type: 'success' | 'info' | 'warning' | 'error'

  /** Whether toast is visible */
  visible: boolean

  /** Callback for undo action (if available) */
  onUndo?: (() => void) | undefined

  /** Callback when toast is dismissed */
  onDismiss: () => void

  /** Auto-dismiss duration in ms (default: 5000) */
  duration?: number | undefined

  /** Test ID for E2E testing */
  testId?: string | undefined
}

const typeStyles = {
  success: {
    bg: 'bg-category-allow-dim',
    border: 'border-category-allow-border',
    text: 'text-category-allow',
    iconBg: 'bg-category-allow/10',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-accent-primary/10',
    border: 'border-accent-primary/20',
    text: 'text-accent-primary',
    iconBg: 'bg-accent-primary/10',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-category-ask-dim',
    border: 'border-category-ask-border',
    text: 'text-category-ask',
    iconBg: 'bg-category-ask/10',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-category-deny-dim',
    border: 'border-category-deny-border',
    text: 'text-category-deny',
    iconBg: 'bg-category-deny/10',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
}

export function Toast({
  message,
  type,
  visible,
  onUndo,
  onDismiss,
  duration = 5000,
  testId,
}: ToastProps) {
  const styles = typeStyles[type]

  // Auto-dismiss timer
  useEffect(() => {
    if (!visible) return

    const timer = setTimeout(() => {
      onDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [visible, duration, onDismiss])

  const handleUndo = useCallback(() => {
    onUndo?.()
    onDismiss()
  }, [onUndo, onDismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-6 right-6 z-50"
          data-testid={testId}
          role="alert"
          aria-live="polite"
        >
          <div
            className={`
              flex items-center gap-3 px-4 py-3.5 rounded-2xl
              ${styles.bg} ${styles.border} border
              shadow-xl backdrop-blur-xl
              min-w-[300px] max-w-[400px]
            `}
          >
            <div className={`w-8 h-8 rounded-xl ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
              <span className={styles.text}>{styles.icon}</span>
            </div>

            <p className="flex-1 text-sm font-medium text-foreground">{message}</p>

            {onUndo && (
              <button
                onClick={handleUndo}
                className={`
                  px-3 py-1.5 text-sm font-semibold rounded-lg
                  ${styles.text} hover:bg-white/50
                  transition-colors duration-200
                  min-h-[32px]
                `}
                aria-label="Undo action"
              >
                Undo
              </button>
            )}

            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-bg-tertiary transition-all"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
