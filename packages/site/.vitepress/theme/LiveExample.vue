<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{ sample: string; title: string }>()
const panel = ref<HTMLElement>()
const frame = ref<HTMLIFrameElement>()
const pane = ref('source')
const resetMessage = ref('')

const selectPane = (value: string) => {
  pane.value = value
  if (frame.value?.contentDocument) frame.value.contentDocument.documentElement.dataset.pane = value
}
const reset = () => {
  try {
    frame.value?.contentWindow?.localStorage.removeItem(`extension-samples:workspace:${props.sample}`)
    resetMessage.value = ''
  } catch {
    resetMessage.value = 'Browser storage is unavailable. Reloading the example.'
  }
  frame.value?.contentWindow?.location.reload()
}
const expand = async () => {
  try {
    if (panel.value?.requestFullscreen) await panel.value.requestFullscreen()
    else window.open(withBase(`/playground/${props.sample}/`), '_blank', 'noopener')
  } catch {
    resetMessage.value = 'Use Open playground below to open a larger workspace.'
  }
}
</script>

<template>
  <section ref="panel" class="live-example" :aria-label="title">
    <div class="example-toolbar">
      <span class="example-name">{{ title }}</span>
      <div class="example-actions">
        <button type="button" @click="reset">Reset</button>
        <button type="button" @click="expand" aria-label="Expand playground">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" /></svg>
        </button>
      </div>
    </div>
    <div class="example-panes" role="group" aria-label="Playground pane">
      <span class="example-pane-label">Extension source</span>
      <span class="example-pane-label">Running extension</span>
      <button type="button" :aria-pressed="pane === 'source'" @click="selectPane('source')">Extension source</button>
      <button type="button" :aria-pressed="pane === 'preview'" @click="selectPane('preview')">Running extension</button>
    </div>
    <iframe
      ref="frame"
      :src="withBase(`/playground/${sample}/`)"
      :title="`${title}: editable source and running preview`"
      loading="eager"
      @load="selectPane(pane)"
    />
    <div class="example-caption">
      <span>Edit the source, then save with <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>S</kbd>.</span
      ><a :href="withBase(`/playground/${sample}/`)" target="_blank" rel="noopener"
        >Open playground <span aria-hidden="true">↗</span></a
      >
    </div>
    <p v-if="resetMessage" role="status">{{ resetMessage }}</p>
  </section>
</template>
