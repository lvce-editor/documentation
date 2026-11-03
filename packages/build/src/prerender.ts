import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { playgroundBase } from './paths.ts'
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
  const server = await serve(directory, playgroundBase)
  const browser = await chromium.launch()
  try {
    for (const id of ids) {
      const file = resolve(directory, id, 'index.html')
      const html = await readFile(file, 'utf8')
      const sourceEntry = id === 'syntax-highlighting' ? 'src/tokenizeSprout.js' : 'src/main.ts'
      const prepared = html
        .replace('<body ', `<body data-embedded="true" data-source-entry="${sourceEntry}" `)
        .replace('</head>', `<style>${embeddedCss}</style></head>`)
      await writeFile(file, prepared)
      const page = await browser.newPage({ viewport: { width: 1080, height: 440 } })
      try {
        await page.goto(`${server.origin}${playgroundBase}${id}/`)
        await page.waitForFunction(() => document.body.dataset.playgroundReady === 'true', undefined, {
          timeout: 60_000,
        })
        await page.locator('#source-ide .EditorRow .Token').first().waitFor()
        if (id === 'hello-world') await page.locator('#preview-ide .NotificationMessage').waitFor()
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
        const skeleton = prepared.match(/<main[\s\S]*?<\/main>/)?.[0]
        if (!skeleton) throw new Error('Missing playground markup')
        const deferred = prepared
          .replace('<body ', '<body data-playground-state="static" ')
          .replace('</head>', `<style data-snapshot-styles>${snapshot.css}</style></head>`)
          .replace(
            skeleton,
            `<div data-playground-snapshot>${snapshot.html}</div>${skeleton.replace('<main ', '<main data-playground-live style="visibility:hidden" ')}`,
          )
        await writeFile(file, deferred)
        console.log(`Prerendered ${id}: source, preview, and syntax styles`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
    await server.close()
  }
}
