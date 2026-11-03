# Editor and workspace

Editor state and workspace state are separate. An extension may be active when no text editor is open, so check optional results before using them.

## Signatures

<<< @/.generated/api/editor.ts

## Inspect the active editor

Use `getActiveEditor()` when an action needs an editor's identity and URI. Handle the absence of an active editor. Use `getEditorSelections()` and `setEditorSelections()` to work with selections rather than inferring them from visible DOM.

Editor selections use zero-based row and column indices, as shown in `EditorSelection`. Language providers that accept offsets use document-text offsets. Check each API's type before converting between these forms.

## Work with URIs

`getWorkspaceUri()` identifies the workspace root. `openUri(uri)` opens a resource through LVCE. Use absolute resource URIs, preserving their scheme. A browser workspace may use a provider URI such as `memfs:///`; it is not necessarily a native disk path.

Use the [filesystem API](./files-and-settings) for file operations so registered providers can participate. Do not pass a URI directly to a Node path function.
