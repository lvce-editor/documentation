# Extension API reference

Import public APIs from `@lvce-editor/api`. Start by awaiting `activate()`, then register the behavior your manifest declares.

## Find an API

| Task                                                     | Reference                                  |
| -------------------------------------------------------- | ------------------------------------------ |
| Register or run a command; show a notification           | [Commands and notifications](./commands)   |
| Inspect an editor, selection, or workspace               | [Editor and workspace](./editor)           |
| Read and write files; change a preference                | [Files and settings](./files-and-settings) |
| Supply completions, diagnostics, hover, or an LSP server | [Language providers](./language-providers) |
| Add a view, picker, output channel, or status item       | [Views and user interface](./views)        |
| Find another exported function or type                   | [Export catalog](./catalog)                |

The signatures below are generated from the API version recorded in the [build versions](../about/versions). Examples and prose explain the important APIs; the export catalog also includes lower-level registry and testing helpers.

## Browser support

The live examples support local sample imports and the bundled API. They do not provide arbitrary npm installation, Node-only APIs, or native executable access. Desktop and remote workspaces have their own capabilities. Read an API's host requirements before relying on it.

For a complete working starting point, follow [Hello World](../extensions/hello-world).
