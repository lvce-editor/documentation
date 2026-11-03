# Commands and notifications

Use a command to expose an action that a reader can run from the command palette or another extension can invoke.

## Signatures

<<< @/.generated/api/commands.ts

## Register a command

Await `activate()`, then pass an object with a unique `id` and an `execute` callback to `registerCommand()`. The callback can be async. Keep the returned disposable if you will remove or replace the registration during the extension's lifetime.

Add the same ID to the manifest's `commands` list to make it discoverable, and to the corresponding `onCommand:` activation event. [Hello World](../extensions/hello-world) shows all three pieces together.

## Execute and await

`executeCommand(id, ...args)` returns a promise. Await it when later work depends on the result. An invalid command or a rejected callback can reject the promise; handle that error where you can provide useful recovery.

## Show a notification

`showNotification(type, message)` takes `'info'`, `'warning'`, or `'error'`. Use a short, concrete message describing the result or problem. Await the operation. Do not use repeated notifications for continuous progress or ordinary typing feedback.
