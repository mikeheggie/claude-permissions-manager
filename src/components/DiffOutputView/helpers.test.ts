import { describe, it, expect } from 'vitest'
import { formatPattern, getCategorySectionLineCount, getOtherCategories } from './helpers'

describe('formatPattern', () => {
  it('wraps the pattern in quotes', () => {
    expect(formatPattern('Bash(npm run:*)')).toBe('"Bash(npm run:*)"')
  })

  it('escapes embedded quotes and backslashes', () => {
    expect(formatPattern('Bash(echo "hi")')).toBe('"Bash(echo \\"hi\\")"')
    expect(formatPattern('Read(C:\\temp)')).toBe('"Read(C:\\\\temp)"')
  })

  it('escapes control characters', () => {
    expect(formatPattern('a\nb\tc')).toBe('"a\\nb\\tc"')
  })
})

describe('getCategorySectionLineCount', () => {
  it('uses a single line for an empty category', () => {
    expect(getCategorySectionLineCount(0)).toBe(1)
  })

  it('adds opening and closing bracket lines around items', () => {
    expect(getCategorySectionLineCount(1)).toBe(3)
    expect(getCategorySectionLineCount(5)).toBe(7)
  })
})

describe('getOtherCategories', () => {
  it('returns the two categories other than the current one', () => {
    expect(getOtherCategories('allow')).toEqual(['deny', 'ask'])
    expect(getOtherCategories('deny')).toEqual(['allow', 'ask'])
    expect(getOtherCategories('ask')).toEqual(['allow', 'deny'])
  })
})
