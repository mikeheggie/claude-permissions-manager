/**
 * useFeedback Hook
 * Manages feedback banner and modal visibility state
 */

import { useState, useCallback, useEffect } from 'react';
import { FEEDBACK_SUBMITTED_KEY, FEEDBACK_BANNER_DISMISSED_KEY } from '@/types/feedback';

export interface UseFeedbackReturn {
  /** Whether the banner should be visible */
  showBanner: boolean;
  /** Whether the modal should be visible */
  showModal: boolean;
  /** Whether feedback has been submitted this session */
  hasSubmitted: boolean;
  /** Open the feedback modal */
  openModal: () => void;
  /** Close the feedback modal */
  closeModal: () => void;
  /** Dismiss the banner (persists across sessions) */
  dismissBanner: () => void;
  /** Mark feedback as submitted (hides banner across sessions) */
  markAsSubmitted: () => void;
}

function readStorageFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeStorageFlag(key: string, value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // Ignore storage errors to avoid breaking UX
  }
}

export function useFeedback(): UseFeedbackReturn {
  // Check localStorage for previous submission
  const [hasSubmitted, setHasSubmitted] = useState(() => readStorageFlag(FEEDBACK_SUBMITTED_KEY));

  // Banner dismissed state (persists across sessions)
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    readStorageFlag(FEEDBACK_BANNER_DISMISSED_KEY)
  );

  // Modal visibility state
  const [showModal, setShowModal] = useState(false);

  // Banner is visible if not submitted and not dismissed
  const showBanner = !hasSubmitted && !bannerDismissed;

  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    writeStorageFlag(FEEDBACK_BANNER_DISMISSED_KEY, true);
  }, []);

  const markAsSubmitted = useCallback(() => {
    setHasSubmitted(true);
    writeStorageFlag(FEEDBACK_SUBMITTED_KEY, true);
  }, []);

  // Sync with localStorage on mount (for SSR hydration)
  useEffect(() => {
    const submitted = readStorageFlag(FEEDBACK_SUBMITTED_KEY);
    const dismissed = readStorageFlag(FEEDBACK_BANNER_DISMISSED_KEY);
    if (submitted !== hasSubmitted) setHasSubmitted(submitted);
    if (dismissed !== bannerDismissed) setBannerDismissed(dismissed);
  }, [hasSubmitted, bannerDismissed]);

  return {
    showBanner,
    showModal,
    hasSubmitted,
    openModal,
    closeModal,
    dismissBanner,
    markAsSubmitted,
  };
}
