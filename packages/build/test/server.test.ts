import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serve } from '../src/server.ts'

test('static server honors the Pages base, serves worker MIME types, and rejects paths outside its root', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lvce-docs-server-'))
  const server = await serve(directory, '/documentation/playground/')
  try {
    await writeFile(join(directory, 'index.html'), 'example')
    await writeFile(join(directory, 'compiler.wasm'), new Uint8Array([0, 97, 115, 109]))
    await writeFile(join(directory, 'formatter.mjs'), 'export const format = () => {}')
    const home = await fetch(`${server.origin}/documentation/playground/`)
    assert.equal(await home.text(), 'example')
    const wasm = await fetch(`${server.origin}/documentation/playground/compiler.wasm`)
    assert.equal(wasm.headers.get('content-type'), 'application/wasm')
    const module = await fetch(`${server.origin}/documentation/playground/formatter.mjs`)
    assert.equal(module.headers.get('content-type'), 'text/javascript')
    assert.equal((await fetch(`${server.origin}/another-site/`)).status, 404)
    assert.equal((await fetch(`${server.origin}/documentation/playground/%2e%2e%2fsecret`)).status, 404)
  } finally {
    await server.close()
    await rm(directory, { recursive: true, force: true })
  }
})
