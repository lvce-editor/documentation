import { expect, test } from '@playwright/test'

test('homepage routes readers to tasks and remains readable on a phone', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Get to know LVCE Editor.' })).toBeVisible()
  await page.getByRole('link', { name: 'Your first extension', exact: false }).click()
  await expect(page.getByRole('heading', { name: /^Your first extension/ })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'Extension source', exact: true })).toBeVisible()
})

test('source and real preview are served without JavaScript', async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false })
  try {
    await page.goto('http://127.0.0.1:4173/documentation/extensions/hello-world')
    await expect(page.getByRole('heading', { name: /^Your first extension/ })).toBeVisible()
    const example = page.frameLocator('iframe')
    await expect(example.locator('[data-playground-snapshot] .NotificationMessage')).toHaveText('Hello World!')
    await expect(example.locator('[data-application="source"]')).toContainText('registerCommand')
  } finally {
    await page.close()
  }
})

test('reading and scrolling multiple examples starts no workers', async ({ page }) => {
  let workers = 0
  page.on('worker', () => workers++)
  await page.goto('./extensions/hello-world')
  const example = page.frameLocator('iframe')
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  await expect(example.locator('[data-playground-snapshot] .NotificationMessage')).toHaveText('Hello World!')
  await page.mouse.wheel(0, 900)
  await page.goto('./extensions/syntax-highlighting')
  await expect(example.locator('[data-playground-snapshot] .Token.Keyword').first()).toBeVisible()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  expect(workers).toBe(0)
})

test('first keystrokes survive activation and saving updates the real preview', async ({ page }) => {
  let releaseRuntime: (() => void) | undefined
  const released = new Promise<void>((resolve) => {
    releaseRuntime = resolve
  })
  await page.route('**/rendererProcessMain.js', async (route) => {
    await released
    await route.continue()
  })
  await page.goto('./extensions/hello-world')
  const example = page.frameLocator('iframe')
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  const before = await example.locator('[data-application=source] .Workbench').boundingBox()
  const source = example.locator('#snapshot-source-ide textarea')
  await source.focus()
  await page.keyboard.type('// first input survives\n')
  releaseRuntime!()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
  await expect(example.locator('#source-ide .EditorRow').first()).toHaveText('// first input survives')
  const after = await example.locator('#source-ide .Workbench').boundingBox()
  expect(after?.width).toBe(before?.width)
  expect(after?.height).toBe(before?.height)
  const editor = example.locator('#source-ide textarea')
  await editor.focus()
  await page.keyboard.press('ControlOrMeta+Home')
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(
    "import { activate, registerCommand, showNotification } from '@lvce-editor/api'\nawait activate()\nregisterCommand({ id: 'sample.helloWorld', async execute() { await showNotification('info', 'Edited from the docs') } })\n",
  )
  await page.keyboard.press('ControlOrMeta+s')
  await expect(
    example.locator('#preview-ide .NotificationMessage').filter({ hasText: 'Edited from the docs' }),
  ).toHaveText('Edited from the docs')
  await editor.focus()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText('import {')
  await page.keyboard.press('ControlOrMeta+s')
  await expect(example.locator('#preview-status')).toContainText('Error')
  await expect(
    example.locator('#preview-ide .NotificationMessage').filter({ hasText: 'Edited from the docs' }),
  ).toHaveCount(1)
  await expect(example.locator('body')).toHaveAttribute('data-preview-revision', '2')
  await editor.focus()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(
    "import { activate, registerCommand, showNotification } from '@lvce-editor/api'\nawait activate()\nregisterCommand({ id: 'sample.helloWorld', async execute() { await showNotification('info', 'Recovered preview') } })\n",
  )
  await page.keyboard.press('ControlOrMeta+s')
  await expect(
    example.locator('#preview-ide .NotificationMessage').filter({ hasText: 'Recovered preview' }),
  ).toHaveCount(1)
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  await expect(example.locator('[data-playground-snapshot] .NotificationMessage')).toHaveText('Hello World!')
})

test('first pointer action is replayed, and activating one iframe leaves another idle', async ({ page }) => {
  await page.goto('./extensions/hello-world')
  // A second embedding tests application ownership without a test-only production route.
  await page.evaluate(() => {
    const original = document.querySelector('iframe')!
    const second = original.cloneNode() as HTMLIFrameElement
    second.id = 'second-example'
    document.body.append(second)
  })
  const example = page.frameLocator('iframe').first()
  await example.locator('[data-playground-snapshot] .NotificationCloseButton').click()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
  await expect(example.locator('#preview-ide .NotificationMessage')).toHaveCount(0)
  await expect(page.frameLocator('#second-example').locator('body')).toHaveAttribute('data-playground-state', 'static')
})

test('editing the actual tokenizer changes preview token styles', async ({ page }) => {
  await page.goto('./extensions/syntax-highlighting')
  const example = page.frameLocator('iframe')
  await example.locator('#snapshot-source-ide .EditorRow').first().click()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
  await expect(example.locator('#preview-ide .Token.Numeric')).not.toHaveCount(0)
  const response = await page.request.get('/documentation/playground/samples/syntax-highlighting/files.json')
  const files = (await response.json()) as Record<string, string>
  await example.locator('#source-ide textarea').focus()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(files['/src/tokenizeSprout.js'].replace("'Numeric'", "'String'"))
  await page.keyboard.press('ControlOrMeta+s')
  await expect(example.locator('body')).toHaveAttribute('data-preview-revision', '2')
  await expect(example.locator('#preview-ide .Token.Numeric')).toHaveCount(0)
  await expect(example.locator('#preview-ide .Token.String')).not.toHaveCount(0)
})

test('phone tabs show source and preview; local search finds a tutorial', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./extensions/syntax-highlighting')
  const example = page.frameLocator('iframe')
  await page.getByRole('button', { name: 'Running extension', exact: true }).click()
  await expect(example.locator('html')).toHaveAttribute('data-pane', 'preview')
  await expect(example.locator('[data-application="preview"] .Token.Keyword').first()).toBeVisible()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  await page.goto('./')
  await page.getByRole('button', { name: 'Search', exact: false }).first().click()
  await page.getByRole('searchbox').fill('language server')
  await expect(page.getByRole('option').filter({ hasText: 'Connect a language server' }).first()).toBeVisible()
})
