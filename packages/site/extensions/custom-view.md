---
aside: false
---

# Create a custom view

An extension can add persistent UI to LVCE by declaring a view in its manifest and registering its behavior when LVCE activates it. This tutorial builds a sidebar counter you can try and edit here.

## Try the counter

The preview starts with a counter at zero. Use **Increment** and **Decrement**; the buttons also work with the keyboard. Edit `count += 1` in the source to `count += 2`, save with **Ctrl+S** or **Command+S**, then increment again. The count should now change by two. **Reset** restores the original source and preview.

<LiveExample sample="sidebar-counter" title="Custom sidebar view" />

## Declare and register the view

This manifest contributes a virtual-DOM view to the sidebar:

<<< @/.generated/samples/sidebar-counter/extension.json

The ID `sample.sidebar-counter` must match in all three places: the manifest's `views[].id`, its `onView:` activation event, and the `id` passed to `registerView()`. LVCE uses this connection to activate the extension when the view is needed and find its implementation. The preview opens the view during its playground setup; ordinary editor windows open the contributed view through the sidebar.

The implementation below comes from the same pinned sample as the preview:

<<< @/.generated/samples/sidebar-counter/src/main.ts

After activating the extension API, `registerView()` describes the view. Its `create()` method creates one instance and owns that instance's state. Here, `count` belongs to the returned instance, so separate view instances do not share it. This example has no subscriptions or timers to release; if your view creates resources, dispose them when its instance is disposed. See [lifecycle and cleanup](./lifecycle) for resource ownership.

`render()` returns a flat, depth-first array rather than nested objects. Each element's `childCount` is the number of its direct children: the root has two children, and the value and buttons each have their own descendants. Keep the count accurate so LVCE can reconstruct the tree. The button nodes use `name` to identify the action and `onClick` to route it to `handleEvent()`. That handler updates the instance state; LVCE renders the view again after the event.

`getCss()` returns styles for the view. Keep selectors scoped to your view's class names so its styles do not affect other editor UI. The counter value uses a polite status region, and native buttons provide keyboard activation and accessible names.

## Run it locally

You need Git, the Node version recorded in `extension-samples/.nvmrc`, and npm. To also test in the desktop editor, install LVCE and make the `lvce` command available on your PATH.

```sh
git clone https://github.com/lvce-editor/extension-samples.git
cd extension-samples
npm ci
npm run dev
```

Open `http://localhost:3000/extension-samples/sidebar-counter/`. The source is in `packages/sample-sidebar-counter`. Edit `src/main.ts`, save in the playground, and confirm that changing `count += 1` to `count += 2` changes the result of each increment.

To load the same extension in a desktop window, build and launch it from the repository root:

```sh
npm run build:desktop -- sidebar-counter
lvce --transient --link ./packages/sample-sidebar-counter ./packages/sample-sidebar-counter
```

Select **Counter** in the activity bar to open the view in the sidebar. `--link` loads the local extension for this run; `--transient` keeps its extension data separate from your normal editor session. After editing files on disk, rebuild and relaunch the test window to see the changes.

## Choose a different placement

For a view that appears for a particular file extension, compare the [file-view sample](https://github.com/lvce-editor/extension-samples/tree/main/packages/sample-file-view). Its manifest configures a different placement and selector; the activation and registration IDs still need to agree.
