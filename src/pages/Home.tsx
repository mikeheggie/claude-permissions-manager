/**
 * Home Page
 *
 * Main page with multi-file upload and merge preview layout.
 * Left panel: Source files (FileUpload + SourceFileList + PasteInput)
 * Right panel: Merge preview with conflict resolution
 *
 */

import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { useTheme } from '@/hooks/useTheme'
import { useFeedback } from '@/hooks/useFeedback'
import { useMultiFileMerge } from '@/hooks/useMultiFileMerge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { GitHubLink } from '@/components/GitHubLink'
import { Toast } from '@/components/Toast'
import { CopyFallbackModal } from '@/components/CopyFallbackModal'
import { FeedbackBanner } from '@/components/FeedbackBanner'
import { FeedbackModal } from '@/components/FeedbackModal'
import { FileUpload } from '@/components/FileUpload'
import { SourceFileList } from '@/components/SourceFileList'
import { PasteInput } from '@/components/PasteInput'
import { MergePreview } from '@/components/MergePreview'
import { ActionBar } from '@/components/ActionBar'

import { downloadFile, copyToClipboard, saveAsFile } from '@/utils/exportJson'

import type { SourceFile } from '@/types/multiFile'

interface ToastState {
  visible: boolean
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  onUndo?: (() => void) | undefined
}

export function Home() {
  const { theme, toggle: toggleTheme } = useTheme()
  const feedback = useFeedback()

  // Multi-file merge state
  const {
    state: mergeState,
    actions: mergeActions,
    computed: mergeComputed,
    exportSettings,
  } = useMultiFileMerge()

  // Toast state
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  })

  // Copy fallback modal state
  const [showFallbackModal, setShowFallbackModal] = useState(false)
  const [fallbackContent, setFallbackContent] = useState('')

  const showToast = useCallback(
    (message: string, type: ToastState['type'] = 'info', onUndo?: (() => void) | undefined) => {
      setToast({ visible: true, message, type, onUndo })
    },
    []
  )

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  // =============================================================================
  // File Upload Handlers
  // =============================================================================

  // File upload handlers
  const handleFilesSelected = useCallback(
    (files: SourceFile[]) => {
      for (const file of files) {
        mergeActions.addSourceFile(file)
      }

      if (files.length > 0) {
        const message =
          files.length === 1
            ? `Added "${files[0]?.name}"`
            : `Added ${files.length} files`
        showToast(message, 'success')
      }
    },
    [mergeActions, showToast]
  )

  const handleDuplicateDetected = useCallback(
    (fileName: string, existingFileName: string) => {
      showToast(
        `"${fileName}" is identical to "${existingFileName}"`,
        'warning'
      )
    },
    [showToast]
  )

  // Paste input handler
  const handlePasteProcessed = useCallback(
    (file: SourceFile) => {
      mergeActions.addSourceFile(file)
      showToast(`Added pasted content`, 'success')
    },
    [mergeActions, showToast]
  )

  // Source file list handlers
  const handleReorderFiles = useCallback(
    (orderedIds: string[]) => {
      mergeActions.reorderSourceFiles(orderedIds)
    },
    [mergeActions]
  )

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      const file = mergeState.sourceFiles.find((f) => f.id === fileId)
      mergeActions.removeSourceFile(fileId)
      if (file) {
        showToast(`Removed "${file.name}"`, 'info', mergeActions.undo)
      }
    },
    [mergeState.sourceFiles, mergeActions, showToast]
  )

  // Download handler
  const handleDownload = useCallback(() => {
    const content = exportSettings()
    downloadFile(content, 'settings.json')
    showToast('settings.json downloaded successfully!', 'success')
  }, [exportSettings, showToast])

  // Save As handler
  const handleSaveAs = useCallback(async (): Promise<{
    saved: boolean
    cancelled: boolean
  }> => {
    const content = exportSettings()
    const result = await saveAsFile(content, 'settings.json')

    if (!result.saved && result.usedNativeDialog) {
      return { saved: false, cancelled: true }
    }

    if (result.saved) {
      if (result.usedNativeDialog) {
        showToast('settings.json saved to your chosen location!', 'success')
      } else {
        showToast('settings.json downloaded successfully!', 'success')
      }
    }

    return { saved: result.saved, cancelled: false }
  }, [exportSettings, showToast])

  // Copy handler
  const handleCopy = useCallback(async (): Promise<boolean> => {
    const content = exportSettings()
    const success = await copyToClipboard(content)

    if (success) {
      showToast('Copied to clipboard!', 'success')
      return true
    } else {
      setFallbackContent(content)
      setShowFallbackModal(true)
      return false
    }
  }, [exportSettings, showToast])

  const closeFallbackModal = useCallback(() => {
    setShowFallbackModal(false)
    setFallbackContent('')
  }, [])

  // Clear all handler
  const handleClearAll = useCallback(() => {
    mergeActions.clearAll()
    showToast('Cleared all files', 'info')
  }, [mergeActions, showToast])

  // Global keyboard shortcut for Cmd+Z / Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        const activeElement = document.activeElement
        const isInInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement

        if (isInInput) {
          return
        }

        if (mergeComputed.canUndo) {
          e.preventDefault()
          mergeActions.undo()
          showToast('Action undone', 'info')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mergeComputed.canUndo, mergeActions, showToast])

  // Check if we have content to show
  const hasSourceFiles = mergeState.sourceFiles.length > 0

  return (
    <div className="min-h-screen bg-bg flex flex-col relative overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="bg-orb-1" aria-hidden="true" />
      <div className="bg-orb-2" aria-hidden="true" />

      {/* Subtle Grid Pattern */}
      <div
        className="fixed inset-0 bg-grid pointer-events-none"
        aria-hidden="true"
      />

      {/* Feedback Banner */}
      <FeedbackBanner
        visible={feedback.showBanner}
        onOpenForm={feedback.openModal}
        onDismiss={feedback.dismissBanner}
        testId="feedback-banner"
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 dark:border-white/5 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo Icon */}
            <div className="w-9 h-9 rounded-full bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/25">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Yes to All
              </h1>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              to="/blog"
              className="text-sm font-medium text-foreground-secondary hover:text-accent-primary transition-colors"
            >
              Blog
            </Link>
            <GitHubLink />
            <ThemeToggle
              theme={theme}
              onToggle={toggleTheme}
              testId="theme-toggle"
            />
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div
            className="mt-4 mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
              100% Free &middot; No Signup Required
            </span>
            <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Merge Claude Code Permissions
            </h2>
            <p className="text-foreground-secondary text-base leading-6 max-w-md mx-auto">
              Upload multiple settings.json files, resolve conflicts, and
              save to replace your merged permissions file.
            </p>
            <p className="text-foreground-muted text-sm mt-4 max-w-md mx-auto">
              Runs entirely in your browser. Your data never leaves your device.
            </p>
          </motion.div>

          {/* Two-Panel Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel: Source Files */}
            <motion.div
              className="w-full lg:w-[400px] flex-shrink-0 space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* File Upload */}
              <FileUpload
                onFilesSelected={handleFilesSelected}
                onDuplicateDetected={handleDuplicateDetected}
                existingFiles={mergeState.sourceFiles}
                testId="file-upload"
              />

              {/* Source File List */}
              <SourceFileList
                files={mergeState.sourceFiles}
                onReorder={handleReorderFiles}
                onRemove={handleRemoveFile}
                testId="source-file-list"
              />

              {/* Paste Input - Collapsed by default */}
              <PasteInput
                onPasteProcessed={handlePasteProcessed}
                onDuplicateDetected={handleDuplicateDetected}
                existingFiles={mergeState.sourceFiles}
                testId="paste-input"
              />
            </motion.div>

            {/* Right Panel: Merge Preview */}
            <motion.div
              className="flex-1 min-w-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <MergePreview
                permissions={mergeState.permissions}
                plugins={mergeState.plugins}
                conflicts={mergeState.conflicts}
                stats={mergeState.stats}
                excludedRuleIds={mergeState.excludedRuleIds}
                sourceFiles={mergeState.sourceFiles}
                onExcludePermission={mergeActions.excludeRule}
                onIncludePermission={mergeActions.includeRule}
                onRecategorizePermission={mergeActions.recategorizePermission}
                onExcludePlugin={mergeActions.excludeRule}
                onIncludePlugin={mergeActions.includeRule}
                onResolveConflict={mergeActions.resolveConflict}
                testId="merge-preview"
              />
            </motion.div>
          </div>

          {/* Action Bar */}
          {hasSourceFiles && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <ActionBar
                onCopy={handleCopy}
                onDownload={handleDownload}
                onSaveAs={handleSaveAs}
                canExport={mergeComputed.canExport}
                exportDisabledReason={
                  !mergeComputed.canExport
                    ? mergeComputed.unresolvedConflictCount > 0
                      ? 'Resolve all conflicts before exporting'
                      : 'No valid files to export'
                    : undefined
                }
                onClearAll={handleClearAll}
                testId="action-bar"
              />
            </motion.div>
          )}

          {/* Empty State */}
          {!hasSourceFiles && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-bg-tertiary to-bg-secondary mb-5 shadow-lg">
                <svg
                  className="w-8 h-8 text-foreground-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Get started
              </h3>
              <p className="text-foreground-secondary max-w-md mx-auto">
                Drag and drop your settings.json files above, or click to
                browse. You can also paste JSON content directly.
              </p>
              <p className="text-foreground-muted text-sm mt-4">
                No account needed. Everything runs locally in your browser.
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 dark:border-white/5 py-5">
        <div className="max-w-7xl mx-auto text-center text-sm text-foreground-muted px-6">
          <p className="text-foreground-secondary">
            Free forever &middot; No signup &middot; No data collection
          </p>
          <p className="mt-2">
            Made for managing{' '}
            <a
              href="https://docs.anthropic.com/en/docs/claude-code/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
            >
              Claude Code permissions
            </a>
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <GitHubLink label="Open source on GitHub" className="text-foreground-muted" />
            <button
              onClick={feedback.openModal}
              className="text-foreground-muted hover:text-accent-primary transition-colors"
            >
              Give Feedback
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onUndo={toast.onUndo}
        onDismiss={hideToast}
        testId="toast"
      />

      {/* Copy Fallback Modal */}
      <CopyFallbackModal
        visible={showFallbackModal}
        content={fallbackContent}
        onClose={closeFallbackModal}
        testId="copy-fallback-modal"
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedback.showModal}
        onClose={feedback.closeModal}
        onSuccess={feedback.markAsSubmitted}
        onShowToast={(message, type) => showToast(message, type)}
        testId="feedback-modal"
      />

    </div>
  )
}
