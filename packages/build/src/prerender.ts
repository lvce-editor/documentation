import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { playgroundBase, site } from './paths.ts'
import { serve } from './server.ts'

const embeddedCss = `
html, body { width:100%; height:100%; }
[data-playground-snapshot], [data-playground-live] { position:absolute; inset:0; }
[data-playground-snapshot] .Workbench { width:100%!important; height:100%!important; }
.ActivationError { position:fixed; bottom:0; margin:0; padding:16px; background:#422; color:#fff; z-index:100; }
@media(max-width:700px) {
  .IdePair { display:block; position:relative; }
  .IdePane { position:absolute; inset:0; border:0; }
  .PreviewDivider { display:none; }
  html:not([data-pane="preview"]) .IdePane[aria-label="Preview IDE"],
  html[data-pane="preview"] .IdePane[aria-label="Source IDE"] { visibility:hidden; pointer-events:none; }
}
`

export const prerender = async (directory: string, ids: string[]) => {
  for (const name of ['palette.css', 'playground.css', 'playground-theme.js', 'playground-preload.js']) {
    await copyFile(resolve(site, '.vitepress/theme', name), resolve(directory, 'assets', name))
  }
  const server = await serve(directory, playgroundBase)
  const browser = await chromium.launch()
  try {
    for (const id of ids) {
      const file = resolve(directory, id, 'index.html')
      const html = await readFile(file, 'utf8')
      const sourceEntry = id === 'syntax-highlighting' ? 'src/tokenizeSprout.js' : 'src/main.ts'
      // Sidebar views need the normal playground layout: embedded mode hides
      // the sidebar that hosts the counter. Deferred activation is independent.
      const embedded = id !== 'sidebar-counter'
      const prepared = html
        .replace('<body ', `<body data-embedded="${embedded}" data-source-entry="${sourceEntry}" `)
        .replace(
          '</head>',
          `<script src="../assets/playground-theme.js"></script><link rel="stylesheet" href="../assets/palette.css"><link rel="stylesheet" href="../assets/playground.css"><style>${embeddedCss}</style></head>`,
        )
      await writeFile(file, prepared)
      const page = await browser.newPage({ viewport: { width: 1080, height: 440 } })
      // Compilation is lazy on first save, so it is not observed during the
      // initial pristine preview. Warm it as well for the first edit.
      const requests = new Set(
        ['compiler.js', 'esbuild.wasm', 'api.js'].map((name) => `${playgroundBase}assets/${name}`),
      )
      page.context().on('response', (response) => {
        const url = new URL(response.url())
        if (response.ok() && url.origin === server.origin && url.pathname.startsWith(playgroundBase)) {
          // The channel is a random per-activation identifier, not an asset version.
          url.searchParams.delete('channel')
          requests.add(url.pathname + url.search)
        }
      })
      try {
        await page.goto(`${server.origin}${playgroundBase}${id}/`)
        await page.waitForFunction(() => document.body.dataset.playgroundReady === 'true', undefined, {
          timeout: 60_000,
        })
        await page.locator('#source-ide .EditorRow .Token').first().waitFor()
        if (id === 'hello-world') await page.locator('#preview-ide .NotificationMessage').waitFor()
        else if (id === 'sidebar-counter')
          await page.locator('#preview-ide .SidebarCounter').getByRole('status').waitFor()
        else await page.locator('#preview-ide .Token.Keyword').first().waitFor()
        await page.evaluate(() => document.fonts.ready)
        const snapshot = await page.evaluate(() => {
          const main = document.querySelector('main')!.cloneNode(true) as HTMLElement
          let css = document.adoptedStyleSheets
            .map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join('\n'))
            .join('\n')
          for (const element of main.querySelectorAll<HTMLElement>('[id]')) {
            const id = element.id
            css = css.replaceAll(`#${id}`, `#snapshot-${id}`)
            if (id === 'source-ide' || id === 'preview-ide') element.dataset.application = id.replace('-ide', '')
            element.id = `snapshot-${id}`
          }
          for (const textarea of main.querySelectorAll('textarea')) {
            textarea.setAttribute(
              'aria-label',
              textarea.closest<HTMLElement>('[data-application]')?.dataset.application === 'source'
                ? 'Extension source'
                : 'Running extension',
            )
          }
          return { html: main.outerHTML, css }
        })
        await page.waitForLoadState('networkidle')
        const assets = [...requests].filter((url) => !url.endsWith('/')).sort()
        const hash = createHash('sha256')
        for (const asset of assets) {
          hash.update(asset)
          hash.update(
            await readFile(resolve(directory, new URL(asset, server.origin).pathname.slice(playgroundBase.length))),
          )
        }
        await writeFile(
          resolve(directory, id, 'startup.json'),
          JSON.stringify({
            editor: JSON.parse(await readFile(resolve(directory, 'runtime.json'), 'utf8')).entry,
            revision: hash.digest('hex'),
            assets,
          }),
        )
        const skeleton = prepared.match(/<main[\s\S]*?<\/main>/)?.[0]
        if (!skeleton) throw new Error('Missing playground markup')
        const deferred = prepared
          .replace('<body ', '<body data-playground-state="static" ')
          .replace('</head>', '<script type="module" src="../assets/playground-preload.js"></script></head>')
          .replace('</head>', `<style data-snapshot-styles>${snapshot.css}</style></head>`)
          .replace(
            skeleton,
            `<div data-playground-snapshot>${snapshot.html}</div>${skeleton.replace('<main ', '<main data-playground-live style="visibility:hidden" ')}`,
          )
        await writeFile(file, deferred)
        console.log(`Prerendered ${id}: source and preview`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
    await server.close()
  }
}
