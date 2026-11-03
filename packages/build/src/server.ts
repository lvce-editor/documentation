import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const contentTypes: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

export const serve = async (directory: string, base: string, port = 0) => {
  const root = resolve(directory)
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname)
      if (!pathname.startsWith(base)) throw new Error('Not found')
      let path = resolve(root, pathname.slice(base.length))
      if (path !== root && !path.startsWith(`${root}${sep}`)) throw new Error('Not found')
      try {
        if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
      } catch {
        if (extname(path)) throw new Error('Not found')
        path += '.html'
      }
      const body = await readFile(path)
      response.writeHead(200, { 'Content-Type': contentTypes[extname(path)] || 'application/octet-stream' })
      response.end(body)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  })
  await new Promise<void>((done, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', done)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing server address')
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done()))),
  }
}
