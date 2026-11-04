import { expect, test } from '@playwright/test'

test('reading warms startup assets without executing workers, then activates the playground', async ({ page }) => {
  let workers = 0
  page.on('worker', () => workers++)
  await page.goto('./extensions/hello-world')
  const example = page.frameLocator('iframe')
  await expect(example.locator('body')).toHaveAttribute('data-playground-cache', 'ready')
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  expect(workers).toBe(0)
  const resources = await example
    .locator('body')
    .evaluate(() => performance.getEntriesByType('resource').map((r) => r.name))
  expect(resources.some((url) => url.endsWith('/tooling.json'))).toBe(true)
  expect(resources.some((url) => url.endsWith('/rendererWorkerMain.js'))).toBe(true)
  expect(resources.some((url) => url.endsWith('/esbuild.wasm'))).toBe(true)
  const recorded = await example.locator('body').evaluate(() => {
    const value = sessionStorage.getItem(`documentation:playground-cache:${location.pathname}`)
    return value ? JSON.parse(value) : null
  })
  expect(recorded.editor).toContain('/runtime/')
  expect(recorded.revision).toMatch(/^[a-f0-9]{64}$/)
  await example.locator('#snapshot-source-ide textarea').focus()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
  await expect(example.locator('#preview-ide .NotificationMessage')).toHaveText('Hello World!')
})

test('unavailable preloading does not prevent normal activation', async ({ page }) => {
  await page.route('**/startup.json', (route) => route.fulfill({ status: 503, body: 'Try again' }))
  await page.goto('./extensions/hello-world')
  const example = page.frameLocator('iframe')
  await expect(example.locator('body')).toHaveAttribute('data-playground-cache', 'unavailable')
  await example.locator('#snapshot-source-ide textarea').focus()
  await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'live')
  await expect(example.locator('#preview-ide .NotificationMessage')).toHaveText('Hello World!')
})

test('warming works with restricted storage on repeated visits', async ({ page }) => {
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (this === sessionStorage) throw new Error('Storage unavailable')
      return setItem.call(this, key, value)
    }
  })
  for (let visit = 0; visit < 2; visit++) {
    await page.goto('./extensions/hello-world')
    const example = page.frameLocator('iframe')
    await expect(example.locator('body')).toHaveAttribute('data-playground-cache', 'ready')
    await expect(example.locator('body')).toHaveAttribute('data-playground-state', 'static')
  }
})
