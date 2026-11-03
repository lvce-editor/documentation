import { createServer } from 'vitepress'
import { prepare } from './prepare.ts'
import { site } from './paths.ts'

await prepare()
const server = await createServer(site, { host: '127.0.0.1', port: 3000 })
await server.listen()
server.printUrls()
