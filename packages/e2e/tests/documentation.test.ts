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
  const blogLink = page.getByRole('link', { name: 'Blog', exact: true })
  await expect(blogLink).toHaveAttribute('href', 'https://lvce-editor.github.io/blog/')
  await page.getByRole('link', { name: 'Your first extension', exact: false }).click()
  await expect(page.getByRole('heading', { name: /^Your first extension/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute(
    'href',
    'https://lvce-editor.github.io/blog/',
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'Extension source', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'mobile navigation' }).click()
  const mobileBlogLink = page.locator('.VPNavScreenMenu').getByRole('link', { name: 'Blog', exact: true })
  await expect(mobileBlogLink).toHaveAttribute('href', 'https://lvce-editor.github.io/blog/')
  await mobileBlogLink.focus()
  await expect(mobileBlogLink).toBeFocused()
})

test('documentation pages omit the outline while keeping navigation and heading links', async ({ page }) => {
  await page.goto('./use/first-project')
  await expect(page.getByRole('heading', { name: 'On this page' })).toBeHidden()
  await expect(page.locator('.outline-link')).toHaveCount(0)
  await expect(page.locator('.VPSidebar')).toBeVisible()
  await expect(page.locator('.header-anchor').first()).toBeAttached()
  await expect(page.getByRole('heading', { name: 'Open your first project' })).toBeVisible()

  await page.getByRole('link', { name: 'Find and replace' }).click()
  await expect(page).toHaveURL(/\/use\/search$/)
  await expect(page.getByRole('heading', { name: 'On this page' })).toBeHidden()
  await expect(page.locator('.outline-link')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Find and replace' })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'On this page' })).toBeHidden()
  await expect(page.locator('.outline-link')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'On this page' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('playground examples break out from prose on wide screens and stay contained on smaller screens', async ({
  page,
}) => {
  await page.goto('./extensions/hello-world')
  const example = page.locator('.live-example').first()
  const prose = page.locator('.vp-doc p').first()

  await page.setViewportSize({ width: 1440, height: 900 })
  const wide = await example.boundingBox()
  const text = await prose.boundingBox()
  expect(wide).not.toBeNull()
  expect(text).not.toBeNull()
  expect(wide!.width).toBeGreaterThan(text!.width)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  for (const width of [1024, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const bounds = await example.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
  }
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

test('sidebar counter tutorial links to its runnable checkpoint and explains the click flow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./extensions/sidebar-counter')
  await expect(page.getByRole('heading', { name: 'Build a sidebar counter' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '1. Create the extension shell' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '4. Make the count interactive' })).toBeVisible()
  await expect(page.locator('.guide-diagram svg')).toHaveAttribute('role', 'img')
  await expect(page.locator('.guide-pulse')).toBeHidden()
  await expect(page.locator('.guide-diagram figcaption')).toHaveText(
    'A click updates the instance state; the next render displays the new count.',
  )
  const example = page.frameLocator('iframe')
  await expect(example.locator('[data-playground-snapshot] .SidebarCounterValue')).toContainText('Count: 0')
  await expect(example.getByRole('button', { name: 'Increment' })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
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

test('embedded sample tabs cannot be dragged in either pane', async ({ page }) => {
  for (const sample of ['hello-world', 'syntax-highlighting']) {
    await page.goto(`./extensions/${sample}`)
    const example = page.frameLocator('iframe')
    await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
    await example.locator('#snapshot-source-ide textarea').focus()
    await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')

    for (const selector of ['#source-ide .MainTab', '#preview-ide .MainTab']) {
      const tab = example.locator(selector).first()
      await expect(tab).toBeVisible()
      const result = await tab.evaluate((element) => {
        const event = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer: new DataTransfer(),
        })
        element.dispatchEvent(event)
        const dragover = new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer: new DataTransfer(),
        })
        element.dispatchEvent(dragover)
        const drop = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer: new DataTransfer(),
        })
        element.dispatchEvent(drop)
        return {
          dragPrevented: event.defaultPrevented,
          dragoverPrevented: dragover.defaultPrevented,
          dropPrevented: drop.defaultPrevented,
          dropEffect: dragover.dataTransfer?.dropEffect,
          draggable: (element as HTMLElement).draggable,
        }
      })
      expect(result.dragPrevented).toBe(true)
      expect(result.dragoverPrevented).toBe(true)
      expect(result.dropPrevented).toBe(true)
      expect(result.dropEffect).toBe('none')
      expect(result.draggable).toBe(false)
    }
  }
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

test('TypeScript rename supports cancellation, references and saving the preview', async ({ page }) => {
  // Three TS7 requests plus preview rebuilding took 58s; keep per-action waits unchanged.
  test.setTimeout(90_000)
  const dialogs: string[] = []
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message())
    await dialog.dismiss()
  })
  await page.goto('./extensions/hello-world')
  const example = page.frameLocator('iframe')
  await example.locator('#snapshot-source-ide .EditorRow').first().click()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
  const frame = await focusSource(page)
  const rows = example.locator('#source-ide .EditorRows .EditorRow')
  await expect(rows.first()).toBeVisible()
  const original = await rows.allTextContents()
  const openRename = async () => {
    await focusSource(page)
    await frame.evaluate(async () => {
      const { entry } = await fetch(`${document.body.dataset.routePrefix}/runtime.json`).then((response) =>
        response.json(),
      )
      const renderer = await import(entry)
      const uid = Number(document.querySelector<HTMLElement>('#source-ide .Editor')!.dataset.uid)
      await renderer.executeCommand(
        'Application.execute',
        'source',
        'Viewlet.executeViewletCommand',
        uid,
        'cursorSet',
        2,
        7,
      )
      await renderer.executeCommand('Application.execute', 'source', 'Viewlet.executeViewletCommand', uid, 'openRename')
    })
    const input = example.locator('#source-ide .RenameInputBox')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('main')
    return input
  }
  const cancelled = await openRename()
  await cancelled.fill('cancelledName')
  await page.keyboard.press('Escape')
  await expect(cancelled).toBeHidden()
  await expect(rows).toHaveText(original)
  const input = await openRename()
  await input.fill('runSample')
  await page.keyboard.press('Enter')
  await expect(input).toBeHidden()
  await expect(rows).toHaveText(
    original.map((line) => line.replace('const main =', 'const runSample =').replace('main()', 'runSample()')),
  )
  await focusSource(page)
  await page.keyboard.press('ControlOrMeta+s')
  await expect(example.locator('body')).toHaveAttribute('data-preview-revision', '2')
  await expect(example.locator('#preview-ide .NotificationMessage').last()).toHaveText('Hello World!')
  expect(dialogs).toEqual([])
})

test('switching playground tabs preserves page scroll during and after activation', async ({ page }) => {
  await page.goto('./extensions/hello-world')
  const example = page.frameLocator('iframe')
  const extensionTab = example.getByRole('tab', { name: 'extension.json Close' })
  const mainTab = example.getByRole('tab', { name: 'main.ts Close' })
  const iframeBox = await page.locator('iframe').boundingBox()
  expect(iframeBox).not.toBeNull()
  const tabTop = await extensionTab.evaluate((tab) => tab.getBoundingClientRect().top)
  await page.evaluate((top) => window.scrollTo(0, Math.max(50, top - 50)), iframeBox!.y + tabTop)
  const scrollPosition = await page.evaluate(() => window.scrollY)
  const dispatchTabMouseDown = async (tab: typeof extensionTab) => {
    const defaultPrevented = await tab.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect()
      const init = {
        bubbles: true,
        button: 0,
        buttons: 1,
        cancelable: true,
        clientX: x + width / 2,
        clientY: y + height / 2,
      }
      const event = new MouseEvent('mousedown', init)
      element.dispatchEvent(event)
      return event.defaultPrevented
    })
    return defaultPrevented
  }
  expect(await dispatchTabMouseDown(extensionTab)).toBe(true)
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
  await expect(extensionTab).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollPosition)

  await dispatchTabMouseDown(mainTab)
  await expect(mainTab).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollPosition)
  await dispatchTabMouseDown(extensionTab)
  await expect(extensionTab).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollPosition)
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

test('the first click on the manifest tab activates and selects its live editor', async ({ page }) => {
  await page.goto('./extensions/hello-world')
  const example = page.frameLocator('iframe')
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  const manifest = example.locator('[data-playground-snapshot] [data-application="source"] [role="tab"]', {
    hasText: 'extension.json',
  })
  await expect(manifest).toBeVisible()
  await manifest.click()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
  await expect(example.locator('#source-ide [role="tab"]').filter({ hasText: 'extension.json' })).toBeVisible()
  await expect(example.locator('#source-ide .EditorRows')).toContainText('"name"')
  await example.locator('#source-ide [role="tab"]').filter({ hasText: 'main.ts' }).click()
  await expect(example.locator('#source-ide .EditorRows')).toContainText('Hello World!')
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

test('custom view tutorial previews an editable sidebar counter', async ({ page }) => {
  let workers = 0
  page.on('worker', () => workers++)
  await page.goto('./extensions/')
  await page.getByRole('link', { name: 'Custom views', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: /^Create a custom view/ })).toBeVisible()
  const example = page.frameLocator('iframe')
  const counter = example.locator('#preview-ide .SidebarCounter')
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  await expect(example.locator('#snapshot-preview-ide .SidebarCounter').getByRole('status')).toHaveText('Count: 0')
  await expect(example.locator('#snapshot-preview-ide .ActivityBar')).toBeVisible()
  expect(workers).toBe(0)

  await example.locator('#snapshot-preview-ide .SidebarCounter').getByRole('button', { name: 'Increment' }).click()
  await expect(counter.getByRole('status')).toHaveText('Count: 1')
  await counter.getByRole('button', { name: 'Decrement' }).focus()
  await page.keyboard.press('Enter')
  await expect(counter.getByRole('status')).toHaveText('Count: 0')

  await replaceMatch(page, 'count += 1', 'count += 2')
  await page.keyboard.press('ControlOrMeta+s')
  await expect(example.locator('body')).toHaveAttribute('data-preview-revision', '2')
  await counter.getByRole('button', { name: 'Increment' }).click()
  await expect(counter.getByRole('status')).toHaveText('Count: 2')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  await expect(example.locator('#snapshot-preview-ide .SidebarCounter').getByRole('status')).toHaveText('Count: 0')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Running extension', exact: true }).click()
  await expect(example.locator('html')).toHaveAttribute('data-pane', 'preview')
  await expect(
    example.locator('#snapshot-preview-ide .SidebarCounter').getByRole('button', { name: 'Increment' }),
  ).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
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

for (const theme of ['light', 'dark']) {
  test(`${theme} website palette reaches static and live IDEs without resetting edits`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('vitepress-theme-appearance', theme), theme)
    let workers = 0
    page.on('worker', () => workers++)
    await page.goto('./extensions/hello-world')
    const example = page.frameLocator('iframe')
    await expect(example.locator('html')).toHaveClass(theme)
    const assertPalette = async () => {
      const background = await page
        .locator('.live-example')
        .evaluate((element) => getComputedStyle(element).backgroundColor)
      const accent = await page.locator('.example-caption a').evaluate((element) => getComputedStyle(element).color)
      await expect(example.locator('.Editor').first()).toHaveCSS('background-color', background)
      await expect(example.locator('.MainTabSelected').first()).toHaveCSS('background-color', background)
      await expect(example.locator('.Token.Keyword').first()).toHaveCSS('color', accent)
      const toolbar = await page
        .locator('.example-toolbar')
        .evaluate((element) => getComputedStyle(element).backgroundColor)
      await expect(example.locator('.Notification').first()).toHaveCSS('background-color', toolbar)
    }
    await assertPalette()
    const opposite = theme === 'light' ? 'dark' : 'light'
    await page.getByRole('switch').click()
    await expect(example.locator('html')).toHaveClass(opposite)
    await assertPalette()
    await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
    expect(workers).toBe(0)
    await example.locator('#snapshot-source-ide textarea').focus()
    await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
    await focusSource(page)
    await page.keyboard.type('// keep this edit\n')
    await expect(example.locator('#source-ide .EditorRow').first()).toHaveText('// keep this edit')
    await assertPalette()
    await page.getByRole('switch').click()
    await expect(example.locator('html')).toHaveClass(theme)
    await assertPalette()
    await expect(example.locator('#source-ide .EditorRow').first()).toHaveText('// keep this edit')
    await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
    await expect(example.locator('body')).toHaveAttribute('data-preview-revision', '1')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(example.locator('html')).toHaveClass(theme)
    await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
    await assertPalette()
  })
}

test('standalone playground follows the system theme without starting workers', async ({ page }) => {
  let workers = 0
  page.on('worker', () => workers++)
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('./playground/hello-world/')
  await expect(page.locator('html')).toHaveClass('dark')
  await expect(page.locator('.Editor').first()).toHaveCSS('background-color', 'rgb(17, 30, 38)')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveClass('light')
  await expect(page.locator('.Editor').first()).toHaveCSS('background-color', 'rgb(250, 252, 253)')
  await expect(page.locator('body')).toHaveAttribute('data-playground-state', 'static')
  expect(workers).toBe(0)
})
