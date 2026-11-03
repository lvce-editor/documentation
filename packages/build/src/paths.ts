import { resolve } from 'node:path'

export const root = resolve(import.meta.dirname, '../../..')
export const site = resolve(root, 'packages/site')
export const base = '/documentation/'
export const playgroundBase = `${base}playground/`
