# Settings and keybindings

Settings change how LVCE behaves. Keybindings map a key combination to a command.

## Change a setting

1. Open **F1** and search for **Settings**.
2. Open the settings interface and search for the setting you want, such as editor font size.
3. Change its value, then return to a text file to check the result.

For settings exposed through JSON, preserve valid JSON and use the documented value type. A font size is a number, not a quoted string:

```json
{
  "editor.fontSize": 16,
  "editor.lineNumbers": true
}
```

Change one unfamiliar setting at a time. Restore its previous value if the result is not what you expected.

## Change a keybinding

Open **F1** and search for **Keyboard Shortcuts**. Find the command you want to change and inspect its existing binding. Choose a combination that does not conflict with another action in the same context.

If you edit keybindings as JSON, use LVCE command IDs. Do not assume that an ID from another editor has the same name or behavior. Keep a copy of the original binding while experimenting.

## Add behavior with extensions

Settings configure existing features. [Extensions](./extensions) can contribute new commands, languages, views, and providers. Extension authors can read and update preferences with the [settings API](../api/files-and-settings).
