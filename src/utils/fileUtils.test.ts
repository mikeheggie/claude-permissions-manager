import { describe, it, expect } from 'vitest'
import {
  validateFile,
  hashContent,
  isDuplicateContent,
  findDuplicateFile,
  readFileAsText,
  generateId,
  MAX_FILE_SIZE,
} from './fileUtils'
import { makeSourceFile } from '@/test/factories'

describe('validateFile', () => {
  it('accepts a normal .json file', () => {
    const file = new File(['{}'], 'settings.json', { type: 'application/json' })

    expect(validateFile(file)).toEqual({ isValid: true })
  })

  it('accepts uppercase .JSON extensions', () => {
    const file = new File(['{}'], 'SETTINGS.JSON')

    expect(validateFile(file).isValid).toBe(true)
  })

  it('rejects non-JSON extensions', () => {
    const file = new File(['{}'], 'settings.txt')
    const result = validateFile(file)

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Invalid file type')
  })

  it('rejects files over the 1MB size limit', () => {
    const big = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], 'big.json')
    const result = validateFile(big)

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('exceeds maximum')
  })

  it('rejects empty files', () => {
    const empty = new File([], 'empty.json')
    const result = validateFile(empty)

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('File is empty')
  })
})

describe('readFileAsText', () => {
  it('reads file content as a string', async () => {
    const file = new File(['{"permissions":{}}'], 'a.json')

    await expect(readFileAsText(file)).resolves.toBe('{"permissions":{}}')
  })

  it('throws for oversized files before reading', async () => {
    const big = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], 'big.json')

    await expect(readFileAsText(big)).rejects.toThrow('exceeds maximum')
  })
})

describe('hashContent', () => {
  it('is deterministic for identical content', async () => {
    const a = await hashContent('{"permissions":{}}')
    const b = await hashContent('{"permissions":{}}')

    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/) // SHA-256 hex
  })

  it('differs for different content', async () => {
    const a = await hashContent('{"permissions":{"allow":[]}}')
    const b = await hashContent('{"permissions":{"deny":[]}}')

    expect(a).not.toBe(b)
  })
})

describe('duplicate detection', () => {
  it('finds files with a matching content hash', () => {
    const existing = makeSourceFile({ permissions: {} }, { name: 'original.json' })

    expect(isDuplicateContent(existing.contentHash, [existing])).toBe(true)
    expect(findDuplicateFile(existing.contentHash, [existing])?.name).toBe('original.json')
  })

  it('returns false/undefined when no hash matches', () => {
    const existing = makeSourceFile({ permissions: {} })

    expect(isDuplicateContent('other-hash', [existing])).toBe(false)
    expect(findDuplicateFile('other-hash', [existing])).toBeUndefined()
    expect(isDuplicateContent('any', [])).toBe(false)
  })
})

describe('generateId', () => {
  it('produces unique UUID-shaped ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))

    expect(ids.size).toBe(100)
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    }
  })
})
