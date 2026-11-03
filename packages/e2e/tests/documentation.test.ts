import { expect, test, type Page } from '@playwright/test'

const focusSource = async (page: Page) => {
  const frame = page.frames().find((frame) => frame.url().includes('/playground/'))!
  await frame.locator('#source-ide textarea').focus()
  // DOM focus precedes the worker publishing the editor's keybindings.
  await frame.evaluate(async () => {
    const { entry } = await fetch(`${document.body.dataset.routePrefix}/runtime.json`).then((response) =>
      response.json(),
    )
    const renderer = await import(entry)
    const editor = document.querySelector<HTMLElement>('#source-ide .Editor')!
    await renderer.executeShortcut(
      'Application.execute',
      'source',
      'Viewlet.executeViewletCommand',
      Number(editor.dataset.uid),
      'handleFocus',
    )
  })
  return frame
}

const replaceMatch = async (page: Page, search: string, replacement: string) => {
  const frame = await focusSource(page)
  await page.keyboard.press('ControlOrMeta+f')
  const input = frame.locator('#source-ide .FindWidget .MultilineInputBox')
  await expect(input).toBeVisible()
  await input.fill(search)
  await expect(frame.locator('#source-ide .FindWidgetMatchCount')).toHaveText('1 of 1')
  await page.keyboard.press('Escape')
  await expect(input).toBeHidden()
  await focusSource(page)
  await page.keyboard.type(replacement)
  await expect(frame.locator('#source-ide .EditorRows')).toContainText(replacement)
}

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return
  for (const frame of page.frames().filter((frame) => frame.url().includes('/playground/'))) {
    const state = await frame
      .evaluate(() => ({
        state: { ...document.body.dataset },
        status: document.querySelector('#preview-status')?.textContent,
        source: document.querySelector('#source-ide .EditorRows')?.textContent,
        preview: document.querySelector('#preview-ide')?.textContent,
      }))
      .catch((error: unknown) => String(error))
    await testInfo.attach('playground-state', { body: JSON.stringify(state, null, 2), contentType: 'application/json' })
    console.log('Playground failure state:', state)
  }
})

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
  await replaceMatch(page, 'Hello World!', 'Edited from the docs')
  await page.keyboard.press('ControlOrMeta+s')
  await expect(
    example.locator('#preview-ide .NotificationMessage').filter({ hasText: 'Edited from the docs' }),
  ).toHaveCount(1)
  await focusSource(page)
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type('\nconst broken =')
  await page.keyboard.press('ControlOrMeta+s')
  await expect(example.locator('#preview-status')).toContainText('Error')
  await expect(
    example.locator('#preview-ide .NotificationMessage').filter({ hasText: 'Edited from the docs' }),
  ).toHaveCount(1)
  await expect(example.locator('body')).toHaveAttribute('data-preview-revision', '2')
  await focusSource(page)
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type(' 1')
  await page.keyboard.press('ControlOrMeta+s')
  await expect(example.locator('body')).toHaveAttribute('data-preview-revision', '3')
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
  await replaceMatch(page, 'Numeric', 'String')
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
