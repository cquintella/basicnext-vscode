# Basic Next for VS Code

Basic Next **0.6.4** language support for Visual Studio Code (extension **0.6.4**).

Aligned with Basic Next 0.6:
* Dual toolchain support: `bni` (reference interpreter, checker, LSP, DAP) and `bnc` (native AOT compiler for executables and WebAssembly).
* Full syntax highlighting for 0.6 language features: `RELEASE`, `WEAK`, `ASYNC`, `AWAIT`, `PROTECTED`, `OVERRIDE`, and `BNSqlite`.
* Standard module snippets: `HOST.FileSystem`, `HOST.Net`, `HOST.Clock`, `HOST.Console`, `HOST.Exec`, `HOST.Random`, `BNSqlite`, `BNData`, `BNLog`, `BNJson`, `BNMath`, `BNDispatch`, `BNCrypto`, `BNWeb`.
* Direct execution and debugging via `bni dap`.

## Install

Package the extension and install the generated VSIX file:

```sh
npx --yes @vscode/vsce package --allow-missing-repository
code --install-extension basicnext-0.6.4.vsix
```

Restart VS Code completely after installing or updating the extension. The
debugger contribution is loaded when the VS Code application starts.

## Configure

| Setting | Default | Description |
| --- | --- | --- |
| `basicnext.executable` | `""` | Path to the `bni` interpreter binary (empty: auto-detect `bni` on PATH) |
| `basicnext.compilerExecutable` | `""` | Path to the `bnc` compiler binary (empty: auto-detect `bnc` on PATH or adjacent to `bni`) |
| `basicnext.autoUppercaseKeywords` | `true` | Uppercase reserved words as you type |
| `basicnext.autoUppercaseOnPaste` | `true` | Also uppercase whole-token inserts (paste/completion) |
| `basicnext.autoUppercaseExclusions` | `[]` | Uppercase spellings to skip (e.g. `["STEP"]`) |
| `basicnext.formatOnSave` | `false` | Uppercase reserved words + normalize `END   FUNCTION` → `END FUNCTION` on save |
| `basicnext.runArgs` | `[]` | Extra args after `bni run` |
| `basicnext.buildArgs` | `[]` | Extra args passed to `bnc` |
| `basicnext.checkArgs` | `[]` | Extra args after `bni check` |
| `basicnext.lspArgs` | `[]` | Extra args after `bni lsp` |
| `basicnext.checkOnSave` | `true` | Run `bni check` on save |
| `basicnext.checkOnType` | `false` | Debounced `bni check` while typing |
| `basicnext.checkDebounceMs` | `500` | Debounce for check-on-type |
| `basicnext.diagnosticsMinimumSeverity` | `warning` | `error` / `warning` / `hint` |
| `basicnext.snippets.enabled` | `true` | Documented; snippets are always contributed — disable via VS Code Snippets UI |
| `basicnext.blockColors.function` | `#C586C0` | FUNCTION / END FUNCTION |
| `basicnext.blockColors.while` | `#D7BA7D` | WHILE / END WHILE |
| `basicnext.blockColors.for` | `#CE9178` | FOR / END FOR |
| `basicnext.blockColors.repeat` | `#DCDCAA` | REPEAT / UNTIL |
| `basicnext.blockColors.conditional` | `#569CD6` | IF / ELSE / END IF |
| `basicnext.blockColors.class` | `#4EC9B0` | CLASS / END CLASS |
| `basicnext.blockColors.flow` | `#F44747` | RETURN / EXIT / CONTINUE / STOP |
| `basicnext.blockColors.await` | `#B267E6` | AWAIT / ASYNC |

Block family colors are applied on activate and when `basicnext.blockColors.*`
changes by merging TextMate rules into workspace/user
`editor.tokenColorCustomizations` (only owned `.bn` scopes are replaced).
`END` shares the same TextMate scope as its block keyword in the grammar.

Default editor settings for `[basicnext]`: tab size 4, insert spaces, detect
indentation.

## Theme

**Basic Next Grid** — dark cyan grid theme. Select it from Color Theme
(`Cmd+K Cmd+T` / `Ctrl+K Ctrl+T`).

## Snippets

Contributed for `FUNCTION`, `WHILE`, `IF`, `FOR`, `REPEAT`, `CLASS`,
`IMPORT HOST.*` capabilities, and standard `IMPORT BN*` libraries (`BNSqlite`,
`BNData`, `BNLog`, `BNJson`, `BNMath`, `BNDispatch`, `BNCrypto`, `BNWeb`).

## Use

* Open a `.bn` file. VS Code selects the `Basic Next` language mode and applies syntax highlighting, folding markers, and indentation rules.
* Status bar shows **Basic Next** plus the `bni` version (or a missing-binary hint). Click for Check / Run / Build and Run.
* The extension starts `bni lsp` (plus `basicnext.lspArgs`) for open Basic Next workspaces and forwards full-document changes. Diagnostics, definition lookup, and completion are provided by the Rust frontend; set `basicnext.executable` if the binary is not on `PATH`.
* Save the file to run `bni check` when `basicnext.checkOnSave` is true; source-spanned errors appear in the Problems panel (filtered by `basicnext.diagnosticsMinimumSeverity`).
* Format Document / format-on-save (when enabled) uppercases reserved words outside strings/comments and normalizes `END` block spacing.
* Use **Basic Next: Run** from the Command Palette, the editor run menu, or `Cmd+F5` (`Ctrl+F5` on Windows/Linux) to run `bni run` (plus `runArgs`) in an integrated terminal.
* Use **Basic Next: Build and Run** or `Cmd+Shift+F5` (`Ctrl+Shift+F5`) to compile with `bnc` to a temporary native artifact and execute it.
* The Run and Debug view exposes **Run Basic Next** through the native `bni dap` service. The adapter forwards DAP over bounded local stdio; it does not open a terminal or execute `bni run` for a debug session.
* Breakpoints, pause, continue, stack/scopes/variables, and stepping are debugger operations. Stepping follows interpreter IR instructions carrying Basic Next source spans: multiple instructions may map to one source line, and loops may revisit a line. The debugger is not a REPL and does not evaluate arbitrary expressions.

The bundled TextMate grammar is synchronized with `docs/library/basicnext.tmLanguage.json`.

Block keywords use distinct TextMate scopes and default colors per block kind.
`END` shares the **same** color as its block keyword (`END FUNCTION` with
`FUNCTION`, `END WHILE` with `WHILE`, `END IF` with `IF`, and likewise for
`FOR` / `CLASS` / `STRUCT` / `INTERFACE` / constructor / destructor).
