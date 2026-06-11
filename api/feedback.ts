/**
 * Vercel Serverless Function: Feedback Submission
 * POST /api/feedback - Sends feedback via Resend email API
 */

import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface FeedbackAttachment {
  filename: string;
  contentType: string;
  content: string;
}

interface FeedbackRequestBody {
  message: string;
  email?: string;
  attachments?: FeedbackAttachment[];
  metadata?: {
    userAgent?: string;
    screenSize?: string;
    timestamp?: string;
  };
}

const RECIPIENT_EMAIL = 'mike@heggie.design';
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENTS = 3;
const MAX_TOTAL_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculateBase64Size(base64String: string): number {
  // Remove padding and calculate actual byte size
  const padding = (base64String.match(/=+$/g) || [''])[0].length;
  return Math.floor((base64String.length * 3) / 4) - padding;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check for API key
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  // Parse request body
  let body: FeedbackRequestBody;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  const { message, email, attachments, metadata } = body;

  // Validate message
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Message is required', field: 'message' });
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty', field: 'message' });
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Message exceeds ${MAX_MESSAGE_LENGTH} character limit`,
      field: 'message',
    });
  }

  // Validate email (optional)
  if (email && typeof email === 'string' && email.trim()) {
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid email format', field: 'email' });
    }
  }

  // Validate attachments (optional)
  if (attachments) {
    if (!Array.isArray(attachments)) {
      return res.status(400).json({ success: false, error: 'Attachments must be an array', field: 'attachments' });
    }

    if (attachments.length > MAX_ATTACHMENTS) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${MAX_ATTACHMENTS} attachments allowed`,
        field: 'attachments',
      });
    }

    let totalSize = 0;
    for (const attachment of attachments) {
      if (!ALLOWED_CONTENT_TYPES.includes(attachment.contentType)) {
        return res.status(400).json({ success: false, error: 'Only image files are allowed', field: 'attachments' });
      }
      totalSize += calculateBase64Size(attachment.content);
    }

    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        error: 'Total attachment size exceeds 5MB limit',
        field: 'attachments',
      });
    }
  }

  // Build email HTML
  const escapedMessage = escapeHtml(trimmedMessage);
  const timestamp = metadata?.timestamp || new Date().toISOString();
  const userAgent = metadata?.userAgent || 'Unknown';
  const screenSize = metadata?.screenSize || 'Unknown';

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px;">
      <h2 style="color: #da7756;">New Feedback Received</h2>

      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="white-space: pre-wrap; margin: 0;">${escapedMessage}</p>
      </div>

      ${email?.trim() ? `<p><strong>Reply to:</strong> <a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a></p>` : ''}

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">

      <p style="color: #666; font-size: 12px;">
        Submitted: ${escapeHtml(timestamp)}<br>
        User Agent: ${escapeHtml(userAgent)}<br>
        Screen: ${escapeHtml(screenSize)}
      </p>
    </div>
  `;

  // Send email via Resend
  try {
    const resend = new Resend(apiKey);

    const emailPayload: Parameters<typeof resend.emails.send>[0] = {
      from: 'Feedback <feedback@resend.dev>',
      to: RECIPIENT_EMAIL,
      subject: 'Feedback: Claude Permissions Manager',
      html,
    };

    // Add attachments if present
    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
      }));
    }

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.data?.id || 'sent',
    });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send email. Please try again later.',
    });
  }
}
