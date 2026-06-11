/**
 * useFileUpload Hook
 *
 * Custom hook for processing file uploads and pasted content.
 * Handles file reading, validation, hashing, and creating SourceFile objects.
 */

import { useState, useCallback } from 'react'

import type { SourceFile, ValidationStatus, InputMethod } from '@/types/multiFile'
import type { SettingsConfiguration } from '@/types/permissions'

import {
  readFileAsText,
  hashContent,
  isDuplicateContent,
  generateId,
  validateFile,
  MAX_FILE_SIZE,
} from '@/utils/fileUtils'

import { parseJson, countPermissions } from '@/utils/jsonParser'

/** Result of processing a file with duplicate detection */
export interface ProcessFileResult {
  sourceFile: SourceFile
  isDuplicate: boolean
  duplicateOf: string | undefined // Name of the file this is a duplicate of
}

export interface UseFileUploadReturn {
  /** Read and validate a file, checking for duplicates */
  processFile: (file: File, existingFiles?: SourceFile[]) => Promise<ProcessFileResult>

  /** Read and validate pasted content, checking for duplicates */
  processPaste: (content: string, name?: string, existingFiles?: SourceFile[]) => Promise<ProcessFileResult>

  /** Check if content is a duplicate of existing files */
  isDuplicate: (contentHash: string, existingFiles: SourceFile[]) => boolean

  /** Find duplicate file by content hash */
  findDuplicate: (contentHash: string, existingFiles: SourceFile[]) => SourceFile | undefined

  /** Generate content hash */
  hashContent: (content: string) => Promise<string>

  /** Loading state */
  isProcessing: boolean

  /** Last error */
  error: Error | null

  /** Clear the last error */
  clearError: () => void
}

/**
 * Count plugins in a settings configuration.
 */
function countPlugins(config: SettingsConfiguration): number {
  return config.enabledPlugins ? Object.keys(config.enabledPlugins).length : 0
}

/**
 * Create a SourceFile object from content.
 */
async function createSourceFile(
  content: string,
  name: string,
  inputMethod: InputMethod,
  existingFilesCount: number
): Promise<SourceFile> {
  // Generate hash for duplicate detection
  const contentHash = await hashContent(content)

  // Generate unique ID
  const id = generateId()

  // Parse and validate the JSON content
  const parseResult = parseJson(content)

  let validationStatus: ValidationStatus
  let parsedConfig: SettingsConfiguration | null = null
  let permissionCount = 0
  let pluginCount = 0

  if (parseResult.success && parseResult.data) {
    parsedConfig = parseResult.data
    permissionCount = countPermissions(parsedConfig)
    pluginCount = countPlugins(parsedConfig)

    // Check for empty permissions (valid JSON but no permissions)
    if (permissionCount === 0 && pluginCount === 0) {
      validationStatus = {
        status: 'warning',
        error: null,
        warnings: ['File contains no permissions or plugins'],
      }
    } else {
      validationStatus = {
        status: 'valid',
        error: null,
        warnings: [],
      }
    }
  } else {
    // Parse failed
    validationStatus = {
      status: 'invalid',
      error: parseResult.error ?? { message: 'Unknown parse error' },
      warnings: [],
    }
  }

  return {
    id,
    name,
    content,
    contentHash,
    inputMethod,
    addedAt: Date.now(),
    order: existingFilesCount, // New files go to the end (highest priority)
    validationStatus,
    parsedConfig,
    permissionCount,
    pluginCount,
  }
}

/**
 * Hook for processing file uploads and pasted content.
 *
 * Usage:
 * ```tsx
 * const { processFile, processPaste, isProcessing, error } = useFileUpload()
 *
 * const handleDrop = async (files: File[]) => {
 *   for (const file of files) {
 *     const sourceFile = await processFile(file)
 *     addSourceFile(sourceFile)
 *   }
 * }
 * ```
 */
/**
 * Find a duplicate file by content hash.
 */
function findDuplicateFile(contentHash: string, existingFiles: SourceFile[]): SourceFile | undefined {
  return existingFiles.find((f) => f.contentHash === contentHash)
}

export function useFileUpload(): UseFileUploadReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Process an uploaded file with duplicate detection.
   */
  const processFile = useCallback(
    async (file: File, existingFiles: SourceFile[] = []): Promise<ProcessFileResult> => {
      setIsProcessing(true)
      setError(null)

      try {
        // Validate file type and size
        const validation = validateFile(file)
        if (!validation.isValid) {
          throw new Error(validation.error)
        }

        // Read file content
        const content = await readFileAsText(file)

        // Create SourceFile object
        const sourceFile = await createSourceFile(content, file.name, 'file', existingFiles.length)

        // Check for duplicates
        const duplicateFile = findDuplicateFile(sourceFile.contentHash, existingFiles)

        return {
          sourceFile,
          isDuplicate: !!duplicateFile,
          duplicateOf: duplicateFile?.name,
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        throw errorObj
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  /**
   * Process pasted content with duplicate detection.
   */
  const processPaste = useCallback(
    async (content: string, name?: string, existingFiles: SourceFile[] = []): Promise<ProcessFileResult> => {
      setIsProcessing(true)
      setError(null)

      try {
        // Validate content size
        const contentSize = new Blob([content]).size
        if (contentSize > MAX_FILE_SIZE) {
          throw new Error(
            `Content size (${(contentSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (1MB)`
          )
        }

        // Generate a name for pasted content
        const displayName = name ?? `Pasted Input ${new Date().toLocaleTimeString()}`

        // Create SourceFile object
        const sourceFile = await createSourceFile(content, displayName, 'paste', existingFiles.length)

        // Check for duplicates
        const duplicateFile = findDuplicateFile(sourceFile.contentHash, existingFiles)

        return {
          sourceFile,
          isDuplicate: !!duplicateFile,
          duplicateOf: duplicateFile?.name,
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        throw errorObj
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  /**
   * Clear the last error.
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    processFile,
    processPaste,
    isDuplicate: isDuplicateContent,
    findDuplicate: findDuplicateFile,
    hashContent,
    isProcessing,
    error,
    clearError,
  }
}
