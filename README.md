# LVCE documentation

Task guides and extension documentation for [LVCE Editor](https://github.com/lvce-editor/lvce-editor).

[Read the documentation](https://lvce-editor.github.io/documentation/).

## Development

Use the Node version in `.nvmrc`:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open `http://localhost:3000/documentation/`. Linux may need `npx playwright install --with-deps chromium` for browser system dependencies.

The first build fetches the full sample commit in `sources.json`, installs its locked dependencies, and builds selected examples. Chromium captures the actual LVCE source/preview DOM and adopted stylesheets. Tutorial snippets and API declarations come from that same checkout. Subsequent builds reuse dependencies when the sample lockfile is unchanged.

## Layout

- `packages/site`: Markdown, VitePress configuration, theme, and example component.
- `packages/build`: sample integration, API generation, prerendering, and local serving.
- `packages/e2e`: browser acceptance tests against the built artifact.
- `sources.json`: desktop release and exact sample revision. Runtime versions are derived from its lockfile and published in `versions.json`.

`extension-samples` stays separate. Generated copies and build output are ignored by Git.

## Validation

```sh
npm run build
npm run preview
npm run lint
npm run type-check
npm test
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
```

Output is in `.tmp/site`, under the `/documentation/` Pages base. Preview uses a small static server to avoid expensive on-demand Brotli compression of the editor tooling. Tests cover static output, zero workers while reading, first-input replay, live editing/reset, independent embeddings, narrow layouts, and search.

## Updating examples

Change `sources.json` to a full commit hash from `lvce-editor/extension-samples`, rebuild, and run acceptance tests. Update the documented release and installation filenames together. Do not use a moving branch name as the pin.

For local integration only, `DOCS_SAMPLES_PATH` can point to an extension-samples checkout. It copies files into the ignored build directory without changing the source checkout. Publishing always uses the recorded commit.

## Publishing

PRs build and validate on Linux, macOS, and Windows. Chromium, Firefox, and WebKit test the built site. Main-branch CI deploys the validated artifact to GitHub Pages; set the repository's Pages source to **GitHub Actions**.

`PRODUCT.md` records the agreed scope; `DESIGN.md` records the design conventions.
