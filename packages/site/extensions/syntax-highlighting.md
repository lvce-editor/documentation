---
aside: false
---

# Add syntax highlighting

Teach LVCE to recognize a small language called **Sprout**. It has `let` and `print` keywords, strings, numbers, punctuation, and line comments.

## Try the tokenizer

The right editor contains a `.sprout` file with highlighting already applied. Edit that code to see its tokens change. On the left, edit the tokenizer and save to rebuild the extension.

<LiveExample sample="syntax-highlighting" title="Sprout syntax highlighting" />

For a visible change, find the `TokenMap` entry for `TokenType.Number` and change `'Numeric'` to `'String'`. Save. Numeric literals in the preview should now use the string style. Reset to restore the original tokenizer.

## Associate files with the language

The manifest maps `.sprout` files to the `sprout` language and names the tokenizer module:

<<< @/.generated/samples/syntax-highlighting/extension.json

A language ID is an identifier used by the editor and providers. A file extension is the filename suffix used to choose that language. They have different jobs even when their names match.

## Write a line tokenizer

<<< @/.generated/samples/syntax-highlighting/src/tokenizeSprout.js

`tokenizeLine(line, lineState)` returns the next state and an alternating array of token IDs and lengths. Each length counts UTF-16 code units in the input line. The lengths must cover the complete line, including spaces and unstyled text. Advancing the offset on every branch prevents an infinite loop.

`TokenMap` maps those IDs to editor token styles. `initialLineState` supplies the first state, and `isLineStateEqual` tells the editor whether a line-state change requires more tokenization. This example has no multiline strings or comments, so its state stays constant.

Test empty lines, whitespace, unknown words, an unterminated string, and a comment after code. Unsupported text should remain readable, and the editor should remain responsive.

## Run it locally

Follow the [local setup in Hello World](./hello-world#run-it-locally). Open `http://localhost:3000/extension-samples/syntax-highlighting/`. The extension is in `packages/sample-syntax-highlighting`.

Build the desktop bundle, then test the same manifest and tokenizer in the desktop editor:

```sh
npm run build:desktop -- syntax-highlighting
lvce --transient --link ./packages/sample-syntax-highlighting ./packages/sample-syntax-highlighting
```

Create or open a file ending in `.sprout` and type `let count = 42`. `let` and `42` should use different token styles. Rebuild and relaunch after changing the extension's files on disk.

Syntax highlighting classifies text. For language features supplied by a separate process, continue with [language servers](./language-server).
