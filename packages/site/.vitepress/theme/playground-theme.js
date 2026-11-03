// Set the palette before first paint without importing the editor runtime.
;(() => {
  const system = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    let preference = 'auto'
    try {
      preference = localStorage.getItem('vitepress-theme-appearance') || 'auto'
    } catch {
      // Embedded examples can still use the parent's theme without storage.
    }
    let dark = preference === 'dark' || (preference === 'auto' && system.matches)
    try {
      if (window.parent !== window) dark = window.parent.document.documentElement.classList.contains('dark')
    } catch {
      // A standalone or cross-origin frame follows its saved/system preference.
    }
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
  }
  apply()
  system.addEventListener('change', apply)
  window.addEventListener('storage', (event) => {
    if (event.key === 'vitepress-theme-appearance' || event.key === null) apply()
  })
})()
