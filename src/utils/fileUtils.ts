/**
 * File Utilities
 *
 * Utilities for file reading, content hashing, and duplicate detection.
 */

import type { SourceFile } from '@/types/multiFile'

// =============================================================================
// Constants
// =============================================================================

/** Maximum file size in bytes (1MB) */
export const MAX_FILE_SIZE = 1024 * 1024

/** Accepted file types for upload */
export const ACCEPTED_FILE_TYPES = '.json'

// =============================================================================
// File Reading
// =============================================================================

/**
 * Read a file as text with size validation.
 * @param file - The File object to read
 * @returns Promise resolving to file content as string
 * @throws Error if file exceeds size limit or reading fails
 */
export async function readFileAsText(file: File): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (1MB)`
    )
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as text'))
      }
    }

    reader.onerror = () => {
      reject(new Error(reader.error?.message ?? 'Failed to read file'))
    }

    reader.readAsText(file)
  })
}

// =============================================================================
// Content Hashing
// =============================================================================

/**
 * Generate SHA-256 hash of content using Web Crypto API.
 * @param content - The string content to hash
 * @returns Promise resolving to hex-encoded hash string
 */
export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// =============================================================================
// Duplicate Detection
// =============================================================================

/**
 * Check if content is a duplicate of any existing files.
 * @param contentHash - Hash of the content to check
 * @param existingFiles - Array of existing source files
 * @returns True if a file with the same hash exists
 */
export function isDuplicateContent(
  contentHash: string,
  existingFiles: SourceFile[]
): boolean {
  return existingFiles.some((file) => file.contentHash === contentHash)
}

/**
 * Find the existing file that matches the given content hash.
 * @param contentHash - Hash of the content to find
 * @param existingFiles - Array of existing source files
 * @returns The matching file or undefined
 */
export function findDuplicateFile(
  contentHash: string,
  existingFiles: SourceFile[]
): SourceFile | undefined {
  return existingFiles.find((file) => file.contentHash === contentHash)
}

// =============================================================================
// File Validation Helpers
// =============================================================================

/**
 * Check if a file has a JSON extension.
 * @param file - The file to check
 * @returns True if the file has a .json extension
 */
export function isJsonFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.json')
}

/**
 * Validate file for upload.
 * @param file - The file to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!isJsonFile(file)) {
    return {
      isValid: false,
      error: `Invalid file type. Expected .json file, got "${file.name}"`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (1MB)`,
    }
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty',
    }
  }

  return { isValid: true }
}

// =============================================================================
// UUID Generation
// =============================================================================

/**
 * Generate a UUID v4 for source file identification.
 * Uses crypto.randomUUID() if available, falls back to a polyfill.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
