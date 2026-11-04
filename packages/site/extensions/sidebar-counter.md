---
aside: false
---

# Build a sidebar counter

Start with an empty extension folder and finish with a small sidebar view that responds to clicks. Along the way, you will connect a manifest to extension code, create a view, keep per-view state, and render buttons.

You need Git, Node.js from `extension-samples/.nvmrc`, and npm. The steps below build the extension from its shell. Create the files locally as you go; the finished example is available after the last step.

## 1. Create the extension shell

An extension starts with a manifest and an entry point. The manifest gives the extension and its contributed view the same stable ID. The activation event tells LVCE when to load the entry point.

```json
{
  "id": "sample.sidebar-counter",
  "name": "Sidebar Counter",
  "browser": "dist/main.js",
  "activation": ["onView:sample.sidebar-counter"],
  "views": [
    {
      "id": "sample.sidebar-counter",
      "title": "Counter",
      "kind": "virtualDom",
      "preferredLocation": "sideBar"
    }
  ]
}
```

The `browser` entry points at the compiled extension code. A playground also needs the sample build setup, but that setup is provided for you here. In a project of your own, follow the repository's existing build convention.

## 2. Register a view

The view API is exported by `@lvce-editor/api`. Activate it before registering the view, and use the same ID as the manifest. At this checkpoint the view can render a label; there is no state or interaction yet.

```ts
import { activate as activateExtensionApi, registerView, VirtualDomElements } from '@lvce-editor/api'

const { Div, Text } = VirtualDomElements

const main = async (): Promise<void> => {
  await activateExtensionApi()
  registerView({
    create() {
      return {
        render() {
          return [
            { childCount: 1, type: Div },
            { childCount: 0, text: 'Count: 0', type: Text },
          ]
        },
      }
    },
    id: 'sample.sidebar-counter',
    kind: 'virtualDom',
    preferredLocation: 'sideBar',
    title: 'Counter',
  })
}

main()
```

`create()` makes the view instance. `render()` returns a flat, depth-first virtual DOM array. Each node's `childCount` is the number of its direct children, so the root `Div` above owns one `Text` child.

## 3. Keep state in the view instance

Add a count inside `create()`. That keeps the value associated with this view instance. The highlighted line is the only new state; render reads it whenever LVCE asks for the current view.

```ts
create() {
  let count = 0 // [!code ++]
  return {
    render() {
      return [
        { childCount: 1, type: Div },
        { childCount: 0, text: `Count: ${String(count)}`, type: Text }, // [!code ++]
      ]
    },
  }
}
```

## 4. Make the count interactive

An event handler changes the instance state. The virtual DOM button gives each click a `name`; `handleEvent()` checks that name and updates the count. The next render displays the new value.

```ts
handleEvent(event): void {
  if (event.type !== 'click') return
  if (event.name === 'increment') count += 1 // [!code ++]
  else if (event.name === 'decrement') count -= 1 // [!code ++]
},
```

Add buttons to the returned tree. The `onClick` value names the handler, and `name` identifies which action fired. LVCE renders again after the event handler returns.

```ts
{ childCount: 2, className: 'SidebarCounterButtons', type: Div },
{ childCount: 1, name: 'decrement', onClick: 'handleClick', type: Button },
{ childCount: 0, text: 'Decrement', type: Text },
{ childCount: 1, name: 'increment', onClick: 'handleClick', type: Button },
{ childCount: 0, text: 'Increment', type: Text },
```

The finished view also adds spacing and a live status region so assistive technology can announce the updated count. Its buttons work with keyboard activation as well as pointer clicks.

The complete source puts these pieces together. After opening the playground, try changing the initial value, then save to see the preview rebuild. **Reset** restores the shipped source and clears the saved edit for this example.

<<< @/.generated/samples/sidebar-counter/src/main.ts{1-9,13-22}

## Try the finished extension

The playground runs the completed sample in your browser. It does not install anything on your computer. Edit the source and save to rebuild the preview; **Reset** restores the shipped files and clears this example's saved edit.

<LiveExample sample="sidebar-counter" title="Sidebar counter" />

<GuideDiagram />

## Run the sample on your computer

Clone the sample repository and install its dependencies:

```sh
git clone https://github.com/lvce-editor/extension-samples.git
cd extension-samples
npm ci
npm run dev
```

Open `http://localhost:3000/extension-samples/sidebar-counter/`. The source lives in `packages/sample-sidebar-counter`. Browser playground edits are saved in browser storage; they do not modify your checkout.

To try the extension in LVCE Desktop, build and link it:

```sh
npm run build:desktop -- sidebar-counter
lvce --transient --link ./packages/sample-sidebar-counter ./packages/sample-sidebar-counter
```

In the new window, press **F1**, search for **Sample: Sidebar Counter**, and run it. The view appears in the sidebar. Rebuild and relaunch after changing files on disk.

## Where to go next

Read [manifest and activation](./manifest) for contribution details, then explore [views and user interface](../api/views) for the full API. [Hello World](./hello-world) shows a command extension, and [syntax highlighting](./syntax-highlighting) builds a language tokenizer.
