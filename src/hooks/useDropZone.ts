/**
 * useDropZone Hook
 *
 * Custom hook for drag-and-drop file handling.
 * Uses native HTML5 drag-and-drop.
 */

import { useState, useCallback, useRef, type DragEvent } from 'react'

export interface UseDropZoneOptions {
  /** Called when files are dropped */
  onDrop: (files: File[]) => void

  /** Whether the drop zone is disabled */
  disabled?: boolean

  /** Accepted file types (e.g., '.json') */
  accept?: string

  /** Whether to allow multiple files */
  multiple?: boolean
}

export interface UseDropZoneReturn {
  /** Whether a drag is currently over the drop zone */
  isDragging: boolean

  /** Props to spread onto the drop zone element */
  dropZoneProps: {
    onDragEnter: (e: DragEvent) => void
    onDragOver: (e: DragEvent) => void
    onDragLeave: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
  }

  /** Open the file dialog programmatically */
  openFileDialog: () => void

  /** Ref to attach to a hidden file input */
  inputRef: React.RefObject<HTMLInputElement>

  /** Props to spread onto a hidden file input */
  inputProps: {
    type: 'file'
    accept: string | undefined
    multiple: boolean
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    style: React.CSSProperties
    tabIndex: number
    'aria-hidden': boolean
  }
}

/**
 * Hook for handling drag-and-drop file uploads.
 *
 * Usage:
 * ```tsx
 * const { isDragging, dropZoneProps, inputRef, inputProps, openFileDialog } = useDropZone({
 *   onDrop: (files) => console.log(files),
 *   accept: '.json',
 *   multiple: true,
 * })
 *
 * return (
 *   <div {...dropZoneProps} className={isDragging ? 'highlight' : ''}>
 *     Drop files here or <button onClick={openFileDialog}>browse</button>
 *     <input ref={inputRef} {...inputProps} />
 *   </div>
 * )
 * ```
 */
export function useDropZone(options: UseDropZoneOptions): UseDropZoneReturn {
  const { onDrop, disabled = false, accept, multiple = true } = options

  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Filter files by accepted types.
   */
  const filterFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const fileArray = Array.from(files)

      if (!accept) {
        return multiple ? fileArray : fileArray.slice(0, 1)
      }

      // Parse accepted types (e.g., '.json,.txt' or 'application/json')
      const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase())

      const filtered = fileArray.filter((file) => {
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
        const fileType = file.type.toLowerCase()

        return acceptedTypes.some((accepted) => {
          // Check extension
          if (accepted.startsWith('.')) {
            return fileExt === accepted
          }
          // Check MIME type
          return fileType === accepted || fileType.startsWith(accepted.replace('*', ''))
        })
      })

      return multiple ? filtered : filtered.slice(0, 1)
    },
    [accept, multiple]
  )

  /**
   * Handle files from drop or input change.
   */
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return

      const filteredFiles = filterFiles(files)
      if (filteredFiles.length > 0) {
        onDrop(filteredFiles)
      }
    },
    [disabled, filterFiles, onDrop]
  )

  /**
   * Handle drag enter - increment counter and show drag state.
   */
  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (disabled) return

      dragCounter.current++
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  /**
   * Handle drag over - must prevent default to enable drop.
   */
  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
    []
  )

  /**
   * Handle drag leave - decrement counter and hide drag state when all leaves.
   */
  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (disabled) return

      dragCounter.current--
      if (dragCounter.current === 0) {
        setIsDragging(false)
      }
    },
    [disabled]
  )

  /**
   * Handle drop - process the dropped files.
   */
  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setIsDragging(false)
      dragCounter.current = 0

      if (disabled) return

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
        e.dataTransfer.clearData()
      }
    },
    [disabled, handleFiles]
  )

  /**
   * Handle file input change.
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
        // Reset input to allow selecting the same file again
        e.target.value = ''
      }
    },
    [handleFiles]
  )

  /**
   * Open the file dialog programmatically.
   */
  const openFileDialog = useCallback(() => {
    if (disabled) return
    inputRef.current?.click()
  }, [disabled])

  return {
    isDragging,
    dropZoneProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    openFileDialog,
    inputRef: inputRef as React.RefObject<HTMLInputElement>,
    inputProps: {
      type: 'file' as const,
      accept,
      multiple,
      onChange: handleInputChange,
      style: { display: 'none' },
      tabIndex: -1,
      'aria-hidden': true,
    },
  }
}
