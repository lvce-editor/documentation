# Build extensions

An LVCE extension can add a command, teach the editor a language, or contribute a view. Start with a small working example, then move to your own project.

## Choose a tutorial

- [Hello World](./hello-world): register a command and show a notification. No installation needed for the live example.
- [Build a sidebar counter](./sidebar-counter): start with an empty project and add a view, state, and working controls one step at a time.
- [Syntax highlighting](./syntax-highlighting): associate a file extension with a tokenizer and see its colors update.
- [Connect a language server](./language-server): run a real LSP server locally and display its hover response.

The live examples use two LVCE editors. The left editor contains the extension; the right shows its result. Edit on the left and save to rebuild. **Reset** restores the shipped sample and removes its saved draft.

## Understand the pieces

Read [manifest and activation](./manifest) to connect an extension's files, contributions, and runtime code. Read [lifecycle and cleanup](./lifecycle) before adding subscriptions, timers, or other resources.

## Look something up

The [API reference](../api/) explains the key APIs. Its signatures and [export catalog](../api/catalog) are generated from the same API package used by the examples. These are LVCE APIs; they are not interchangeable with the VS Code extension API.
