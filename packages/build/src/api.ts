import ts from 'typescript'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { site } from './paths.ts'

export const generateApi = async (checkout: string) => {
  const directory = resolve(checkout, 'node_modules/@lvce-editor/api')
  const entry = resolve(directory, 'dist/index.d.ts')
  const { version } = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'))
  const program = ts.createProgram([entry], {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
  })
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(entry)!
  const module = checker.getSymbolAtLocation(source)!
  const declarations = new Map<string, string>()
  for (const exported of checker.getExportsOfModule(module)) {
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    const declaration = symbol.getDeclarations()?.[0]
    if (!declaration) throw new Error(`Cannot resolve exported API ${exported.name}`)
    if (!ts.isSourceFile(declaration)) declarations.set(exported.name, declaration.getText())
  }
  const output = resolve(site, '.generated/api')
  await mkdir(output, { recursive: true })
  const groups: Record<string, string[]> = {
    commands: ['activate', 'registerCommand', 'executeCommand', 'showNotification', 'Command', 'Disposable'],
    editor: [
      'getActiveEditor',
      'getEditorSelections',
      'setEditorSelections',
      'openUri',
      'getWorkspaceUri',
      'EditorSelection',
    ],
    files: ['readFile', 'writeFile', 'exists', 'readDirWithFileTypes', 'getPreference', 'setPreference'],
    providers: [
      'registerCompletionProvider',
      'CompletionProvider',
      'CompletionItem',
      'registerDiagnosticProvider',
      'DiagnosticProvider',
      'Diagnostic',
      'registerHoverProvider',
      'HoverProvider',
    ],
    server: ['registerLanguageServer', 'LanguageServerOptions'],
    views: ['registerView', 'showQuickPick', 'showQuickInput', 'createOutputChannel', 'registerStatusBarItemProvider'],
  }
  for (const [name, symbols] of Object.entries(groups)) {
    const content = symbols
      .map((symbol) => {
        const declaration = declarations.get(symbol)
        if (!declaration) throw new Error(`Missing reference declaration: ${symbol}`)
        return declaration
      })
      .join('\n\n')
    await writeFile(resolve(output, `${name}.ts`), content)
  }
  const catalog = [
    `Generated from the installed \`@lvce-editor/api@${version}\` declarations. This catalog includes exported testing and registry helpers as well as extension-facing APIs. Start with the curated reference pages for guidance.`,
    '',
  ]
  for (const [name, declaration] of [...declarations].sort(([left], [right]) => left.localeCompare(right))) {
    catalog.push(`## ${name}`, '', '```ts', declaration, '```', '')
  }
  await writeFile(resolve(output, 'catalog.md'), catalog.join('\n'))
}
