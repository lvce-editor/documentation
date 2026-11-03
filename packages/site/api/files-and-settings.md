# Files and settings

Use LVCE's APIs to operate on workspace resources. A workspace can be backed by a disk, a remote host, or a filesystem provider.

## Signatures

<<< @/.generated/api/files.ts

## Read or write a file

Pass a resource URI to `readFile()` or `writeFile()`. `readFile()` returns text; use the exported blob APIs when you need binary content. Await writes before opening or reading the result.

Check `exists()` when absence is an expected case. It does not guarantee a later read will succeed: the file may change, permissions may differ, or the provider may become unavailable. Handle failures from the operation itself.

`readDirWithFileTypes()` returns entries with their types. Treat those entries as provider resources rather than assuming all of them are local files.

## Read or change a preference

`getPreference()` returns an unknown value. Validate it before using it as a number, string, or object. Use `setPreference()` with a value of the setting's documented type.

Change a reader's settings only as part of an explicit action. If your feature temporarily changes a value, retain and restore the previous value rather than choosing a hard-coded default. Cancelling a picker should not change the setting.
