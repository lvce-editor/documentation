import { execFileSync } from 'node:child_process'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { root, site, playgroundBase } from './paths.ts'
import { run } from './run.ts'
import { prerender } from './prerender.ts'
import { generateApi } from './api.ts'

export const prepare = async () => {
  const sources = JSON.parse(await readFile(resolve(root, 'sources.json'), 'utf8')) as {
    editor: string
    samples: { repository: string; revision: string; ids: string[] }
  }
  if (!/^[a-f0-9]{40}$/.test(sources.samples.revision)) throw new Error('Samples must be pinned to a full commit hash')
  if (process.env.CI && process.env.DOCS_SAMPLES_PATH) throw new Error('CI must build the pinned sample revision')
  const checkout = resolve(root, '.tmp', process.env.DOCS_SAMPLES_PATH ? 'samples-local' : 'samples-pinned')
  if (process.env.DOCS_SAMPLES_PATH) {
    // Local integration testing; published builds always use the recorded commit.
    await rm(checkout, { recursive: true, force: true })
    await mkdir(checkout, { recursive: true })
    await cp(process.env.DOCS_SAMPLES_PATH, checkout, {
      recursive: true,
      filter: (path) => !/(?:^|\/)(?:node_modules|\.git|\.tmp|dist)(?:\/|$)/.test(path.split(sep).join('/')),
    })
  } else {
    await mkdir(checkout, { recursive: true })
    if (!existsSync(resolve(checkout, '.git'))) await run('git', ['init', '--quiet'], checkout)
    await run('git', ['fetch', '--depth=1', sources.samples.repository, sources.samples.revision], checkout)
    await run('git', ['checkout', '--detach', 'FETCH_HEAD'], checkout)
    const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: checkout, encoding: 'utf8' }).trim()
    if (revision !== sources.samples.revision) throw new Error('Sample checkout does not match the full pinned commit')
  }
  const lock = await readFile(resolve(checkout, 'package-lock.json'))
  const lockHash = createHash('sha256').update(lock).digest('hex')
  const marker = resolve(checkout, 'node_modules/.docs-lock')
  if (!existsSync(marker) || (await readFile(marker, 'utf8')) !== lockHash) {
    await run('npm', ['ci'], checkout)
    await writeFile(marker, lockHash)
  }
  await run('npm', ['run', 'build:static'], checkout, {
    ...process.env,
    SAMPLES_BASE_PATH: playgroundBase.slice(0, -1),
    SAMPLES_IDS: sources.samples.ids.join(','),
  })
  const destination = resolve(site, 'public/playground')
  await rm(destination, { recursive: true, force: true })
  await cp(resolve(checkout, '.tmp/static'), destination, { recursive: true })
  for (const id of [...sources.samples.ids, 'language-server']) {
    const sample = resolve(checkout, `packages/sample-${id}`)
    const target = resolve(site, `.generated/samples/${id}`)
    await rm(target, { recursive: true, force: true })
    await cp(sample, target, {
      recursive: true,
      filter: (path) => !/(?:^|\/)(?:node_modules|dist)(?:\/|$)/.test(path.split(sep).join('/')),
    })
  }
  await generateApi(checkout)
  const lockData = JSON.parse(lock.toString())
  await writeFile(
    resolve(site, 'public/versions.json'),
    JSON.stringify(
      {
        editor: sources.editor,
        samples: sources.samples,
        runtime: Object.fromEntries(
          Object.entries(lockData.packages as Record<string, { version?: string }>)
            .filter(([name]) =>
              /node_modules\/@lvce-editor\/(?:api|shared-process|renderer-process|editor-worker|extension-management-worker)$/.test(
                name,
              ),
            )
            .map(([name, value]) => [name.replace('node_modules/', ''), value.version]),
        ),
      },
      null,
      2,
    ),
  )
  await prerender(destination, sources.samples.ids)
}
