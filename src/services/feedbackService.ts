/**
 * Feedback Service
 * Handles submission of user feedback to the API
 */

import type {
  FeedbackRequest,
  FeedbackResponse,
  FeedbackSuccessResponse,
  AttachmentPreview,
} from '@/types/feedback';

/**
 * Submit feedback to the API
 * @param message - Feedback message text
 * @param email - Optional email for follow-up
 * @param attachments - Optional image attachments
 * @returns Promise resolving to success response
 * @throws Error if submission fails
 */
export async function submitFeedback(
  message: string,
  email?: string,
  attachments?: AttachmentPreview[]
): Promise<FeedbackSuccessResponse> {
  const request: FeedbackRequest = {
    message: message.trim(),
    metadata: {
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    },
  };

  if (email?.trim()) {
    request.email = email.trim();
  }

  if (attachments && attachments.length > 0) {
    request.attachments = attachments.map((att) => ({
      filename: att.filename,
      contentType: att.contentType,
      content: att.content,
    }));
  }

  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  // Handle non-JSON responses (e.g., 404 in development)
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    if (response.status === 404) {
      throw new Error('Feedback API not available in development mode');
    }
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  let data: FeedbackResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response from server');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to submit feedback');
  }

  return data;
}

/**
 * Read a file and convert it to base64
 * @param file - File to read
 * @returns Promise resolving to base64 string
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] ?? '';
      if (!base64) {
        reject(new Error('Failed to extract base64 data'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns true if email is valid or empty
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return true; // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
