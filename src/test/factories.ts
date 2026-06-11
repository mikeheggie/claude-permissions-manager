import type { SourceFile } from '@/types/multiFile'
import type { SettingsConfiguration } from '@/types/permissions'

interface MakeSourceFileOptions {
  id?: string
  name?: string
  order?: number
  invalid?: boolean
}

let fileCounter = 0

/**
 * Build a valid SourceFile fixture from a permissions configuration.
 */
export function makeSourceFile(
  config: SettingsConfiguration | null,
  options: MakeSourceFileOptions = {}
): SourceFile {
  fileCounter += 1
  const name = options.name ?? `file-${fileCounter}.json`
  const content = config ? JSON.stringify(config) : '{ not json'

  return {
    id: options.id ?? `id-${name}`,
    name,
    content,
    contentHash: `hash-${name}`,
    inputMethod: 'file',
    addedAt: Date.now(),
    order: options.order ?? 0,
    validationStatus: options.invalid
      ? { status: 'invalid', error: { message: 'Invalid JSON' }, warnings: [] }
      : { status: 'valid', error: null, warnings: [] },
    parsedConfig: options.invalid ? null : config,
    permissionCount: config
      ? (config.permissions.allow?.length ?? 0) +
        (config.permissions.deny?.length ?? 0) +
        (config.permissions.ask?.length ?? 0)
      : 0,
    pluginCount: config?.enabledPlugins ? Object.keys(config.enabledPlugins).length : 0,
  }
}
