# Manifest and activation

Every extension needs an `extension.json` file. It describes the extension and declares the contributions LVCE can discover before loading its code.

## Start with a real manifest

<<< @/.generated/samples/hello-world/extension.json

| Field                            | Purpose                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`                             | Stable extension identity. Use a namespace that avoids collisions.                            |
| `name`, `description`, `version` | Identify and describe the extension.                                                          |
| `browser`                        | Entry module, relative to the extension folder. Build this file before loading the extension. |
| `isolated`                       | Request an isolated extension context.                                                        |
| `activation`                     | Events that cause LVCE to load the extension.                                                 |
| `commands`                       | Command IDs and labels shown to readers in the command palette.                               |

## Connect contributions to code

A command contribution makes an action discoverable. `registerCommand()` supplies its implementation after `activate()` resolves. Match the IDs exactly.

The Hello World extension uses `onCommand:sample.helloWorld`. The highlighting extension uses `onLanguage:sprout` and a `languages` contribution. Providers often need their own activation event, such as `onCompletion:plaintext` or `onHover:plaintext`, matching the feature and language they serve.

## Work within your host

An isolated browser extension cannot assume it has Node APIs, native executables, or unrestricted filesystem access. Use the [filesystem API](../api/files-and-settings) for workspace resources. The [LSP tutorial](./language-server) explicitly requires the desktop host.

Copy a working sample's manifest as your starting point. Add only the contributions you need, then verify discovery and activation separately: first check that the command or language is visible, then that its code runs.
