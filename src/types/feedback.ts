/**
 * Feedback Form Types
 * TypeScript types for the feedback submission system
 */

/** Allowed image MIME types for attachments */
export type AttachmentContentType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

/** Single image attachment */
export interface Attachment {
  filename: string;
  contentType: AttachmentContentType;
  content: string; // base64 encoded
  size: number;
}

/** Attachment with preview data for UI */
export interface AttachmentPreview extends Attachment {
  id: string; // For React key and removal
  previewUrl: string; // Object URL for preview
}

/** Request body for POST /api/feedback */
export interface FeedbackRequest {
  message: string;
  email?: string;
  attachments?: {
    filename: string;
    contentType: string;
    content: string;
  }[];
  metadata?: {
    userAgent?: string;
    screenSize?: string;
    timestamp?: string;
  };
}

/** Successful API response */
export interface FeedbackSuccessResponse {
  success: true;
  messageId: string;
}

/** Error API response */
export interface FeedbackErrorResponse {
  success: false;
  error: string;
  field?: string;
}

/** Combined API response type */
export type FeedbackResponse = FeedbackSuccessResponse | FeedbackErrorResponse;

/** Validation constants */
export const FEEDBACK_VALIDATION = {
  MESSAGE_MAX_LENGTH: 2000,
  MESSAGE_WARNING_THRESHOLD: 1800,
  MAX_ATTACHMENTS: 3,
  MAX_TOTAL_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as AttachmentContentType[],
} as const;

/** LocalStorage key for tracking feedback submission */
export const FEEDBACK_SUBMITTED_KEY = 'feedback_submitted';

/** LocalStorage key for tracking feedback banner dismissal */
export const FEEDBACK_BANNER_DISMISSED_KEY = 'feedback_banner_dismissed';
