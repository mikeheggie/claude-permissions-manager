/**
 * ImageUpload Component
 * Handles image file selection, preview, and validation for feedback attachments
 */

import { useCallback, useRef, useId } from 'react';
import type { AttachmentPreview, AttachmentContentType } from '@/types/feedback';
import { FEEDBACK_VALIDATION } from '@/types/feedback';
import { readFileAsBase64 } from '@/services/feedbackService';

export interface ImageUploadProps {
  /** Current attachments */
  attachments: AttachmentPreview[];
  /** Callback when attachments change */
  onAttachmentsChange: (attachments: AttachmentPreview[]) => void;
  /** Callback when error occurs */
  onError: (error: string) => void;
  /** Whether uploads are disabled */
  disabled?: boolean;
  /** Test ID for E2E testing */
  testId?: string | undefined;
}

export function ImageUpload({
  attachments,
  onAttachmentsChange,
  onError,
  disabled = false,
  testId,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Check if we would exceed the max attachment count
      const remainingSlots = FEEDBACK_VALIDATION.MAX_ATTACHMENTS - attachments.length;
      if (remainingSlots <= 0) {
        onError(`Maximum ${FEEDBACK_VALIDATION.MAX_ATTACHMENTS} attachments allowed`);
        return;
      }

      // Get files to process (up to remaining slots)
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      // Calculate current total size
      const currentTotalSize = attachments.reduce((sum, att) => sum + att.size, 0);

      const newAttachments: AttachmentPreview[] = [];
      let addedSize = 0;

      for (const file of filesToProcess) {
        // Validate file type
        if (!FEEDBACK_VALIDATION.ALLOWED_TYPES.includes(file.type as AttachmentContentType)) {
          onError('Only PNG, JPEG, GIF, and WebP images are allowed');
          continue;
        }

        // Check if adding this file would exceed size limit
        if (currentTotalSize + addedSize + file.size > FEEDBACK_VALIDATION.MAX_TOTAL_SIZE_BYTES) {
          onError('Total attachment size exceeds 5MB limit');
          break;
        }

        try {
          const base64 = await readFileAsBase64(file);
          const previewUrl = URL.createObjectURL(file);

          newAttachments.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            filename: file.name,
            contentType: file.type as AttachmentContentType,
            content: base64,
            size: file.size,
            previewUrl,
          });

          addedSize += file.size;
        } catch {
          onError('Failed to read file');
        }
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
      }

      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [attachments, onAttachmentsChange, onError]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const attachment = attachments.find((att) => att.id === id);
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      onAttachmentsChange(attachments.filter((att) => att.id !== id));
    },
    [attachments, onAttachmentsChange]
  );

  const handleTriggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const canAddMore = attachments.length < FEEDBACK_VALIDATION.MAX_ATTACHMENTS;
  const sizePercentage = (totalSize / FEEDBACK_VALIDATION.MAX_TOTAL_SIZE_BYTES) * 100;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3" data-testid={testId}>
      {/* Upload Area */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={FEEDBACK_VALIDATION.ALLOWED_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          disabled={disabled || !canAddMore}
          className="sr-only"
          aria-label="Upload images"
        />
        <button
          type="button"
          onClick={handleTriggerUpload}
          disabled={disabled || !canAddMore}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-dashed
            transition-colors
            ${
              disabled || !canAddMore
                ? 'bg-bg-tertiary/50 text-foreground-muted border-border cursor-not-allowed'
                : 'bg-bg-tertiary/30 text-foreground-secondary border-border hover:bg-bg-tertiary hover:border-accent-primary/50 hover:text-foreground'
            }
          `}
          aria-label={canAddMore ? 'Add screenshot' : 'Maximum attachments reached'}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Add Screenshot</span>
        </button>

        {/* Size indicator */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <span>
              {attachments.length}/{FEEDBACK_VALIDATION.MAX_ATTACHMENTS} files
            </span>
            <span className="text-border">|</span>
            <span
              className={
                sizePercentage > 90 ? 'text-category-deny' : sizePercentage > 70 ? 'text-category-ask' : ''
              }
            >
              {formatSize(totalSize)} / 5MB
            </span>
          </div>
        )}
      </div>

      {/* Preview Grid */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border bg-bg-tertiary"
            >
              <img
                src={attachment.previewUrl}
                alt={attachment.filename}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(attachment.id)}
                disabled={disabled}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-foreground/80 text-bg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground"
                aria-label={`Remove ${attachment.filename}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-foreground/80 text-bg text-[10px] truncate">
                {formatSize(attachment.size)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
