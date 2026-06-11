/**
 * FeedbackBanner Component
 * Top banner prompting users to provide feedback
 */

import { motion, AnimatePresence } from 'framer-motion';

export interface FeedbackBannerProps {
  /** Whether the banner is visible */
  visible: boolean;
  /** Callback when user clicks to open feedback form */
  onOpenForm: () => void;
  /** Callback when user dismisses the banner */
  onDismiss: () => void;
  /** Test ID for E2E testing */
  testId?: string | undefined;
}

export function FeedbackBanner({
  visible,
  onOpenForm,
  onDismiss,
  testId,
}: FeedbackBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50"
          data-testid={testId}
          role="banner"
          aria-label="Feedback invitation"
        >
          <div className="bg-accent-primary/95 backdrop-blur-sm shadow-lg shadow-accent-primary/20">
            <div className="max-w-2xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Message */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-medium truncate">
                    Help us improve! Share your feedback on this tool.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={onOpenForm}
                    className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-white text-accent-primary hover:bg-white/90 transition-colors shadow-sm"
                    aria-label="Open feedback form"
                  >
                    Give Feedback
                  </button>
                  <button
                    onClick={onDismiss}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Dismiss feedback banner"
                  >
                    <svg
                      className="w-5 h-5"
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
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
