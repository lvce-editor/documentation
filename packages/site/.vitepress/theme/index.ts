import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import '@fontsource-variable/public-sans'
import Home from './Home.vue'
import LiveExample from './LiveExample.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DocsHome', Home)
    app.component('LiveExample', LiveExample)
  },
} satisfies Theme
