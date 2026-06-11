/**
 * DiffOutputView helpers
 *
 * Non-component utilities shared by the diff output components. Kept separate
 * from the component files so each of those only exports components (required
 * for React Fast Refresh).
 */

import type { PermissionCategory } from '@/types/permissions'
import type { CategoryDisplay } from '@/types/diffOutput'

export const CATEGORY_DISPLAY: Record<PermissionCategory, CategoryDisplay> = {
  allow: {
    label: 'Allow',
    color: 'text-category-allow',
  },
  deny: {
    label: 'Deny',
    color: 'text-category-deny',
  },
  ask: {
    label: 'Ask',
    color: 'text-category-ask',
  },
}

/**
 * Gets the available target categories (excludes current).
 */
export function getOtherCategories(
  currentCategory: PermissionCategory
): [PermissionCategory, PermissionCategory] {
  const allCategories: PermissionCategory[] = ['allow', 'deny', 'ask']
  const others = allCategories.filter((c) => c !== currentCategory)
  return others as [PermissionCategory, PermissionCategory]
}

/**
 * Formats a permission pattern for JSON display.
 * Handles escaping of special characters.
 */
export function formatPattern(pattern: string): string {
  // Escape special JSON characters
  const escaped = pattern
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')

  return `"${escaped}"`
}

/**
 * Calculates the total line count for a category section.
 * Must stay in sync with how CategorySection renders its lines.
 */
export function getCategorySectionLineCount(permissionCount: number): number {
  if (permissionCount === 0) {
    return 1 // Empty array on single line: "category": [],
  }
  return permissionCount + 2 // opening + items + closing
}
