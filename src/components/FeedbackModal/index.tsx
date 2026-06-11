/**
 * FeedbackModal Component
 * Modal form for collecting user feedback with text, optional email, and image uploads
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from '@/components/ImageUpload';
import { submitFeedback, isValidEmail } from '@/services/feedbackService';
import { FEEDBACK_VALIDATION, type AttachmentPreview } from '@/types/feedback';

export interface FeedbackModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when feedback is successfully submitted */
  onSuccess: () => void;
  /** Callback to show toast messages */
  onShowToast: (message: string, type: 'success' | 'error') => void;
  /** Test ID for E2E testing */
  testId?: string | undefined;
}

export function FeedbackModal({
  visible,
  onClose,
  onSuccess,
  onShowToast,
  testId,
}: FeedbackModalProps) {
  // Form state
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Refs for focus management
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (visible && textareaRef.current) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, isSubmitting, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      // Delay reset to allow exit animation
      const timer = setTimeout(() => {
        setMessage('');
        setEmail('');
        setAttachments([]);
        setError(null);
        setEmailError(null);
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((att) => URL.revokeObjectURL(att.previewUrl));
    };
  }, [attachments]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= FEEDBACK_VALIDATION.MESSAGE_MAX_LENGTH) {
      setMessage(value);
      setError(null);
    }
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(null);
  }, []);

  const handleEmailBlur = useCallback(() => {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
    }
  }, [email]);

  const handleAttachmentsChange = useCallback((newAttachments: AttachmentPreview[]) => {
    setAttachments(newAttachments);
    setError(null);
  }, []);

  const handleAttachmentError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate message
      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        setError('Please enter your feedback');
        textareaRef.current?.focus();
        return;
      }

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await submitFeedback(trimmedMessage, email || undefined, attachments.length > 0 ? attachments : undefined);
        onShowToast('Thank you for your feedback!', 'success');
        onSuccess();
        onClose();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
        setError(errorMessage);
        onShowToast(`${errorMessage}. Please try again.`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [message, email, attachments, onClose, onSuccess, onShowToast]
  );

  // Character counter styling
  const messageLength = message.length;
  const isNearLimit = messageLength >= FEEDBACK_VALIDATION.MESSAGE_WARNING_THRESHOLD;
  const isAtLimit = messageLength >= FEEDBACK_VALIDATION.MESSAGE_MAX_LENGTH;
  const counterColorClass = isAtLimit
    ? 'text-category-deny'
    : isNearLimit
      ? 'text-category-ask'
      : 'text-foreground-muted';

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
            onClick={isSubmitting ? undefined : onClose}
            data-testid={testId ? `${testId}-backdrop` : undefined}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full max-w-lg"
              data-testid={testId}
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-modal-title"
            >
            <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-bg-tertiary/30">
                <div>
                  <h2 id="feedback-modal-title" className="text-lg font-semibold text-foreground">
                    Share Your Feedback
                  </h2>
                  <p className="text-sm text-foreground-secondary mt-0.5">
                    Help us improve this tool for everyone
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-xl hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                  aria-label="Close feedback form"
                >
                  <svg
                    className="w-5 h-5 text-foreground-muted hover:text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="p-3 rounded-lg bg-category-deny-dim border border-category-deny-border">
                    <p className="text-sm text-category-deny">{error}</p>
                  </div>
                )}

                {/* Message Field */}
                <div>
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-foreground mb-2">
                    Your Feedback <span className="text-category-deny">*</span>
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="feedback-message"
                    value={message}
                    onChange={handleMessageChange}
                    disabled={isSubmitting}
                    placeholder="What's working well? What could be improved?"
                    rows={5}
                    className={`
                      w-full px-4 py-3 text-sm text-foreground bg-bg-secondary
                      border rounded-xl resize-none
                      placeholder:text-foreground-muted
                      focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${error && !message.trim() ? 'border-category-deny' : 'border-border'}
                    `}
                    aria-describedby="feedback-message-counter"
                    aria-required="true"
                  />
                  <div
                    id="feedback-message-counter"
                    className={`mt-1.5 text-xs text-right ${counterColorClass}`}
                    aria-live="polite"
                  >
                    {messageLength} / {FEEDBACK_VALIDATION.MESSAGE_MAX_LENGTH}
                  </div>
                </div>

                {/* Email Field (Optional) */}
                <div>
                  <label htmlFor="feedback-email" className="block text-sm font-medium text-foreground mb-2">
                    Email <span className="text-foreground-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    id="feedback-email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    disabled={isSubmitting}
                    placeholder="your@email.com"
                    className={`
                      w-full px-4 py-3 text-sm text-foreground bg-bg-secondary
                      border rounded-xl
                      placeholder:text-foreground-muted
                      focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${emailError ? 'border-category-deny' : 'border-border'}
                    `}
                    aria-describedby={emailError ? 'email-error' : undefined}
                  />
                  {emailError && (
                    <p id="email-error" className="mt-1.5 text-xs text-category-deny">
                      {emailError}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-foreground-muted">
                    Include your email if you'd like us to follow up
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Screenshots <span className="text-foreground-muted font-normal">(optional)</span>
                  </label>
                  <ImageUpload
                    attachments={attachments}
                    onAttachmentsChange={handleAttachmentsChange}
                    onError={handleAttachmentError}
                    disabled={isSubmitting}
                    testId={testId ? `${testId}-image-upload` : undefined}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-bg-tertiary/20">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-sm font-semibold text-foreground-secondary hover:text-foreground hover:bg-bg-tertiary rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className={`
                    px-5 py-2.5 text-sm font-semibold rounded-xl
                    transition-all min-w-[120px]
                    ${
                      isSubmitting || !message.trim()
                        ? 'bg-accent-primary/50 text-white/70 cursor-not-allowed'
                        : 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25 hover:bg-accent-primary-hover hover:shadow-xl hover:shadow-accent-primary/30 hover:-translate-y-0.5'
                    }
                  `}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Feedback'
                  )}
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
