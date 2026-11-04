// Fetch bytes only: importing the renderer here would start the IDE's workers.
const warm = async () => {
  const response = await fetch(new URL('startup.json', location.href))
  if (!response.ok) throw new Error('Startup manifest unavailable')
  const { editor, revision, assets } = await response.json()
  const storageKey = `documentation:playground-cache:${location.pathname}`
  let cache = 'reload'
  try {
    if (JSON.parse(sessionStorage.getItem(storageKey) || 'null')?.revision === revision) cache = 'default'
  } catch {
    // An absent or unreadable marker requires fresh bytes for this build.
  }
  let next = 0
  const download = async () => {
    while (next < assets.length) {
      const response = await fetch(assets[next++], { cache, signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`Startup asset unavailable: ${response.status}`)
      await response.arrayBuffer()
    }
  }
  await Promise.all(Array.from({ length: 6 }, download))
  // This is diagnostic bookkeeping, not proof that the HTTP cache still has
  // every response. Revisit the URLs on navigation so eviction can be repaired.
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ editor, revision }))
  } catch {
    // Restricted storage must not prevent warming or interaction.
  }
  document.body.dataset.playgroundCache = 'ready'
}

void warm().catch(() => {
  // Warming is optional. The normal activation path can fetch or retry assets.
  document.body.dataset.playgroundCache = 'unavailable'
})
