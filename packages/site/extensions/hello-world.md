---
aside: false
---

# Your first extension

Build a command that shows a notification. You can try it here before installing any tools.

## Change the greeting

The preview already shows **Hello World!**. In the left editor, find that string, replace it with your own greeting, and save with **Ctrl+S** or **Command+S**. The notification on the right should show your new text.

<LiveExample sample="hello-world" title="Hello World extension" />

An invalid edit leaves the last working preview visible. Fix the error and save again. **Reset** discards the saved draft and restores the original sample.

## Read the extension

This is the source shipped with the example:

<<< @/.generated/samples/hello-world/src/main.ts

`activate()` connects the extension to its host. After it resolves, `registerCommand()` associates `sample.helloWorld` with an async callback. The callback calls `showNotification()` with a severity and message.

The manifest gives the command a visible label and tells LVCE when to load the extension:

<<< @/.generated/samples/hello-world/extension.json

The same command ID appears in `activation`, `commands`, and `registerCommand`. A mismatch means that the visible command will not reach the intended callback. The playground's setup runs the command so its result is visible immediately. In an ordinary editor window, you run the command yourself.

## Run it locally

You need Git, the Node version recorded in `extension-samples/.nvmrc`, and npm. To also test in a desktop window, [install LVCE](../use/installation) with the `lvce` command available on your PATH.

```sh
git clone https://github.com/lvce-editor/extension-samples.git
cd extension-samples
npm ci
npm run dev
```

Open `http://localhost:3000/extension-samples/hello-world/`. The source files are in `packages/sample-hello-world`. You now have the same editable source and preview running from your own computer.

To test those files in the desktop editor, build a desktop bundle in another terminal at the repository root, then launch LVCE:

```sh
npm run build:desktop -- hello-world
lvce --transient --link ./packages/sample-hello-world ./packages/sample-hello-world
```

Open **F1**, search for **Sample: Hello World**, and run it. The notification should appear in that window. `--link` loads the extension for this run; `--transient` keeps its settings and extension data separate from your normal editor session.

When editing the files on disk, rebuild with `npm run build:desktop -- hello-world`, then close and relaunch the test window. Browser playground edits are stored in browser storage; they do not edit your Git checkout.

## Keep going

Read [manifest and activation](./manifest), look up [commands and notifications](../api/commands), or [add syntax highlighting](./syntax-highlighting).
