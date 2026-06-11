import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { FileUpload } from './index'
import { hashContent, MAX_FILE_SIZE } from '@/utils/fileUtils'
import { makeSourceFile } from '@/test/factories'
import type { SourceFile } from '@/types/multiFile'

function uploadFiles(files: File[]) {
  const input = screen.getByTestId('file-upload-input')
  fireEvent.change(input, { target: { files } })
}

describe('FileUpload', () => {
  it('processes a valid settings.json file and reports it as valid', async () => {
    const onFilesSelected = vi.fn()
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    uploadFiles([
      new File(['{"permissions":{"allow":["Bash(npm:*)"]}}'], 'settings.json', {
        type: 'application/json',
      }),
    ])

    await waitFor(() => expect(onFilesSelected).toHaveBeenCalledTimes(1))

    const sourceFiles = onFilesSelected.mock.calls[0]?.[0] as SourceFile[]
    expect(sourceFiles).toHaveLength(1)
    expect(sourceFiles[0]?.validationStatus.status).toBe('valid')
    expect(sourceFiles[0]?.permissionCount).toBe(1)
    expect(sourceFiles[0]?.name).toBe('settings.json')
  })

  it('still adds a file with malformed JSON but surfaces an error message', async () => {
    const onFilesSelected = vi.fn()
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    uploadFiles([new File(['{ not json'], 'broken.json')])

    await waitFor(() => expect(onFilesSelected).toHaveBeenCalledTimes(1))

    const sourceFiles = onFilesSelected.mock.calls[0]?.[0] as SourceFile[]
    expect(sourceFiles[0]?.validationStatus.status).toBe('invalid')

    const feedback = await screen.findByTestId('file-upload-feedback')
    expect(feedback).toHaveTextContent('broken.json')
  })

  it('warns when the JSON is valid but contains no permissions', async () => {
    const onFilesSelected = vi.fn()
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    uploadFiles([new File(['{"permissions":{}}'], 'empty.json')])

    await waitFor(() => expect(onFilesSelected).toHaveBeenCalledTimes(1))

    const feedback = await screen.findByTestId('file-upload-feedback')
    expect(feedback).toHaveTextContent('no permissions')
  })

  it('rejects oversized files without selecting them', async () => {
    const onFilesSelected = vi.fn()
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    uploadFiles([new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], 'huge.json')])

    const feedback = await screen.findByTestId('file-upload-feedback')
    expect(feedback).toHaveTextContent('exceeds maximum')
    expect(onFilesSelected).not.toHaveBeenCalled()
  })

  it('ignores files without a .json extension', async () => {
    const onFilesSelected = vi.fn()
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    // useDropZone filters non-matching extensions before they reach the handler
    uploadFiles([new File(['{}'], 'settings.txt'), new File(['{"permissions":{"allow":["Read"]}}'], 'ok.json')])

    await waitFor(() => expect(onFilesSelected).toHaveBeenCalledTimes(1))

    const sourceFiles = onFilesSelected.mock.calls[0]?.[0] as SourceFile[]
    expect(sourceFiles).toHaveLength(1)
    expect(sourceFiles[0]?.name).toBe('ok.json')
  })

  it('detects duplicate content against existing files', async () => {
    const content = '{"permissions":{"allow":["Read"]}}'
    const existing = makeSourceFile(JSON.parse(content), { name: 'original.json' })
    existing.contentHash = await hashContent(content)

    const onFilesSelected = vi.fn()
    const onDuplicateDetected = vi.fn()
    render(
      <FileUpload
        onFilesSelected={onFilesSelected}
        onDuplicateDetected={onDuplicateDetected}
        existingFiles={[existing]}
      />
    )

    uploadFiles([new File([content], 'copy.json')])

    await waitFor(() =>
      expect(onDuplicateDetected).toHaveBeenCalledWith('copy.json', 'original.json')
    )
    expect(onFilesSelected).not.toHaveBeenCalled()
  })
})
