import { resolve } from 'node:path'
import { root, base } from './paths.ts'
import { serve } from './server.ts'

const server = await serve(resolve(root, '.tmp/site'), base, 4173)
console.log(`Documentation: ${server.origin}${base}`)
