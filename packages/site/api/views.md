# Views and user interface

Use the smallest UI that fits the task. A command may need a picker or a notification; persistent content may need a view or status item.

## Signatures

<<< @/.generated/api/views.ts

## Pickers and input

Use `showQuickPick()` for a choice and `showQuickInput()` for text. Await the result and handle cancellation before changing state. Labels are presentation; use a distinct value when the selected item's identity matters.

## Views

`registerView()` supplies the behavior for a view declared by your extension. Use the exported `View`, `StatefulView`, and virtual-DOM types to implement its lifecycle. Keep state owned by the view instance so opening two instances does not mix their data.

The samples repository includes sidebar and file-view examples. Start from one with the same placement and interaction model as your feature.

## Status items and output

A status-item provider returns the text and action for a compact status-bar item. Refresh it when its underlying state changes. Provide an accessible label describing the action or state.

Use an output channel for logs that readers may need to inspect. Keep ordinary logs out of notifications and dispose resources when your feature no longer needs them. Refer to the [export catalog](./catalog) for the complete handle and provider types.
