import { describe, it, expect } from 'vitest'
import { parseJson, validateSettingsSchema, countPermissions } from './jsonParser'

describe('parseJson', () => {
  it('parses a minimal valid settings file', () => {
    const result = parseJson('{ "permissions": { "allow": ["Bash(git status:*)"] } }')

    expect(result.success).toBe(true)
    expect(result.data?.permissions.allow).toEqual(['Bash(git status:*)'])
  })

  it('parses a full settings file with all categories, defaultMode, and plugins', () => {
    const input = JSON.stringify({
      permissions: {
        allow: ['Read', 'Bash(npm run:*)'],
        deny: ['Read(**/.env*)'],
        ask: ['Bash(git push:*)'],
        defaultMode: 'acceptEdits',
      },
      enabledPlugins: { 'plugin-a@official': true, 'plugin-b@official': false },
    })

    const result = parseJson(input)

    expect(result.success).toBe(true)
    expect(result.data?.permissions.deny).toEqual(['Read(**/.env*)'])
    expect(result.data?.permissions.defaultMode).toBe('acceptEdits')
    expect(result.data?.enabledPlugins).toEqual({
      'plugin-a@official': true,
      'plugin-b@official': false,
    })
  })

  it('rejects empty input', () => {
    const result = parseJson('   ')

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('Input is empty')
  })

  it('rejects malformed JSON with a helpful trailing-comma message', () => {
    const result = parseJson('{ "permissions": { "allow": ["a",] } }')

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Trailing comma')
  })

  it('rejects single-quoted JSON with a helpful message', () => {
    const result = parseJson("{ 'permissions': {} }")

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Single quotes')
  })

  it('rejects valid JSON that does not match the settings schema', () => {
    const result = parseJson('{ "foo": "bar" }')

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Invalid settings.json schema')
  })

  it('reports line and column for syntax errors when available', () => {
    const result = parseJson('{\n  "permissions": {\n    "allow": [oops]\n  }\n}')

    expect(result.success).toBe(false)
    // Error position formats vary across JS engines; when present they must be sane
    if (result.error?.line !== undefined) {
      expect(result.error.line).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('validateSettingsSchema', () => {
  it('accepts a permissions object with omitted optional arrays', () => {
    expect(validateSettingsSchema({ permissions: {} })).toBe(true)
    expect(validateSettingsSchema({ permissions: { allow: [] } })).toBe(true)
  })

  it('rejects non-objects and null', () => {
    expect(validateSettingsSchema(null)).toBe(false)
    expect(validateSettingsSchema('string')).toBe(false)
    expect(validateSettingsSchema(42)).toBe(false)
  })

  it('rejects a missing or null permissions key', () => {
    expect(validateSettingsSchema({})).toBe(false)
    expect(validateSettingsSchema({ permissions: null })).toBe(false)
  })

  it('rejects categories that are not arrays of strings', () => {
    expect(validateSettingsSchema({ permissions: { allow: 'Bash' } })).toBe(false)
    expect(validateSettingsSchema({ permissions: { deny: [42] } })).toBe(false)
    expect(validateSettingsSchema({ permissions: { ask: [null] } })).toBe(false)
  })

  it('rejects an invalid defaultMode value', () => {
    expect(
      validateSettingsSchema({ permissions: { defaultMode: 'yolo' } })
    ).toBe(false)
    expect(
      validateSettingsSchema({ permissions: { defaultMode: 'acceptEdits' } })
    ).toBe(true)
  })

  it('rejects enabledPlugins with non-boolean values', () => {
    expect(
      validateSettingsSchema({ permissions: {}, enabledPlugins: { a: 'yes' } })
    ).toBe(false)
    expect(
      validateSettingsSchema({ permissions: {}, enabledPlugins: { a: true } })
    ).toBe(true)
  })
})

describe('countPermissions', () => {
  it('sums all categories and treats missing arrays as zero', () => {
    expect(
      countPermissions({
        permissions: { allow: ['a', 'b'], deny: ['c'], ask: undefined },
      })
    ).toBe(3)
    expect(countPermissions({ permissions: {} })).toBe(0)
  })
})
