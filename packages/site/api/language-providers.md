# Language providers

A provider supplies a language feature inside the extension host. A language server supplies features through a separate process and the Language Server Protocol. Choose the mechanism that matches your implementation.

## Provider signatures

<<< @/.generated/api/providers.ts

## Register a provider

Use a unique provider `id` and the exact `languageId` your extension serves. Declare matching activation events in the manifest, such as `onCompletion:plaintext`, `onDiagnostic:plaintext`, or `onHover:plaintext`.

A completion provider receives the document text and an offset. Return items with labels and optional replacement ranges. Compute each range against the document passed to that request; stale offsets can replace the wrong text.

A diagnostic provider returns problems found in the document. Return an empty list when the document is valid so old diagnostics can be cleared. A hover provider can return `undefined` when it has no useful result.

Use the generated types for positions, ranges, severity, and optional fields. The [samples repository](https://github.com/lvce-editor/extension-samples) contains complete completion, diagnostic, and hover examples.

## Language-server signatures

<<< @/.generated/api/server.ts

The manifest advertises the server and language. The registration supplies its executable URI and arguments. The desktop host resolves relative server URIs against the extension and spawns a native process. This mechanism does not run unchanged in a static browser page.

Follow [Connect a language server](../extensions/language-server) for a complete native example. Registration returns a disposable; dispose registrations that you replace during the extension's lifetime.
