import { defineConfig } from 'vitepress'
import { resolve } from 'node:path'
import sources from '../../../sources.json'

const usePages = [
  ['Start here', '/use/'],
  ['Install LVCE', '/use/installation'],
  ['Open your first project', '/use/first-project'],
  ['Edit and navigate', '/use/editing'],
  ['Find and replace', '/use/search'],
  ['Settings and keybindings', '/use/settings'],
  ['Install extensions', '/use/extensions'],
]
const buildPages = [
  ['Start building', '/extensions/'],
  ['Hello World', '/extensions/hello-world'],
  ['Syntax highlighting', '/extensions/syntax-highlighting'],
  ['Connect a language server', '/extensions/language-server'],
  ['Manifest and activation', '/extensions/manifest'],
  ['Lifecycle and cleanup', '/extensions/lifecycle'],
]
const apiPages = [
  ['API overview', '/api/'],
  ['Commands and notifications', '/api/commands'],
  ['Editor and workspace', '/api/editor'],
  ['Files and settings', '/api/files-and-settings'],
  ['Language providers', '/api/language-providers'],
  ['Views and user interface', '/api/views'],
  ['Export catalog', '/api/catalog'],
]
const items = (pages: string[][]) => pages.map(([text, link]) => ({ text, link }))

export default defineConfig({
  title: 'LVCE Editor',
  titleTemplate: ':title · LVCE Docs',
  description: 'Learn your way around LVCE Editor. Build an extension, try it live, and make the editor your own.',
  lang: 'en',
  base: '/documentation/',
  outDir: resolve(import.meta.dirname, '../../../.tmp/site'),
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['.generated/**', 'public/**'],
  head: [['link', { rel: 'icon', href: '/documentation/logo.svg', type: 'image/svg+xml' }]],
  sitemap: { hostname: 'https://lvce-editor.github.io/documentation/' },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'LVCE / Docs',
    nav: [
      { text: 'Use LVCE', link: '/use/', activeMatch: '/use/' },
      { text: 'Build extensions', link: '/extensions/', activeMatch: '/extensions/' },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      { text: 'Blog', link: 'https://lvce-editor.github.io/blog/' },
      { text: `v${sources.editor}`, link: '/about/versions' },
    ],
    sidebar: [
      { text: 'Use LVCE', items: items(usePages) },
      { text: 'Build extensions', items: items(buildPages) },
      { text: 'API reference', collapsed: true, items: items(apiPages) },
    ],
    aside: false,
    search: { provider: 'local' },
    outline: false,
    editLink: { pattern: 'https://github.com/lvce-editor/documentation/edit/main/packages/site/:path' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/lvce-editor/documentation' }],
    footer: { copyright: 'LVCE Editor' },
  },
})
