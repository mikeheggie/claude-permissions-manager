import { test, expect } from '@playwright/test'

const globalSettings = JSON.stringify({
  permissions: {
    allow: ['Bash(git status:*)', 'Bash(npm run:*)'],
    deny: ['Read(**/.env*)'],
  },
})

const projectSettings = JSON.stringify({
  permissions: {
    allow: ['Bash(npm test:*)'],
    // Conflicts with the allow rule in globalSettings
    deny: ['Bash(npm run:*)'],
  },
})

test('merges two settings files, flags the conflict, and downloads the result', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByTestId('file-upload-input').setInputFiles([
    {
      name: 'global-settings.json',
      mimeType: 'application/json',
      buffer: Buffer.from(globalSettings),
    },
    {
      name: 'project-settings.json',
      mimeType: 'application/json',
      buffer: Buffer.from(projectSettings),
    },
  ])

  // Both files appear in the source list
  await expect(page.getByTestId('source-file-list')).toContainText('global-settings.json')
  await expect(page.getByTestId('source-file-list')).toContainText('project-settings.json')

  // Merged output renders the union of rules
  const output = page.getByTestId('diff-output-view')
  await expect(output).toContainText('"Bash(git status:*)"')
  await expect(output).toContainText('"Bash(npm test:*)"')
  await expect(output).toContainText('"Read(**/.env*)"')

  // The conflicting pattern is detected and the later file wins (deny)
  await expect(page.getByText('1 conflict detected')).toBeVisible()

  // Download the merged settings.json and verify its content
  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('action-bar-download').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('settings.json')

  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer)
  }
  const merged = JSON.parse(Buffer.concat(chunks).toString('utf-8'))

  expect(merged.permissions.allow).toContain('Bash(git status:*)')
  expect(merged.permissions.allow).toContain('Bash(npm test:*)')
  expect(merged.permissions.deny).toContain('Bash(npm run:*)') // later file won
  expect(merged.permissions.allow).not.toContain('Bash(npm run:*)')
})

test('blog index lists posts and renders an article', async ({ page }) => {
  await page.goto('/blog')

  const postLink = page.getByRole('link', {
    name: /Claude Code Settings\.json: A Simple Permissions Guide/,
  })
  await expect(postLink).toBeVisible()
  await postLink.click()

  await expect(
    page.getByRole('heading', { name: /A Simple Permissions Guide/ })
  ).toBeVisible()
  // MDX content rendered, including a highlighted code block
  await expect(page.locator('article pre code').first()).toBeVisible()
})
