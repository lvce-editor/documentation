---
aside: false
---

# Connect a language server

Run a small **real LSP server** and display its completion result in LVCE. This tutorial uses the desktop editor: GitHub Pages cannot start a native process.

## Prerequisites

Install [LVCE](../use/installation) and make its `lvce` command available on your PATH. You also need Git and the Node version in the samples repository's `.nvmrc`.

```sh
git clone https://github.com/lvce-editor/extension-samples.git
cd extension-samples
npm ci
npm run build --workspace=packages/sample-language-server
```

If you already cloned the samples for another tutorial, use that checkout instead.

## Declare the language and server

<<< @/.generated/samples/language-server/extension.json

The manifest associates `.sproutlsp` files with `sprout-lsp`, declares the language server, and activates the extension for the language and completion requests.

## Register its executable

<<< @/.generated/samples/language-server/src/main.ts

LVCE resolves `dist/server.mjs` relative to the extension folder. It runs JavaScript server files using its Node runtime and connects standard input and output to the language-server client. `argv` supplies extra command-line arguments; this example needs none.

The server uses LSP's `Content-Length` framing around JSON-RPC messages. It answers `initialize`, `textDocument/completion`, and `shutdown`, and handles `exit`:

<<< @/.generated/samples/language-server/src/server.ts

The completion response is deliberately fixed so you can focus on the connection. A useful language server would inspect the document and requested position before returning a result. Send logging to standard error; arbitrary text on standard output would corrupt the protocol stream.

## Launch and verify

From the repository root:

```sh
lvce --transient --link ./packages/sample-language-server ./packages/sample-language-server
```

Open `example.sproutlsp`, place the caret after `hel`, and press **Ctrl+Space**. Select **helloFromServer** from the suggestions. The line should now contain `helloFromServer`.

Change that text in `src/server.ts`, rerun the build command, close the test window, and relaunch it. The completion list should display your new suggestion. This confirms that the result comes from the server process.

## Troubleshoot the connection

If no completion appears, check that you opened a `.sproutlsp` file, built `dist/main.js` and `dist/server.mjs`, and linked the correct extension folder. Inspect the test window's errors or logs for executable and protocol failures. Verify that the manifest and registration use the same server and language IDs.

The browser playground supports direct language providers, but those are not a substitute for an LSP server. A live browser version of this tutorial needs a browser-compatible server transport and is planned separately.

See the [language-provider reference](../api/language-providers) for the server registration signature and related APIs.
