<script setup lang="ts">
import { withBase } from 'vitepress'
import sources from '../../../../sources.json'

const useTasks = [
  ['Install the editor', 'Pick the right download for your computer.', '/use/installation'],
  ['Open your first project', 'From an empty window to your own files.', '/use/first-project'],
  ['Find your way around', 'Move through code, files, and search results.', '/use/editing'],
  ['Make it yours', 'Settings, keybindings, and extensions.', '/use/settings'],
]
const buildTasks = [
  ['Your first extension', 'Change a greeting. See it running beside your code.', '/extensions/hello-world'],
  ['Add a language', 'Build syntax highlighting for a small language.', '/extensions/syntax-highlighting'],
  ['Connect a language server', 'Bring language intelligence into the editor.', '/extensions/language-server'],
  ['Look up an API', 'Commands, providers, files, and the user interface.', '/api/'],
]
</script>

<template>
  <div class="docs-home">
    <section class="home-intro">
      <h1>Get to know<br /><span>LVCE Editor.</span></h1>
      <div class="intro-copy">
        <p>Open a project, find your way around, or build an extension. Start with the task in front of you.</p>
        <a :href="withBase('/use/')" class="intro-link"
          >New here? Start with the basics <span aria-hidden="true">↗</span></a
        >
        <a :href="withBase('/about/versions')" class="release-link">For LVCE {{ sources.editor }}</a>
      </div>
    </section>

    <div class="task-index">
      <section aria-labelledby="use-heading">
        <div class="index-heading">
          <h2 id="use-heading">Use LVCE</h2>
          <span>Settle in.</span>
        </div>
        <ul>
          <li v-for="[title, detail, link] in useTasks" :key="link">
            <a :href="withBase(link)"
              ><strong>{{ title }}</strong
              ><span>{{ detail }}</span
              ><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg
            ></a>
          </li>
        </ul>
      </section>
      <section aria-labelledby="build-heading">
        <div class="index-heading">
          <h2 id="build-heading">Build extensions</h2>
          <span>Make it yours.</span>
        </div>
        <ul>
          <li v-for="[title, detail, link] in buildTasks" :key="link">
            <a :href="withBase(link)"
              ><strong>{{ title }}</strong
              ><span>{{ detail }}</span
              ><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg
            ></a>
          </li>
        </ul>
      </section>
    </div>

    <section class="home-example" aria-labelledby="example-heading">
      <div class="example-intro">
        <h2 id="example-heading">A small change.<br />A working extension.</h2>
        <p>
          This is LVCE, running right here. Edit the greeting on the left and save to update the preview.
          <a :href="withBase('/extensions/hello-world')">Follow the Hello World guide.</a>
        </p>
      </div>
      <LiveExample sample="hello-world" title="Hello World extension" />
    </section>
    <div class="home-footnote">
      <p>
        Looking for something specific? Search the docs or browse the <a :href="withBase('/api/')">API reference</a>.
      </p>
      <a href="https://github.com/lvce-editor/lvce-editor">LVCE on GitHub <span aria-hidden="true">↗</span></a>
    </div>
  </div>
</template>
