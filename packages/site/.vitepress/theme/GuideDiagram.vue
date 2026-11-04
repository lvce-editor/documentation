<script setup lang="ts">
defineProps<{ reducedMotion?: boolean }>()
</script>

<template>
  <figure class="guide-diagram">
    <svg viewBox="0 0 720 220" role="img" aria-labelledby="guide-title guide-description">
      <title id="guide-title">How the sidebar counter handles a click</title>
      <desc id="guide-description">
        A click travels from a button to handleEvent, changes the count, and render displays the new count.
      </desc>
      <defs>
        <marker id="guide-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor" stroke-width="1.5" />
        </marker>
      </defs>
      <g class="guide-flow">
        <rect x="20" y="72" width="145" height="76" rx="12" />
        <text x="92" y="105" text-anchor="middle">Button click</text>
        <text x="92" y="128" text-anchor="middle" class="guide-small">name: increment</text>
        <path d="M170 110 H265" marker-end="url(#guide-arrow)" />
        <rect x="278" y="72" width="160" height="76" rx="12" />
        <text x="358" y="105" text-anchor="middle">handleEvent()</text>
        <text x="358" y="128" text-anchor="middle" class="guide-small">count += 1</text>
        <path d="M443 110 H535" marker-end="url(#guide-arrow)" />
        <rect x="548" y="72" width="150" height="76" rx="12" />
        <text x="623" y="105" text-anchor="middle">render()</text>
        <text x="623" y="128" text-anchor="middle" class="guide-small">Count: 1</text>
      </g>
      <circle v-if="!reducedMotion" class="guide-pulse" cx="0" cy="110" r="7" />
    </svg>
    <figcaption>A click updates the instance state; the next render displays the new count.</figcaption>
  </figure>
</template>

<style scoped>
.guide-diagram {
  margin: 1.5rem 0;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

svg {
  display: block;
  width: 100%;
  color: var(--vp-c-brand-1);
}

rect {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
}

path {
  stroke: currentColor;
  stroke-width: 2;
}

text {
  fill: var(--vp-c-text-1);
  font:
    600 16px system-ui,
    sans-serif;
}

.guide-small {
  fill: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 400;
}

.guide-pulse {
  fill: var(--vp-c-brand-1);
  animation: guide-travel 3s ease-in-out infinite;
}

figcaption {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  text-align: center;
}

@keyframes guide-travel {
  0%,
  8% {
    transform: translateX(0);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  78% {
    transform: translateX(620px);
    opacity: 1;
  }
  90%,
  100% {
    transform: translateX(620px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guide-pulse {
    animation: none;
    display: none;
  }
}
</style>
