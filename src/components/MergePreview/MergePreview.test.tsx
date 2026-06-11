import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MergePreview } from './index'
import type { Permission } from '@/types/permissions'
import type { MergeStats } from '@/types/multiFile'

function makePermission(
  id: string,
  pattern: string,
  category: Permission['category']
): Permission {
  return {
    id,
    pattern,
    category,
    source: 'project',
    originalSource: 'project',
    sourceFileId: 'file-1',
    sourceFileName: 'a.json',
  }
}

function makeStats(overrides: Partial<MergeStats> = {}): MergeStats {
  return {
    totalPermissions: 0,
    totalPlugins: 0,
    conflictCount: 0,
    sourceFileCount: 1,
    excludedCount: 0,
    ...overrides,
  }
}

function renderPreview(permissions: Permission[], stats: MergeStats) {
  const onExcludePermission = vi.fn()
  const onRecategorizePermission = vi.fn()

  render(
    <MergePreview
      permissions={permissions}
      plugins={[]}
      conflicts={[]}
      stats={stats}
      excludedRuleIds={new Set<string>()}
      sourceFiles={[]}
      onExcludePermission={onExcludePermission}
      onRecategorizePermission={onRecategorizePermission}
      onExcludePlugin={vi.fn()}
      onResolveConflict={vi.fn()}
    />
  )

  return { onExcludePermission, onRecategorizePermission }
}

describe('MergePreview', () => {
  it('shows an empty state when nothing is loaded', () => {
    renderPreview([], makeStats({ sourceFileCount: 0 }))

    expect(screen.getByText('No files loaded yet')).toBeInTheDocument()
  })

  it('renders each merged permission as a diff line', () => {
    renderPreview(
      [
        makePermission('p1', 'Bash(npm:*)', 'allow'),
        makePermission('p2', 'Read(**/.env*)', 'deny'),
      ],
      makeStats({ totalPermissions: 2 })
    )

    expect(screen.getByTestId('diff-line-p1')).toHaveTextContent('"Bash(npm:*)"')
    expect(screen.getByTestId('diff-line-p2')).toHaveTextContent('"Read(**/.env*)"')
  })

  it('excludes a permission when its delete action is clicked', async () => {
    const user = userEvent.setup()
    const { onExcludePermission } = renderPreview(
      [makePermission('p1', 'Bash(npm:*)', 'allow')],
      makeStats({ totalPermissions: 1 })
    )

    const line = screen.getByTestId('diff-line-p1')
    await user.click(
      within(line).getByRole('button', { name: 'Delete permission' })
    )

    expect(onExcludePermission).toHaveBeenCalledWith('p1')
  })

  it('re-categorizes a permission through the dropdown', async () => {
    const user = userEvent.setup()
    const { onRecategorizePermission } = renderPreview(
      [makePermission('p1', 'Bash(rm:*)', 'allow')],
      makeStats({ totalPermissions: 1 })
    )

    const line = screen.getByTestId('diff-line-p1')
    await user.click(
      within(line).getByRole('button', { name: 'Change permission category' })
    )
    await user.click(await screen.findByRole('menuitem', { name: /Deny/ }))

    expect(onRecategorizePermission).toHaveBeenCalledWith('p1', 'deny')
  })

  it('shows a conflict banner when unresolved conflicts exist', () => {
    renderPreview(
      [makePermission('p1', 'Bash(npm:*)', 'deny')],
      makeStats({ totalPermissions: 1, conflictCount: 2 })
    )

    expect(screen.getByText('2 conflicts detected')).toBeInTheDocument()
  })
})
