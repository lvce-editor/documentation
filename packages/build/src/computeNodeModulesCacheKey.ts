import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { root } from './paths.ts'

const locations = [
  'package.json',
  'package-lock.json',
  '.nvmrc',
  '.github/workflows/ci.yml',
  'packages/build/package.json',
  'packages/site/package.json',
  'packages/e2e/package.json',
  'packages/build/src/computeNodeModulesCacheKey.ts',
]

const main = async (): Promise<void> => {
  const hash = createHash('sha1')
  for (const location of locations) {
    hash.update(location)
    hash.update(await readFile(resolve(root, location)))
  }
  process.stdout.write(hash.digest('hex'))
}

await main()
