# Versions and example sources

These guides target **LVCE 0.127.6**, the release used when this documentation was prepared. Use the [release page](https://github.com/lvce-editor/lvce-editor/releases/tag/v0.127.6) to choose the matching installer.

The embedded browser editor uses the tested runtime and API dependencies pinned by the samples checkout. They can include separately released worker fixes and do not necessarily share the desktop application's version number.

[Inspect this build's exact versions and sample revision](/versions.json).

## How examples stay aligned

The documentation build fetches a recorded commit from the separate [extension-samples repository](https://github.com/lvce-editor/extension-samples). It builds the selected samples into this site and derives the tutorial snippets from those same files. It also generates the API signatures from the installed API package.

Local tutorial commands clone the samples' current default branch. To reproduce this site's exact examples, check out the commit recorded in the version file before running `npm ci`.

Changes merged to the documentation repository's `main` branch publish after validation. Sample and runtime upgrades require a reviewed pin update, not an automatic switch to another repository's latest branch.

## Browser differences

The live examples run browser-compatible extensions. They preserve saved drafts in browser storage when available; Reset restores the shipped sample. Their compiler supports bundled dependencies and workspace imports rather than arbitrary package installation.

The language-server tutorial requires a native desktop process. A browser LSP transport and historical documentation versions are outside this initial release.
