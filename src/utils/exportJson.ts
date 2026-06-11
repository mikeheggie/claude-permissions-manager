/**
 * Export Logic
 * Convert app state to settings.json format
 */

import type {
  Permission,
  Plugin,
  DefaultMode,
  SettingsConfiguration,
} from '@/types/permissions'

/**
 * Convert permissions and plugins to a settings.json formatted string.
 * Arrays are sorted alphabetically for consistency.
 * Permissions with excluded: true are filtered out.
 */
export function toSettingsJson(
  permissions: Permission[],
  plugins: Plugin[],
  defaultMode?: DefaultMode
): string {
  // Group permissions by category, filtering out excluded permissions
  const allow: string[] = []
  const deny: string[] = []
  const ask: string[] = []

  for (const perm of permissions) {
    // Skip excluded permissions
    if (perm.excluded) {
      continue
    }

    switch (perm.category) {
      case 'allow':
        allow.push(perm.pattern)
        break
      case 'deny':
        deny.push(perm.pattern)
        break
      case 'ask':
        ask.push(perm.pattern)
        break
    }
  }

  // Sort arrays alphabetically
  allow.sort()
  deny.sort()
  ask.sort()

  // Build the configuration object
  const config: SettingsConfiguration = {
    permissions: {
      allow,
      deny,
      ask,
    },
  }

  // Add defaultMode if present
  if (defaultMode !== undefined) {
    config.permissions.defaultMode = defaultMode
  }

  // Add enabledPlugins if any exist
  if (plugins.length > 0) {
    config.enabledPlugins = {}
    // Sort plugins by id for consistency
    const sortedPlugins = [...plugins].sort((a, b) => a.id.localeCompare(b.id))
    for (const plugin of sortedPlugins) {
      config.enabledPlugins[plugin.id] = plugin.enabled
    }
  }

  // Format with 2-space indentation
  return JSON.stringify(config, null, 2)
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copy content to clipboard using the Clipboard API.
 * Returns true on success, false if clipboard access failed.
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content)
    return true
  } catch {
    // Clipboard API failed - caller should show fallback modal
    return false
  }
}

// =============================================================================
// File System Access API Support
// =============================================================================

/**
 * Check if the File System Access API is supported in the current browser.
 * This API allows saving files to user-specified locations.
 * Supported in Chromium browsers (Chrome 86+, Edge 86+).
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showSaveFilePicker' in window
}

/**
 * Save content to a file using the File System Access API if available,
 * falling back to a standard download if not.
 *
 * @param content - The content to save
 * @param suggestedName - Suggested filename for the save dialog
 * @returns Object indicating if save was successful and which method was used
 */
export async function saveAsFile(
  content: string,
  suggestedName: string = 'settings.json'
): Promise<{ saved: boolean; usedNativeDialog: boolean }> {
  // Try File System Access API first
  if (isFileSystemAccessSupported()) {
    try {
      // TypeScript doesn't have built-in types for File System Access API
      const handle = await (window as unknown as WindowWithFileSystemAccess).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'JSON Files',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      })

      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()

      return { saved: true, usedNativeDialog: true }
    } catch (error) {
      // User cancelled the dialog - this is expected behavior
      if (error instanceof Error && error.name === 'AbortError') {
        return { saved: false, usedNativeDialog: true }
      }
      // For other errors, fall through to download fallback
      console.warn('File System Access API failed, using download fallback:', error)
    }
  }

  // Fallback to standard download
  downloadFile(content, suggestedName)
  return { saved: true, usedNativeDialog: false }
}

// =============================================================================
// Type Definitions for File System Access API
// =============================================================================

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface FileSystemWritableFileStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}

interface WindowWithFileSystemAccess extends Window {
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>
}
