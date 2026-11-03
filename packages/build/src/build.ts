import { build } from 'vitepress'
import { prepare } from './prepare.ts'
import { site } from './paths.ts'

await prepare()
await build(site)
