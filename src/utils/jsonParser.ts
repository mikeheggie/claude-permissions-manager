/**
 * JSON Parser with error line/column reporting
 * and settings.json schema validation
 */

import type { ParseResult, ParseError, SettingsConfiguration, DefaultMode } from '@/types/permissions'

/**
 * Extract line and column number from JSON.parse error message.
 * Different browsers format the error differently.
 */
function extractLineColumn(errorMessage: string, input: string): { line?: number; column?: number } {
  // Try to extract position from error message patterns:
  // Chrome/V8: "at position 123"
  // Firefox: "at line 1 column 23"
  // Safari: "at character 123"

  // Pattern 1: "at line X column Y"
  const lineColMatch = errorMessage.match(/at line (\d+) column (\d+)/i)
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1] ?? '0', 10),
      column: parseInt(lineColMatch[2] ?? '0', 10),
    }
  }

  // Pattern 2: "at position N" - convert to line/column
  const posMatch = errorMessage.match(/at position (\d+)/i)
  if (posMatch) {
    const position = parseInt(posMatch[1] ?? '0', 10)
    return positionToLineColumn(input, position)
  }

  // Pattern 3: "at character N"
  const charMatch = errorMessage.match(/at character (\d+)/i)
  if (charMatch) {
    const position = parseInt(charMatch[1] ?? '0', 10)
    return positionToLineColumn(input, position)
  }

  return {}
}

/**
 * Convert character position to line and column numbers.
 */
function positionToLineColumn(input: string, position: number): { line: number; column: number } {
  const lines = input.substring(0, position).split('\n')
  const line = lines.length
  const column = (lines[lines.length - 1]?.length ?? 0) + 1
  return { line, column }
}

/**
 * Check if a value is a valid DefaultMode.
 */
function isValidDefaultMode(value: unknown): value is DefaultMode {
  return value === 'acceptEdits' || value === 'askEveryTime' || value === 'ignoreAll'
}

/**
 * Validate that a parsed object matches the settings.json schema.
 */
export function validateSettingsSchema(obj: unknown): obj is SettingsConfiguration {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const record = obj as Record<string, unknown>

  // Check permissions object exists
  if (typeof record.permissions !== 'object' || record.permissions === null) {
    return false
  }

  const permissions = record.permissions as Record<string, unknown>

  // Check allow, deny, ask arrays - they're optional but must be string arrays if present
  const categories = ['allow', 'deny', 'ask'] as const
  for (const category of categories) {
    const arr = permissions[category]
    if (arr === undefined) {
      continue // Arrays are optional
    }
    if (!Array.isArray(arr)) {
      return false
    }
    for (const item of arr) {
      if (typeof item !== 'string') {
        return false
      }
    }
  }

  // Check defaultMode if present
  if (permissions.defaultMode !== undefined) {
    if (!isValidDefaultMode(permissions.defaultMode)) {
      return false
    }
  }

  // Check enabledPlugins if present
  if (record.enabledPlugins !== undefined) {
    if (typeof record.enabledPlugins !== 'object' || record.enabledPlugins === null) {
      return false
    }
    const plugins = record.enabledPlugins as Record<string, unknown>
    for (const value of Object.values(plugins)) {
      if (typeof value !== 'boolean') {
        return false
      }
    }
  }

  return true
}

/**
 * Generate a helpful error message for common JSON issues.
 */
function getHelpfulErrorMessage(error: Error, input: string): string {
  const originalMessage = error.message

  // Check for trailing comma (common mistake)
  if (input.includes(',]') || input.includes(',}')) {
    return 'Trailing comma detected. JSON does not allow trailing commas.'
  }

  // Check for single quotes (common mistake)
  if (input.includes("'")) {
    return 'Single quotes detected. JSON requires double quotes for strings.'
  }

  // Check for unquoted keys
  const unquotedKeyMatch = input.match(/{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/)
  if (unquotedKeyMatch && !input.match(/"[a-zA-Z_][a-zA-Z0-9_]*"\s*:/)) {
    return `Unquoted key detected ("${unquotedKeyMatch[1]}"). JSON keys must be quoted.`
  }

  return originalMessage
}

/**
 * Parse a JSON string and return a ParseResult with helpful error information.
 */
export function parseJson(input: string): ParseResult {
  // Handle empty input
  if (!input.trim()) {
    return {
      success: false,
      error: {
        message: 'Input is empty',
      },
    }
  }

  try {
    const parsed: unknown = JSON.parse(input)

    // Validate schema
    if (!validateSettingsSchema(parsed)) {
      return {
        success: false,
        error: {
          message: 'Invalid settings.json schema. Expected { permissions: { ... } }',
        },
      }
    }

    return {
      success: true,
      data: parsed,
    }
  } catch (e) {
    const error = e as Error
    const { line, column } = extractLineColumn(error.message, input)
    const helpfulMessage = getHelpfulErrorMessage(error, input)

    const parseError: ParseError = {
      message: helpfulMessage,
    }

    if (line !== undefined) {
      parseError.line = line
    }
    if (column !== undefined) {
      parseError.column = column
    }

    return {
      success: false,
      error: parseError,
    }
  }
}

/**
 * Count the total number of permissions in a settings configuration.
 */
export function countPermissions(config: SettingsConfiguration): number {
  return (
    (config.permissions.allow?.length ?? 0) +
    (config.permissions.deny?.length ?? 0) +
    (config.permissions.ask?.length ?? 0)
  )
}
